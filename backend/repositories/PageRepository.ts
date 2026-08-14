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
import { IPageRepository, PageRecord, DraftRecord } from './IPageRepository';

const PAGES_COLLECTION = 'pages';
const PROJECTS_COLLECTION = 'workspaceHubProjects';
const LEGACY_LISTINGS_COLLECTION = 'listings';
const DRAFTS_COLLECTION = 'drafts';

export class PageRepository implements IPageRepository {
  async findByListingId(listingId: string): Promise<PageRecord[]> {
    const snapshot = await getDocs(query(collection(db, PAGES_COLLECTION), where('listingId', '==', listingId)));
    const pages = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PageRecord[];
    pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    return pages;
  }

  async findById(id: string): Promise<PageRecord | null> {
    const docSnap = await getDoc(doc(db, PAGES_COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as any) } as PageRecord;
  }

  async findByWorkspaceId(workspaceId: string): Promise<PageRecord[]> {
    const listingIds = await this.collectListingIdsByField('workspaceId', workspaceId);
    return this.findPagesForListingIds(listingIds);
  }

  async findAllByOwner(owner: string): Promise<PageRecord[]> {
    const listingIds = await this.collectListingIdsByField('owner', owner);
    return this.findPagesForListingIds(listingIds);
  }

  async create(data: Omit<PageRecord, 'id'>): Promise<PageRecord> {
    const docRef = await addDoc(collection(db, PAGES_COLLECTION), data);
    const createdPage = { id: docRef.id, ...data } as PageRecord;

    // Keep the parent listing's cached `pages` array in sync, checking both
    // the current and legacy listing collections (a page's parent could be
    // in either, exactly as the original implementation handled it).
    await this.addPageToParent(PROJECTS_COLLECTION, data.listingId, docRef.id);
    await this.addPageToParent(LEGACY_LISTINGS_COLLECTION, data.listingId, docRef.id);

    return createdPage;
  }

  async update(id: string, data: Partial<PageRecord>): Promise<PageRecord> {
    const docRef = doc(db, PAGES_COLLECTION, id);
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, updateData);
    return { id, ...updateData } as PageRecord;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, PAGES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const listingId = (docSnap.data() as any).listingId;
      await deleteDoc(docRef);
      await this.removePageFromParent(PROJECTS_COLLECTION, listingId, id);
      await this.removePageFromParent(LEGACY_LISTINGS_COLLECTION, listingId, id);
    } else {
      // Matches prior behavior: still issue the delete call even if the
      // doc snapshot didn't exist (harmless no-op), rather than short-circuiting.
      await deleteDoc(docRef);
    }
  }

  async saveDraft(pageId: string, userId: string, content: string): Promise<void> {
    const draftRef = doc(db, DRAFTS_COLLECTION, `${pageId}_${userId}`);
    await updateDoc(draftRef, { content, updatedAt: new Date().toISOString() }).catch(async () => {
      await addDoc(collection(db, DRAFTS_COLLECTION), {
        pageId,
        userId,
        content,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async getDraft(pageId: string, userId: string): Promise<DraftRecord | null> {
    const snap = await getDocs(
      query(collection(db, DRAFTS_COLLECTION), where('pageId', '==', pageId), where('userId', '==', userId))
    );
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as DraftRecord;
  }

  /** Finds listing IDs matching a field, across both the current and legacy listing collections. */
  private async collectListingIdsByField(field: string, value: string): Promise<string[]> {
    const projectsSnap = await getDocs(query(collection(db, PROJECTS_COLLECTION), where(field, '==', value)));
    const projectIds = projectsSnap.docs.map((d) => d.id);

    const legacySnap = await getDocs(query(collection(db, LEGACY_LISTINGS_COLLECTION), where(field, '==', value)));
    const legacyIds = legacySnap.docs.map((d) => d.id);

    return Array.from(new Set([...projectIds, ...legacyIds]));
  }

  /** Batched (Firestore 'in' query limit is 30) lookup of pages for a set of listing IDs. */
  private async findPagesForListingIds(listingIds: string[]): Promise<PageRecord[]> {
    if (listingIds.length === 0) return [];

    const matchedPages: PageRecord[] = [];
    for (let i = 0; i < listingIds.length; i += 30) {
      const chunk = listingIds.slice(i, i + 30);
      const snap = await getDocs(query(collection(db, PAGES_COLLECTION), where('listingId', 'in', chunk)));
      matchedPages.push(...snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PageRecord[]);
    }
    return matchedPages;
  }

  private async addPageToParent(collectionName: string, listingId: string, pageId: string): Promise<void> {
    const parentRef = doc(db, collectionName, listingId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return;

    const pages = (parentSnap.data() as any).pages || [];
    if (!pages.includes(pageId)) {
      await updateDoc(parentRef, { pages: [...pages, pageId], updatedAt: new Date().toISOString() });
    }
  }

  private async removePageFromParent(collectionName: string, listingId: string, pageId: string): Promise<void> {
    const parentRef = doc(db, collectionName, listingId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return;

    const pages = ((parentSnap.data() as any).pages || []).filter((pId: string) => pId !== pageId);
    await updateDoc(parentRef, { pages, updatedAt: new Date().toISOString() });
  }
}
