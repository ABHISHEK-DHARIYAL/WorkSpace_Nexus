import { IPageRepository, PageRecord } from '../repositories/IPageRepository';
import { IPageService } from './IPageService';

/**
 * Business logic for pages. No Express, no Firestore — only the
 * IPageRepository abstraction, injected via the constructor.
 *
 * Note: `update` intentionally throws plain `Error`s (not typed AppError
 * subclasses) for the "missing id" / "not found" cases, exactly matching
 * the original implementation's behavior of surfacing those as generic
 * 500s through the error handler rather than 400/404s. This looks like it
 * could be an old bug, but this pass's job is preserving behavior, not
 * fixing it — that's a decision for a deliberate follow-up, not a side
 * effect of a refactor.
 */
export class PageServiceImpl implements IPageService {
  constructor(private readonly pageRepo: IPageRepository) {}

  async getByListing(listingId: string): Promise<PageRecord[]> {
    return this.pageRepo.findByListingId(listingId);
  }

  async getByWorkspace(workspaceId: string): Promise<PageRecord[]> {
    return this.pageRepo.findByWorkspaceId(workspaceId);
  }

  async getAllByUser(owner: string): Promise<PageRecord[]> {
    return this.pageRepo.findAllByOwner(owner);
  }

  async create(data: any): Promise<PageRecord> {
    return this.pageRepo.create({
      listingId: data.listingId,
      title: data.title,
      content: data.content || '',
      pageNumber: data.pageNumber || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async update(id: string, data: any): Promise<PageRecord> {
    if (!id) throw new Error('Page ID is required for update');

    const existing = await this.pageRepo.findById(id);
    if (!existing) {
      throw new Error(`Page with ID ${id} not found`);
    }

    return this.pageRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.pageRepo.delete(id);
  }
}
