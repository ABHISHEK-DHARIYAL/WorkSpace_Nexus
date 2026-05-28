
const { ContentService } = require("../services/contentService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class ContentController {
  static async getAll(req: Request, res: Response) {
    try {
      const contents = await ContentService.getAll();
      sendSuccess(res, contents);
    } catch (error: any) {
      sendError(res, "Content fetch failed: " + error.message);
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const content = await ContentService.getBySlug(req.params.slug);
      if (!content) return sendError(res, "Content not found", 404);
      sendSuccess(res, content);
    } catch (error: any) {
      sendError(res, "Slug fetch failed: " + error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const result = await ContentService.create(req.body, req.user.email);
      sendSuccess(res, result, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const result = await ContentService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  ContentController
};
