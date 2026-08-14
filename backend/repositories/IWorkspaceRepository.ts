export interface WorkspaceRecord {
  id: string;
  name: string;
  description?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  [key: string]: any;
}

/**
 * Pure persistence contract for the workspace collection — no business
 * rules live here (e.g. "create a default workspace if none exist" is a
 * business rule, so it belongs in the service, not the repository).
 */
export interface IWorkspaceRepository {
  findAllByOwner(owner: string): Promise<WorkspaceRecord[]>;
  findById(id: string): Promise<WorkspaceRecord | null>;
  create(data: Omit<WorkspaceRecord, 'id'>): Promise<WorkspaceRecord>;
  createWithId(id: string, data: Omit<WorkspaceRecord, 'id'>): Promise<WorkspaceRecord>;
  update(id: string, data: Partial<WorkspaceRecord>): Promise<WorkspaceRecord>;
  updateProjectCount(id: string, projectCount: number): Promise<void>;
  delete(id: string): Promise<void>;
}
