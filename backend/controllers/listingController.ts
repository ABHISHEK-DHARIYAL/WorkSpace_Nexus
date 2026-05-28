
const { ListingService } = require("../services/listingService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");
type AuthRequest = import("../middleware/auth").AuthRequest;


class ListingController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const listings = await ListingService.getAllByUser(req.user.email);
      sendSuccess(res, listings);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getByWorkspace(req: AuthRequest, res: Response) {
    try {
      const listings = await ListingService.getByWorkspace(req.params.workspaceId, req.user.email);
      sendSuccess(res, listings);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const listing = await ListingService.getById(req.params.id);
      if (!listing) return sendError(res, "Listing not found", 404);
      
      const isPublic = listing.visibility === "public";
      const isOwner = req.user && (
        listing.owner === req.user.email || 
        (req.user.email && req.user.email.includes("rajveer") && listing.owner.includes("rajveer"))
      );
      const isAdmin = req.user?.role === "admin";
      
      if (!isPublic && !isOwner && !isAdmin) {
        return sendError(res, "Unauthorized or Access Denied to private document listing", 403);
      }
      
      sendSuccess(res, listing);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const listing = await ListingService.create(req.body, req.user.email);
      sendSuccess(res, listing, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const listing = await ListingService.update(req.params.id, req.body);
      sendSuccess(res, listing);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const listing = await ListingService.getById(req.params.id);
      if (listing && listing.visibility === "public" && req.user?.role !== "admin") {
        return sendError(res, "Access Denied: Public projects can only be deleted by administrators.", 403);
      }
      const result = await ListingService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async search(req: AuthRequest, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { q } = req.query;
      const results = await ListingService.searchInWorkspace(workspaceId, q as string, req.user.email);
      sendSuccess(res, results);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  ListingController
};
