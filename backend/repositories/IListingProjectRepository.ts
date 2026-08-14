export interface ListingRecord {
  id: string;
  title: string;
  description?: string;
  workspaceId: string;
  owner: string;
  visibility: 'private' | 'public';
  tags?: string[];
  addedToNexus?: boolean;
  createdAt: string;
  updatedAt: string;
  pages: string[];
  index?: any[];
  highlights?: any[];
  [key: string]: any;
}

export interface ListingPageMatch {
  id: string;
  title: string;
  content: string;
  listingId: string;
  [key: string]: any;
}

/**
 * Full persistence contract for the "listing" aggregate (a document/project
 * inside a workspace) — this is a separate, larger interface from the
 * minimal IListingRepository used by WorkspaceService, matching Interface
 * Segregation: WorkspaceService never sees create/update/delete, and
 * ListingService never needs to know about that narrower interface.
 *
 * The listing "owns" its pages and highlights (they cannot exist without a
 * parent listing), so cascade deletion of owned child documents is treated
 * as part of this repository's `delete` contract rather than leaked out to
 * the service layer as raw Firestore collection knowledge.
 */
export interface IListingProjectRepository {
  findAllByOwner(owner: string): Promise<ListingRecord[]>;
  findByWorkspaceId(workspaceId: string): Promise<ListingRecord[]>;
  findById(id: string): Promise<ListingRecord | null>;
  create(data: Omit<ListingRecord, 'id'>): Promise<ListingRecord>;
  update(id: string, data: Partial<ListingRecord>): Promise<ListingRecord>;
  /** Deletes the listing along with every page and highlight it owns. */
  delete(id: string): Promise<void>;
  /** Batched full-text-ish search across pages belonging to the given listings. */
  findMatchingPages(listingIds: string[], searchTerm: string): Promise<ListingPageMatch[]>;
}
