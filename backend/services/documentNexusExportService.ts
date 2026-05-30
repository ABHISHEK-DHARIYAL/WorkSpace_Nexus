import { DocumentNexusDocumentService } from "./documentNexusDocumentService";
import { DocumentNexusWorkspaceService } from "./documentNexusWorkspaceService";
import { ProjectExporter } from "./projectExporter";
import { ZipService } from "./zipService";

export class DocumentNexusExportService {
  /**
   * Compiles and exports all of standard user's Document Nexus projects inside a single ZIP file.
   */
  static async exportUserDocumentNexus(userEmail: string): Promise<Buffer> {
    if (!userEmail) {
      throw new Error("Unauthorized: User session is missing email validation.");
    }

    // 1. Retrieve all workspaces for this user
    const workspaces = await DocumentNexusWorkspaceService.getAllByUser(userEmail);

    // 2. Retrieve all documents owned by the user for Document Nexus
    const nexusListings = await DocumentNexusDocumentService.getAllByUser(userEmail);

    if (nexusListings.length === 0) {
      throw new Error("No projects found in your Document Nexus to export. Import or create a project in the Document Nexus first!");
    }

    // 4. Fetch all projects detailed data in parallel
    const allProjectsData = await Promise.all(
      nexusListings.map(async (listing) => {
        const rawData = await ProjectExporter.exportProjectData(listing.id, userEmail, false);
        return {
          workspaceId: listing.workspaceId || "main",
          rawData
        };
      })
    );

    // 5. Group by workspace ID / name
    const workspaceMap = new Map<string, string>();
    workspaces.forEach(w => {
      workspaceMap.set(w.id, w.name);
    });

    const groupedWorkspaces: { [wsName: string]: any[] } = {};

    allProjectsData.forEach(({ workspaceId, rawData }) => {
      let wsName = workspaceMap.get(workspaceId);
      if (!wsName) {
        if (workspaceId.startsWith("main")) {
          wsName = "Main Workspace";
        } else {
          wsName = "Workspace-" + workspaceId;
        }
      }

      if (!groupedWorkspaces[wsName]) {
        groupedWorkspaces[wsName] = [];
      }
      groupedWorkspaces[wsName].push(rawData);
    });

    // 6. Convert to standard payload format expected by ZipService
    const groupedPayload = Object.keys(groupedWorkspaces).map(wsName => ({
      workspaceName: wsName,
      projects: groupedWorkspaces[wsName]
    }));

    // 7. Output compiled buffer via ZipService
    return await ZipService.generateDocumentNexusZip(groupedPayload);
  }
}
