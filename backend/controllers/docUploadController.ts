
const { DocParserService } = require("../services/docParserService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class DocUploadController {
  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, "No file uploaded", 400);
      }

      const { buffer, originalname, mimetype } = req.file;
      const result = await DocParserService.parse(buffer, originalname, mimetype, req.user.email);

      sendSuccess(res, result, 201);
    } catch (error: any) {
      console.error("Upload Error:", error);
      sendError(res, error.message || "Failed to process document");
    }
  }
}


module.exports = {
  DocUploadController
};
