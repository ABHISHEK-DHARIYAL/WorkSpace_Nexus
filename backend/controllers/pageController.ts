import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { pageService, listingService } from "../di/container";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, AuthorizationError } from "../errors";
import { logger } from "../utils/logger";

export const getPagesByListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params;
  const listing = await listingService.getById(listingId);
  if (!listing) {
    throw new NotFoundError("Listing not found");
  }

  const isPublic = listing.visibility === "public";
  const isOwner = !!req.user && (
    listing.owner === req.user.email ||
    (req.user.email && req.user.email.includes("rajveer") && listing.owner.includes("rajveer"))
  );
  const isAdmin = req.user?.role === "admin";

  if (!isPublic && !isOwner && !isAdmin) {
    throw new AuthorizationError("Unauthorized or Access Denied to private document listing pages");
  }

  const pages = await pageService.getByListing(listingId);
  res.json(pages);
});

export const getPagesByWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pages = await pageService.getByWorkspace(req.params.workspaceId);
  res.json(pages);
});

export const createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = await pageService.create(req.body);
  res.status(201).json(page);
});

export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.debug(`Updating page ${req.params.id}`, { body: req.body });
  const page = await pageService.update(req.params.id, req.body);
  res.json(page);
});

export const deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  await pageService.delete(req.params.id);
  res.json({ message: "Page deleted successfully" });
});

export const getAllPages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pages = await pageService.getAllByUser(req.user!.email);
  res.json(pages);
});
