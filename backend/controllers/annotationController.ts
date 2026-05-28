
const { AnnotationService } = require("../services/annotationService");

type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class AnnotationController {
  static async getByPage(req: AuthRequest, res: Response) {
    try {
      const annotations = await AnnotationService.getByPage(req.params.pageId);
      sendSuccess(res, annotations);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const annotation = await AnnotationService.create({
        ...req.body,
        userId: req.user.email
      });
      sendSuccess(res, annotation, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const annotation = await AnnotationService.update(req.params.id, req.body);
      sendSuccess(res, annotation);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const result = await AnnotationService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  AnnotationController
};
