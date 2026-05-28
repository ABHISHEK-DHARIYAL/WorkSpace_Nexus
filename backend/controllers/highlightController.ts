
const { HighlightService } = require("../services/highlightService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class HighlightController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const highlights = await HighlightService.getAll();
      sendSuccess(res, highlights);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getByPage(req: AuthRequest, res: Response) {
    try {
      const highlights = await HighlightService.getByPage(req.params.pageId);
      sendSuccess(res, highlights);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      console.log("HighlightController.create: Received data", req.body);
      const highlight = await HighlightService.create({
        ...req.body,
        userId: req.user?.uid || req.user?.email
      });
      sendSuccess(res, highlight, 201);
    } catch (error: any) {
      console.error("HighlightController.create Error:", error);
      sendError(res, error.message);
    }
  }
}


module.exports = {
  HighlightController
};
