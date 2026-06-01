import { Request, Response } from "express";
import { DocParserService } from "../services/docParserService";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class DocUploadController {
  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, "No file uploaded", 400);
      }

      const { buffer, originalname, mimetype } = req.file;
      const workspaceId = req.body.workspaceId;
      const addedToNexus = req.body.addedToNexus === "true" || req.body.addedToNexus === true;

      console.log(`[Upload Controller] Received file upload: ${originalname}, workspaceId: ${workspaceId}, addedToNexus: ${addedToNexus}`);

      const result = await DocParserService.parse(buffer, originalname, mimetype, req.user.email, {
        workspaceId,
        addedToNexus
      });

      sendSuccess(res, result, 201);
    } catch (error: any) {
      console.error("Upload Error:", error);
      sendError(res, error.message || "Failed to process document");
    }
  }
}
