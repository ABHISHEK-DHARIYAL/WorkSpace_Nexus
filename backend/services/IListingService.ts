import { ListingRecord } from '../repositories/IListingProjectRepository';

export interface CreateListingInput {
  title: string;
  description?: string;
  workspaceId?: string;
  visibility?: 'private' | 'public';
  tags?: string[];
}

export interface SearchResults {
  listings: ListingRecord[];
  pages: any[];
}

/**
 * Public contract for the listing feature. Note `getById` intentionally
 * returns `null` (rather than throwing) for a missing listing — callers
 * disagree on whether "not found" is an error (the read endpoint treats it
 * as a 404) or a tolerated no-op (the delete endpoint silently proceeds),
 * so that decision is left to each caller rather than baked into the
 * service.
 */
export interface IListingService {
  getAllByUser(owner: string): Promise<ListingRecord[]>;
  getByWorkspace(workspaceId: string, owner: string): Promise<ListingRecord[]>;
  getById(id: string): Promise<ListingRecord | null>;
  create(input: CreateListingInput, owner: string): Promise<ListingRecord>;
  update(id: string, data: Partial<ListingRecord>): Promise<ListingRecord>;
  delete(id: string): Promise<void>;
  searchInWorkspace(workspaceId: string, searchTerm: string, owner: string): Promise<SearchResults>;
}
