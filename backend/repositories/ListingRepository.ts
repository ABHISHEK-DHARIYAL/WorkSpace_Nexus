import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  db,
} from '../config/firebase';
import { IListingRepository } from './IListingRepository';
import { IListingProjectRepository, ListingRecord, ListingPageMatch } from './IListingProjectRepository';

const LISTINGS_COLLECTION = 'workspaceHubProjects';
const PAGES_COLLECTION = 'pages';
const HIGHLIGHTS_COLLECTION = 'highlights';

/**
 * The only file allowed to know listings live in Firestore's
 * "workspaceHubProjects" collection, or that a listing's pages/highlights
 * live in their own collections keyed by listingId/pageId. Implements two
 * segregated interfaces (Interface Segregation Principle) so each consumer
 * only depends on what it actually uses:
 *   - IListingRepository:      the narrow "summaries for counting" contract
 *                               WorkspaceService depends on
 *   - IListingProjectRepository: the full CRUD + cascade contract
 *                               ListingService depends on
 */
export class ListingRepository implements IListingRepository, IListingProjectRepository {
  async findAllByOwner(owner: string): Promise<ListingRecord[]> {
    return this.queryAndHeal(query(collection(db, LISTINGS_COLLECTION), where('owner', '==', owner)), true);
  }

  async findByWorkspaceId(workspaceId: string): Promise<ListingRecord[]> {
    const listings = await this.queryAndHeal(
      query(collection(db, LISTINGS_COLLECTION), where('workspaceId', '==', workspaceId)),
      false
    );
    listings.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    return listings;
  }

  async findById(id: string): Promise<ListingRecord | null> {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const listing = { id: docSnap.id, ...(docSnap.data() as any) } as ListingRecord;
    return this.healMissingPages(docRef, listing);
  }

  async create(data: Omit<ListingRecord, 'id'>): Promise<ListingRecord> {
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), data);
    return { id: docRef.id, ...data } as ListingRecord;
  }

  async update(id: string, data: Partial<ListingRecord>): Promise<ListingRecord> {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, updateData);
    return { id, ...updateData } as ListingRecord;
  }

  async delete(id: string): Promise<void> {
    // Cascade: delete every page owned by this listing, and every highlight
    // owned by each of those pages, before removing the listing itself.
    const pagesSnapshot = await getDocs(query(collection(db, PAGES_COLLECTION), where('listingId', '==', id)));

    await Promise.all(
      pagesSnapshot.docs.map(async (pageDoc) => {
        const highlightsSnapshot = await getDocs(
          query(collection(db, HIGHLIGHTS_COLLECTION), where('pageId', '==', pageDoc.id))
        );
        await Promise.all(highlightsSnapshot.docs.map((hDoc) => deleteDoc(hDoc.ref)));
        await deleteDoc(pageDoc.ref);
      })
    );

    await deleteDoc(doc(db, LISTINGS_COLLECTION, id));
  }

  async findMatchingPages(listingIds: string[], searchTerm: string): Promise<ListingPageMatch[]> {
    if (listingIds.length === 0 || searchTerm.length <= 2) return [];

    const term = searchTerm.toLowerCase();
    let matchedPages: ListingPageMatch[] = [];

    // Firestore 'in' query limit is 30, so batch in chunks.
    for (let i = 0; i < listingIds.length; i += 30) {
      const chunk = listingIds.slice(i, i + 30);
      const snap = await getDocs(query(collection(db, PAGES_COLLECTION), where('listingId', 'in', chunk)));
      const pages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ListingPageMatch[];
      const filtered = pages.filter(
        (p) => p.title.toLowerCase().includes(term) || p.content.toLowerCase().includes(term)
      );
      matchedPages = [...matchedPages, ...filtered];
    }

    return matchedPages;
  }

  /** Shared query + read-repair helper for the two "list" read paths. */
  private async queryAndHeal(q: ReturnType<typeof query>, sortByUpdatedAt: boolean): Promise<ListingRecord[]> {
    const snapshot = await getDocs(q);
    let listings = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ListingRecord[];
    if (sortByUpdatedAt) {
      listings.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    }

    return Promise.all(
      listings.map((listing) => this.healMissingPages(doc(db, LISTINGS_COLLECTION, listing.id), listing))
    );
  }

  /**
   * Read-repair: a listing's `pages` array can drift out of sync with the
   * real `pages` collection (e.g. from an interrupted write elsewhere). If
   * it looks empty, reconcile against the source of truth and persist the
   * fix, exactly matching the previous inline behavior.
   */
  private async healMissingPages(docRef: ReturnType<typeof doc>, listing: ListingRecord): Promise<ListingRecord> {
    if (listing.pages && listing.pages.length > 0) return listing;

    const pagesSnapshot = await getDocs(query(collection(db, PAGES_COLLECTION), where('listingId', '==', listing.id)));
    if (pagesSnapshot.size === 0) return listing;

    const pageIds = pagesSnapshot.docs.map((d) => d.id);
    await updateDoc(docRef, { pages: pageIds, updatedAt: new Date().toISOString() });
    return { ...listing, pages: pageIds };
  }
}
