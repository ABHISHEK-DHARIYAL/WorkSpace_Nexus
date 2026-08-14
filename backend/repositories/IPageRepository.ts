export interface PageRecord {
  id: string;
  listingId: string;
  title: string;
  content: string;
  pageNumber: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface DraftRecord {
  id: string;
  pageId: string;
  userId: string;
  content: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * Persistence contract for pages. A page belongs to a listing (either a
 * current "workspaceHubProjects" doc or a legacy "listings" doc — both are
 * queried for backward compatibility, exactly as the original code did),
 * and creating/deleting a page keeps that parent's cached `pages` array in
 * sync as part of the same persistence operation.
 */
export interface IPageRepository {
  findByListingId(listingId: string): Promise<PageRecord[]>;
  findById(id: string): Promise<PageRecord | null>;
  /** All pages belonging to any listing (current or legacy) inside a workspace. */
  findByWorkspaceId(workspaceId: string): Promise<PageRecord[]>;
  /** All pages belonging to any listing (current or legacy) owned by a user. */
  findAllByOwner(owner: string): Promise<PageRecord[]>;
  create(data: Omit<PageRecord, 'id'>): Promise<PageRecord>;
  update(id: string, data: Partial<PageRecord>): Promise<PageRecord>;
  delete(id: string): Promise<void>;
  saveDraft(pageId: string, userId: string, content: string): Promise<void>;
  getDraft(pageId: string, userId: string): Promise<DraftRecord | null>;
}
