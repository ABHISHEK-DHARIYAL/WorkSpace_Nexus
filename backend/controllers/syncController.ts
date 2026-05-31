import { Request, Response } from "express";
import { readCollection, writeCollection } from "../config/firebase";
import { AuthRequest } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

export class SyncController {
  /**
   * Export all items belonging to the current user across all collections
   */
  static async exportBackup(req: AuthRequest, res: Response) {
    try {
      const email = req.user?.email || "";
      const uid = req.user?.uid || "";
      if (!email && !uid) {
        return sendError(res, "User identity not found in request", 401);
      }

      const matchUser = (val: any) => {
        if (!val) return false;
        const owner = (val.owner || "").toString().toLowerCase();
        const userId = (val.userId || "").toString().toLowerCase();
        const userMatch = (val.user || "").toString().toLowerCase();
        
        return (
          owner === email.toLowerCase() ||
          owner === uid.toLowerCase() ||
          userId === email.toLowerCase() ||
          userId === uid.toLowerCase() ||
          userMatch === email.toLowerCase() ||
          userMatch === uid.toLowerCase()
        );
      };

      // 1. Read Workspaces
      const workspacesMap = readCollection("workspaceHubWorkspaces");
      const userWorkspaces = Object.entries(workspacesMap)
        .filter(([_, val]) => matchUser(val))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const workspaceIds = Object.keys(userWorkspaces);

      // 2. Read Projects / Listings
      const projectsMap = readCollection("workspaceHubProjects");
      const userProjects = Object.entries(projectsMap)
        .filter(([_, val]) => matchUser(val) || (val.workspaceId && workspaceIds.includes(val.workspaceId)))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const projectIds = Object.keys(userProjects);

      // 3. Read Pages belonging to those projects
      const pagesMap = readCollection("pages");
      const userPages = Object.entries(pagesMap)
        .filter(([_, val]) => val && projectIds.includes(val.listingId))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      // 4. Read Document Nexus Workspaces
      const nexusWorkspacesMap = readCollection("documentNexusWorkspaces");
      const userNexusWorkspaces = Object.entries(nexusWorkspacesMap)
        .filter(([_, val]) => matchUser(val))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const nexusWorkspaceIds = Object.keys(userNexusWorkspaces);

      // 5. Read Document Nexus Documents
      const nexusDocumentsMap = readCollection("documentNexusDocuments");
      const userNexusDocuments = Object.entries(nexusDocumentsMap)
        .filter(([_, val]) => matchUser(val) || (val.workspaceId && nexusWorkspaceIds.includes(val.workspaceId)))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const nexusDocumentIds = Object.keys(userNexusDocuments);

      // 6. Read doc_pages and doc_indices
      const docPagesMap = readCollection("doc_pages");
      const userDocPages = Object.entries(docPagesMap)
        .filter(([_, val]) => val && nexusDocumentIds.includes(val.projectId))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const docIndicesMap = readCollection("doc_indices");
      const userDocIndices = Object.entries(docIndicesMap)
        .filter(([_, val]) => val && nexusDocumentIds.includes(val.projectId))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      // 7. Read Highlights & Annotations
      const highlightsMap = readCollection("highlights");
      const userHighlights = Object.entries(highlightsMap)
        .filter(([_, val]) => matchUser(val) || (val && (projectIds.includes(val.listingId) || nexusDocumentIds.includes(val.listingId))))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      const annotationsMap = readCollection("annotations");
      const userAnnotations = Object.entries(annotationsMap)
        .filter(([_, val]) => matchUser(val))
        .reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});

      // 8. Read User profile document
      const usersMap = readCollection("users");
      const userProfile = usersMap[email.toLowerCase()] || usersMap[uid.toLowerCase()] || null;

      const payload = {
        workspaceHubWorkspaces: userWorkspaces,
        workspaceHubProjects: userProjects,
        pages: userPages,
        documentNexusWorkspaces: userNexusWorkspaces,
        documentNexusDocuments: userNexusDocuments,
        doc_pages: userDocPages,
        doc_indices: userDocIndices,
        highlights: userHighlights,
        annotations: userAnnotations,
        userProfile
      };

      console.log(`[Backup Sync] Staging export payload generated for user: ${email}`);
      return sendSuccess(res, { message: "Backup export completed successfully", data: payload });
    } catch (err: any) {
      console.error("[Backup Sync] Export failure:", err);
      return sendError(res, err.message || "Failed to export sync backup", 500);
    }
  }

  /**
   * Import/Restore database items for the user from a Firestore backup snapshot
   */
  static async importRestore(req: AuthRequest, res: Response) {
    try {
      const email = req.user?.email || "";
      const uid = req.user?.uid || "";
      if (!email && !uid) {
        return sendError(res, "User identity not found in request", 401);
      }

      const backup = req.body;
      if (!backup || typeof backup !== "object") {
        return sendError(res, "Missing or invalid backup payload in body", 400);
      }

      console.log(`[Backup Sync] Staging database recovery & restoration for user: ${email}...`);

      const restoreCollection = (colName: string, items: Record<string, any>) => {
        if (!items || typeof items !== "object") return;
        const currentData = readCollection(colName);
        let restoredCount = 0;
        
        for (const [id, value] of Object.entries(items)) {
          if (!value || id === "undefined") continue;
          currentData[id] = value;
          restoredCount++;
        }
        
        if (restoredCount > 0) {
          writeCollection(colName, currentData);
          console.log(`[Backup Sync] Restored ${restoredCount} items into "${colName}"`);
        }
      };

      // Sequentially restore all collections
      restoreCollection("workspaceHubWorkspaces", backup.workspaceHubWorkspaces);
      restoreCollection("workspaceHubProjects", backup.workspaceHubProjects);
      restoreCollection("pages", backup.pages);
      restoreCollection("documentNexusWorkspaces", backup.documentNexusWorkspaces);
      restoreCollection("documentNexusDocuments", backup.documentNexusDocuments);
      restoreCollection("doc_pages", backup.doc_pages);
      restoreCollection("doc_indices", backup.doc_indices);
      restoreCollection("highlights", backup.highlights);
      restoreCollection("annotations", backup.annotations);

      // Restore user profile if available
      if (backup.userProfile) {
        const usersMap = readCollection("users");
        usersMap[email.toLowerCase()] = {
          ...(usersMap[email.toLowerCase()] || {}),
          ...backup.userProfile
        };
        writeCollection("users", usersMap);
        console.log(`[Backup Sync] Restored user profile for: ${email}`);
      }

      console.log(`[Backup Sync] Recovery & restore completed successfully for user: ${email}`);
      return sendSuccess(res, { message: "Restoration complete", success: true });
    } catch (err: any) {
      console.error("[Backup Sync] Import failure:", err);
      return sendError(res, err.message || "Failed to import/restore data", 500);
    }
  }
}
