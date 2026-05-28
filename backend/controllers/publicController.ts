
type AuthRequest = import("../middleware/auth").AuthRequest;


type Response = import("express").Response;
const { PublicExplorerService } = require("../services/publicExplorer");
const { sendSuccess, sendError } = require("../utils/response");
const { ListingService } = require("../services/listingService");
const { PageService } = require("../services/pageService");
const { WorkspaceService } = require("../services/workspaceService");
const { DocPageService } = require("../services/docPageService");
const { DocIndexService } = require("../services/docIndexService");

class PublicController {
  // GET /api/public/dashboardHub
  static async getDashboardHub(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user?.role === "admin";
      const result = await PublicExplorerService.getDashboardHub(req.user?.email, isAdmin);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.getDashboardHub error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/documentNexus
  static async getDocumentNexus(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user?.role === "admin";
      const result = await PublicExplorerService.getDocumentNexus(req.user?.email, isAdmin);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.getDocumentNexus error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/projects
  static async getProjects(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user?.role === "admin";
      const listings = await PublicExplorerService.getProjects(isAdmin);
      return sendSuccess(res, listings);
    } catch (error: any) {
      console.error("PublicController.getProjects error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/project/:id
  static async getProjectById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === "admin";
      const project = await PublicExplorerService.getProjectById(id, isAdmin);
      if (!project) return sendError(res, "Public project not found", 404);
      return sendSuccess(res, project);
    } catch (error: any) {
      console.error("PublicController.getProjectById error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/page/:id
  static async getPageById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === "admin";
      const page = await PublicExplorerService.getPageById(id, isAdmin);
      if (!page) return sendError(res, "Public document not found or access denied", 404);
      return sendSuccess(res, page);
    } catch (error: any) {
      console.error("PublicController.getPageById error:", error);
      return sendError(res, error.message);
    }
  }

  // PATCH /api/public/project/:id/visibility (or PATCH /api/listing/:id/visibility)
  static async updateProjectVisibility(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { visibility, tags } = req.body;

      // Verify ownership
      const project = await ListingService.getById(id);
      if (!project) return sendError(res, "Project not found", 404);

      if (project.owner !== req.user.email && req.user.role !== "admin") {
        return sendError(res, "You are not authorized to edit this project's visibility settings", 403);
      }

      const updatePayload: any = {};
      if (visibility) {
        if (visibility !== "private" && visibility !== "public") {
          return sendError(res, "Invalid visibility option. Must be 'private' or 'public'", 400);
        }
        updatePayload.visibility = visibility;
      }
      if (tags) {
        if (!Array.isArray(tags)) {
          return sendError(res, "Tags must be configured as an array of labels", 400);
        }
        updatePayload.tags = tags;
      }

      const updated = await ListingService.update(id, updatePayload);
      return sendSuccess(res, updated);
    } catch (error: any) {
      console.error("PublicController.updateProjectVisibility error:", error);
      return sendError(res, error.message);
    }
  }

  // POST /api/public/bookmarks
  static async toggleBookmark(req: AuthRequest, res: Response) {
    try {
      const { pageId, projectId } = req.body;
      if (!pageId || !projectId) {
        return sendError(res, "pageId and projectId are required to bookmark pages", 400);
      }
      const result = await PublicExplorerService.toggleBookmark(req.user.email, { pageId, projectId });
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.toggleBookmark error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/bookmarks
  static async getBookmarks(req: AuthRequest, res: Response) {
    try {
      const result = await PublicExplorerService.getBookmarks(req.user.email);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.getBookmarks error:", error);
      return sendError(res, error.message);
    }
  }

  // POST /api/public/favorites
  static async toggleFavorite(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.body;
      if (!projectId) return sendError(res, "projectId is required map favorites", 400);
      const result = await PublicExplorerService.toggleFavorite(req.user.email, projectId);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.toggleFavorite error:", error);
      return sendError(res, error.message);
    }
  }

  // POST /api/public/follow
  static async toggleFollow(req: AuthRequest, res: Response) {
    try {
      const { targetEmail } = req.body;
      if (!targetEmail) return sendError(res, "targetEmail is required to map creators follows", 400);
      if (targetEmail === req.user.email) {
        return sendError(res, "You cannot follow your own creator profile", 400);
      }
      const result = await PublicExplorerService.toggleFollow(req.user.email, targetEmail);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.toggleFollow error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/follows
  static async getFollows(req: AuthRequest, res: Response) {
    try {
      const result = await PublicExplorerService.getFollowRelations(req.user.email);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.getFollows error:", error);
      return sendError(res, error.message);
    }
  }

  // GET /api/public/audit-logs (Admin Only)
  static async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") return sendError(res, "Access Denied. Admins only.", 403);
      const logs = await PublicExplorerService.getAdminAuditLogs();
      return sendSuccess(res, logs);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  // PATCH /api/public/moderate/:id
  static async moderateProject(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") return sendError(res, "Access Denied. Admins only.", 403);
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!action) return sendError(res, "Action parameter required", 400);

      const result = await PublicExplorerService.moderateProject(id, action, req.user, reason);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.moderateProject error:", error);
      return sendError(res, error.message);
    }
  }

  // DELETE /api/admin/public-content/:id (Admin Permanently Purge)
  static async deletePublicContent(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") return sendError(res, "Access Denied. Admins only.", 403);
      const { id } = req.params;
      const { reason } = req.body || {};

      const result = await PublicExplorerService.deleteProjectPermanently(id, req.user, reason);
      return sendSuccess(res, result);
    } catch (error: any) {
      console.error("PublicController.deletePublicContent error:", error);
      return sendError(res, error.message);
    }
  }

  // POST /api/public/project/:id/copy
  static async copyProjectToNexus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const originalProject = await ListingService.getById(id);
      if (!originalProject) {
        return sendError(res, "Source project not found", 404);
      }

      // Find or create a "Copy Workspace" under current logged-in user
      const workspaces = await WorkspaceService.getAllByUser(req.user.email);
      let targetWorkspace = workspaces.find(w => w.name === "Copy Workspace");
      let workspaceId;
      if (targetWorkspace) {
        workspaceId = targetWorkspace.id;
      } else {
        const newWs = await WorkspaceService.create({
          name: "Copy Workspace",
          description: "Workspace containing copies of public projects."
        }, req.user.email);
        workspaceId = newWs.id;
      }

      // Create a copy under current logged-in user inside the Copy Workspace, of private visibility
      const newProject = await ListingService.create({
        title: `${originalProject.title} (Copy)`,
        description: originalProject.description || "",
        workspaceId: workspaceId,
        visibility: "private",
        addedToNexus: !!originalProject.addedToNexus,
        tags: originalProject.tags || []
      }, req.user.email);

      if (originalProject.addedToNexus === true) {
        // Fetch pages and indices of this Document Nexus project
        const originalPages = await DocPageService.getByProject(id);
        const originalIndices = await DocIndexService.getByProject(id);

        const pageIdMap = new Map<string, string>();

        // Duplicate pages to doc_pages
        for (const page of originalPages) {
          const createdPage = await DocPageService.create({
            title: page.title,
            content: page.content || "",
            pageNumber: page.pageNumber || 1,
            projectId: newProject.id
          });
          pageIdMap.set(page.id, createdPage.id);
        }

        // Helper to map old page IDs to new ones
        const mapLinkedPage = (linkedPage: any, idMap: Map<string, string>) => {
          if (Array.isArray(linkedPage)) {
            return linkedPage.map(oldId => idMap.get(oldId) || oldId);
          }
          if (typeof linkedPage === 'string') {
            if (linkedPage.includes(',')) {
              return linkedPage.split(',').map(oldId => idMap.get(oldId) || oldId).join(',');
            }
            return idMap.get(linkedPage) || linkedPage;
          }
          return linkedPage;
        };

        // Duplicate indices
        for (const indexItem of originalIndices) {
          const mappedLinkedPage = mapLinkedPage(indexItem.linkedPage, pageIdMap);
          await DocIndexService.create({
            title: indexItem.title,
            linkedPage: mappedLinkedPage,
            linkedSectionId: indexItem.linkedSectionId || "",
            position: indexItem.position || 0,
            projectId: newProject.id
          });
        }
      } else {
        // Fetch the pages of Workspace Hub project
        const originalPages = await PageService.getByListing(id);

        // Duplicate pages to pages
        for (const page of originalPages) {
          await PageService.create({
            listingId: newProject.id,
            title: page.title,
            content: page.content || "",
            pageNumber: page.pageNumber || 0
          });
        }
      }

      return sendSuccess(res, {
        message: "Project content copied to Copy Workspace successfully!",
        project: newProject
      });
    } catch (error: any) {
      console.error("PublicController.copyProjectToNexus error:", error);
      return sendError(res, error.message);
    }
  }
}


module.exports = {
  PublicController
};
