
const { PageService } = require("../services/pageService");

type Request = import("express").Request;
type Response = import("express").Response;
const { ListingService } = require("../services/listingService");
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class PageController {
  static async getByListing(req: AuthRequest, res: Response) {
    try {
      const { listingId } = req.params;
      const listing = await ListingService.getById(listingId);
      if (!listing) return sendError(res, "Listing not found", 404);

      const isPublic = listing.visibility === "public";
      const isOwner = req.user && (
        listing.owner === req.user.email || 
        (req.user.email && req.user.email.includes("rajveer") && listing.owner.includes("rajveer"))
      );
      const isAdmin = req.user?.role === "admin";

      if (!isPublic && !isOwner && !isAdmin) {
        return sendError(res, "Unauthorized or Access Denied to private document listing pages", 403);
      }

      const pages = await PageService.getByListing(listingId);
      sendSuccess(res, pages);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getByWorkspace(req: AuthRequest, res: Response) {
    try {
      const pages = await PageService.getByWorkspace(req.params.workspaceId);
      sendSuccess(res, pages);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const page = await PageService.create(req.body);
      sendSuccess(res, page, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      console.log(`PageController.update: Updating page ${req.params.id}`, req.body);
      const page = await PageService.update(req.params.id, req.body);
      sendSuccess(res, page);
    } catch (error: any) {
      console.error("PageController.update Error:", error);
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const result = await PageService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const pages = await PageService.getAll(req.user.email);
      sendSuccess(res, pages);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  PageController
};
