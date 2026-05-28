
const { DocPageService } = require("../services/docPageService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class DocPageController {
  static async getAll(req: Request, res: Response) {
    try {
      const pages = await DocPageService.getAll();
      sendSuccess(res, pages);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const page = await DocPageService.getById(req.params.id);
      if (!page) return sendError(res, "Page not found", 404);
      sendSuccess(res, page);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const page = await DocPageService.create(req.body);
      sendSuccess(res, page, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const page = await DocPageService.update(req.params.id, req.body);
      sendSuccess(res, page);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const result = await DocPageService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  DocPageController
};
