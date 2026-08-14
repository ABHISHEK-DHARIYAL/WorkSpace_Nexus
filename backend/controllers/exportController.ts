import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProjectExporter } from "../services/projectExporter";
import { ZipService } from "../services/zipService";
import { listingService } from "../di/container";

import { sendSuccess, sendError } from "../utils/response";

export class ExportController {
  /**
   * GET /export/project/:id
   * Compresses and exports a single project by ID as a downloadable ZIP file.
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const projectId = req.params.id;
      if (!projectId) {
        return sendError(res, "Missing project ID", 400);
      }

      const email = req.user?.email;
      if (!email) {
        return sendError(res, "Unauthorized: User not authenticated", 401);
      }

      const isAdmin = req.user?.role === "admin";

      // 1. Fetch and aggregate all project database records
      const projectData = await ProjectExporter.exportProjectData(projectId, email, isAdmin);

      // 2. Build ZIP archive in memory
      const zipBuffer = await ZipService.generateProjectZip(projectData);

      // 3. Set content type and attachment headers
      const safeTitle = (projectData.project.title || "project")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      const fileName = `${safeTitle || projectId}.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", zipBuffer.length);
      
      return res.end(zipBuffer);
    } catch (error: any) {
      console.error("Single Project Export Error:", error);
      return sendError(res, error.message || "Failed to export project ZIP package", 500);
    }
  }

  /**
   * GET /export/all-projects
   * Returns a listing of all projects owned by the authenticated user.
   */
  static async allProjects(req: AuthRequest, res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return sendError(res, "Unauthorized: User not authenticated", 401);
      }

      // Fetch all projects owned by this user
      const projects = await listingService.getAllByUser(email);
      return sendSuccess(res, projects);
    } catch (error: any) {
      console.error("Fetch All Projects for Export Error:", error);
      return sendError(res, error.message || "Failed to retrieve user projects list", 500);
    }
  }
}
