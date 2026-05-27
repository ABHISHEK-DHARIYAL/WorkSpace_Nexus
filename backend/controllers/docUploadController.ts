import { Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class DocUploadController {
  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, "No file uploaded", 400);
      }

      const { buffer, originalname, mimetype } = req.file;
      // Load heavyweight document parsing dependencies only for upload requests
      // so auth/content routes stay healthy even if optional parser packages fail in serverless.
      const { DocParserService } = await import("../services/docParserService");
      const result = await DocParserService.parse(buffer, originalname, mimetype, req.user.email);

      sendSuccess(res, result, 201);
    } catch (error: any) {
      console.error("Upload Error:", error);
      sendError(res, error.message || "Failed to process document");
    }
  }
}
