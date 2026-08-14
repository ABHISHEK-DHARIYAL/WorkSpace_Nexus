export interface ListingSummary {
  id: string;
  owner: string;
  workspaceId?: string;
  [key: string]: any;
}

/**
 * Deliberately minimal (Interface Segregation): WorkspaceService only ever
 * needs "all listings owned by X" to recompute a workspace's project count.
 * It must not depend on a fat repository exposing create/update/delete
 * methods it never calls. A full listing-feature repository (for the
 * listing controller/service themselves) is a separate future pass.
 */
export interface IListingRepository {
  findAllByOwner(owner: string): Promise<ListingSummary[]>;
}
