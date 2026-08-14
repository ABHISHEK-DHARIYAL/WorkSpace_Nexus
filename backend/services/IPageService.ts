import { PageRecord } from '../repositories/IPageRepository';

export interface IPageService {
  getByListing(listingId: string): Promise<PageRecord[]>;
  getByWorkspace(workspaceId: string): Promise<PageRecord[]>;
  getAllByUser(owner: string): Promise<PageRecord[]>;
  create(data: any): Promise<PageRecord>;
  update(id: string, data: any): Promise<PageRecord>;
  delete(id: string): Promise<void>;
}
