import { WorkspaceRecord } from '../repositories/IWorkspaceRepository';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Controllers depend on this interface, never on the concrete
 * WorkspaceService class. Any object implementing this shape — a real
 * service, or a test double — can stand in (Liskov Substitution).
 */
export interface IWorkspaceService {
  getAllByUser(owner: string): Promise<WorkspaceRecord[]>;
  getById(id: string): Promise<WorkspaceRecord>;
  create(input: CreateWorkspaceInput, owner: string): Promise<WorkspaceRecord>;
  update(id: string, input: UpdateWorkspaceInput): Promise<WorkspaceRecord>;
  delete(id: string): Promise<void>;
}
