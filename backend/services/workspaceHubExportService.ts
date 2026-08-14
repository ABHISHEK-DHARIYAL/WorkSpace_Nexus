
import { ProjectExporter } from "./projectExporter";
import { ZipService } from "./zipService";
import { listingService } from "../di/container";

export class WorkspaceHubExportService {
  /**
   * Aggregates and zips all Workspace Hub projects owned by the authenticated user.
   * Ensures that the export excludes Document Nexus projects.
   */
  static async exportUserWorkspaceHub(userEmail: string): Promise<Buffer> {
    if (!userEmail) {
      throw new Error("Unauthorized: User session is missing email validation.");
    }

    // 1. Get all listings owned by the user
    const hubListings = await listingService.getAllByUser(userEmail);

    if (hubListings.length === 0) {
      throw new Error("No projects found in your Workspace Hub to export.");
    }

    // 3. For each project, fetch its associated pages, indices, highlights, bookmarks, annotations safely
    const allProjectsData = await Promise.all(
      hubListings.map(async (listing) => {
        return await ProjectExporter.exportProjectData(listing.id, userEmail, false);
      })
    );

    // 4. Send the compiled payload to ZipService for custom structured packing
    return await ZipService.generateWorkspaceHubZip(allProjectsData);
  }
}
