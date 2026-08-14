import { IListingProjectRepository, ListingRecord } from '../repositories/IListingProjectRepository';
import { IWorkspaceRepository } from '../repositories/IWorkspaceRepository';
import { IListingService, CreateListingInput, SearchResults } from './IListingService';
import { ILogger } from '../utils/logger';
import { logger as defaultLogger } from '../utils/logger';

/**
 * All business rules for listings (documents/projects inside a workspace)
 * live here: which listings belong to the special "main" workspace, keeping
 * a workspace's projectCount in sync when a listing is created there, and
 * how a text search maps onto listings + their pages. No Express, no
 * Firestore — only repository abstractions, injected via the constructor
 * (Dependency Inversion), so this is unit-testable with fakes.
 */
export class ListingServiceImpl implements IListingService {
  constructor(
    private readonly listingRepo: IListingProjectRepository,
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly logger: ILogger = defaultLogger
  ) {}

  async getAllByUser(owner: string): Promise<ListingRecord[]> {
    return this.listingRepo.findAllByOwner(owner);
  }

  async getByWorkspace(workspaceId: string, owner: string): Promise<ListingRecord[]> {
    const isMain = workspaceId.startsWith('main-');
    if (isMain) {
      const allListings = await this.listingRepo.findAllByOwner(owner);
      return allListings.filter(
        (l) => !l.workspaceId || l.workspaceId === workspaceId || l.workspaceId === 'main'
      );
    }
    return this.listingRepo.findByWorkspaceId(workspaceId);
  }

  async getById(id: string): Promise<ListingRecord | null> {
    return this.listingRepo.findById(id);
  }

  async create(input: CreateListingInput, owner: string): Promise<ListingRecord> {
    const now = new Date().toISOString();
    const listing = await this.listingRepo.create({
      title: input.title,
      description: input.description || '',
      workspaceId: input.workspaceId || 'main', // Default to 'main' for backward compatibility
      owner,
      visibility: input.visibility || 'private',
      tags: input.tags || [],
      addedToNexus: false, // Workspace Hub is completely independent
      createdAt: now,
      updatedAt: now,
      pages: [],
      index: [],
      highlights: [],
    });

    await this.syncWorkspaceProjectCount(input.workspaceId);
    return listing;
  }

  async update(id: string, data: Partial<ListingRecord>): Promise<ListingRecord> {
    return this.listingRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.listingRepo.delete(id);
  }

  async searchInWorkspace(workspaceId: string, searchTerm: string, owner: string): Promise<SearchResults> {
    const listings = await this.getByWorkspace(workspaceId, owner);
    const listingIds = listings.map((l) => l.id);
    if (listingIds.length === 0) return { listings: [], pages: [] };

    const term = searchTerm.toLowerCase();
    const matchedListings = listings.filter(
      (l) => l.title.toLowerCase().includes(term) || (l.description || '').toLowerCase().includes(term)
    );
    const matchedPages = await this.listingRepo.findMatchingPages(listingIds, searchTerm);

    return { listings: matchedListings, pages: matchedPages };
  }

  /** Business rule: creating a listing inside a real workspace bumps that workspace's cached project count. */
  private async syncWorkspaceProjectCount(workspaceId?: string): Promise<void> {
    if (!workspaceId || workspaceId === 'main') return;
    try {
      const workspace = await this.workspaceRepo.findById(workspaceId);
      if (workspace) {
        await this.workspaceRepo.updateProjectCount(workspaceId, (workspace.projectCount || 0) + 1);
      }
    } catch (err) {
      this.logger.error('Failed to sync workspace project count after listing creation', err, { workspaceId });
    }
  }
}
