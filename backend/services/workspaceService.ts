import { IWorkspaceRepository, WorkspaceRecord } from '../repositories/IWorkspaceRepository';
import { IListingRepository } from '../repositories/IListingRepository';
import { IWorkspaceService, CreateWorkspaceInput, UpdateWorkspaceInput } from './IWorkspaceService';
import { IListingService } from './IListingService';
import { NotFoundError } from '../errors';
import { ILogger } from '../utils/logger';
import { logger as defaultLogger } from '../utils/logger';

/**
 * All business rules for workspaces live here, and only here:
 *   - every user gets an auto-created "Main Workspace" the first time they
 *     have none
 *   - a workspace's projectCount is continuously auto-healed against the
 *     real listing count rather than trusted as a stored value
 *   - deleting a workspace deletes every listing inside it too (and, by
 *     extension via IListingService.delete, every page and highlight each
 *     of those listings owns) — a workspace is the root of that whole tree,
 *     so nothing should be left behind as an orphan when it's removed
 *
 * This class knows nothing about Express (no req/res) and nothing about
 * Firestore (only the repository/service abstractions) — all dependencies
 * are injected via the constructor (Dependency Inversion), so this class is
 * trivially unit-testable with fakes and the persistence layer can be
 * swapped without touching a single line here.
 */
export class WorkspaceServiceImpl implements IWorkspaceService {
  constructor(
    private readonly workspaceRepo: IWorkspaceRepository,
    private readonly listingRepo: IListingRepository,
    private readonly listingService: IListingService,
    private readonly logger: ILogger = defaultLogger
  ) {}

  async getAllByUser(owner: string): Promise<WorkspaceRecord[]> {
    let workspaces = await this.workspaceRepo.findAllByOwner(owner);
    workspaces.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    if (workspaces.length === 0) {
      workspaces = [await this.createDefaultWorkspace(owner)];
    }

    await this.syncProjectCounts(workspaces, owner);
    return workspaces;
  }

  async getById(id: string): Promise<WorkspaceRecord> {
    const workspace = await this.workspaceRepo.findById(id);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }
    await this.syncProjectCounts([workspace], workspace.owner);
    return workspace;
  }

  async create(input: CreateWorkspaceInput, owner: string): Promise<WorkspaceRecord> {
    const now = new Date().toISOString();
    return this.workspaceRepo.create({
      name: input.name,
      description: input.description || '',
      owner,
      createdAt: now,
      updatedAt: now,
      projectCount: 0,
    });
  }

  async update(id: string, input: UpdateWorkspaceInput): Promise<WorkspaceRecord> {
    return this.workspaceRepo.update(id, { ...input, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    const workspace = await this.workspaceRepo.findById(id);
    if (workspace) {
      const listingsInWorkspace = await this.listingService.getByWorkspace(id, workspace.owner);
      await Promise.all(listingsInWorkspace.map((listing) => this.listingService.delete(listing.id)));
    }
    await this.workspaceRepo.delete(id);
  }

  /** Business rule: a brand-new user always gets one default workspace to start in. */
  private async createDefaultWorkspace(owner: string): Promise<WorkspaceRecord> {
    const defaultId = `main-${owner.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const now = new Date().toISOString();
    return this.workspaceRepo.createWithId(defaultId, {
      name: 'Main Workspace',
      description: 'Your default workspace for projects.',
      owner,
      createdAt: now,
      updatedAt: now,
      projectCount: 0,
    });
  }

  /**
   * Business rule: projectCount is never trusted as a stored value — it's
   * recomputed from real listing data and the record auto-healed if it
   * drifts. Mutates the passed-in records in place (matching prior behavior)
   * so callers see the corrected count immediately.
   */
  private async syncProjectCounts(workspaces: WorkspaceRecord[], owner: string): Promise<void> {
    try {
      const allListings = await this.listingRepo.findAllByOwner(owner);

      for (const ws of workspaces) {
        const isMain = ws.id.startsWith('main-');
        const wsListingCount = allListings.filter((listing) => {
          if (isMain) {
            return !listing.workspaceId || listing.workspaceId === ws.id || listing.workspaceId === 'main';
          }
          return listing.workspaceId === ws.id;
        }).length;

        if (ws.projectCount !== wsListingCount) {
          await this.workspaceRepo.updateProjectCount(ws.id, wsListingCount);
          ws.projectCount = wsListingCount;
        }
      }
    } catch (err) {
      this.logger.error('Failed to dynamically sync workspace project counts', err, { owner });
    }
  }
}
