
type AuthRequest = import("../middleware/auth").AuthRequest;


type Response = import("express").Response;
const { DocumentNexusExportService } = require("../services/documentNexusExportService");
const { sendError } = require("../utils/response");

class DocumentNexusExportController {
  /**
   * GET /export/document-nexus
   * Compiles and exports all of standard user's Document Nexus projects inside a single ZIP file.
   */
  static async exportNexus(req: AuthRequest, res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return sendError(res, "Unauthorized: User not authenticated", 401);
      }

      // Generate the Document Nexus ZIP in memory
      const zipBuffer = await DocumentNexusExportService.exportUserDocumentNexus(email);

      // Set download headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="document-nexus.zip"');
      res.setHeader("Content-Length", zipBuffer.length);

      return res.end(zipBuffer);
    } catch (error: any) {
      console.error("Document Nexus Export Error:", error);
      return sendError(res, error.message || "Failed to generate Document Nexus export ZIP package", 500);
    }
  }
}


module.exports = {
  DocumentNexusExportController
};
