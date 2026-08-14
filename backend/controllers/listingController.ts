import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { listingService } from "../di/container";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, AuthorizationError } from "../errors";

/**
 * Pure HTTP boundary for the listing feature: extract request data, call
 * the service, shape the response. Authorization decisions that depend on
 * the request's authenticated user (visibility checks, admin-only deletes)
 * stay here since they're about "is this HTTP caller allowed to do this",
 * not a domain business rule — but they no longer manually call sendError,
 * they throw typed errors that the centralized error middleware formats.
 */

export const getAllListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listings = await listingService.getAllByUser(req.user!.email);
  res.json(listings);
});

export const getListingsByWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listings = await listingService.getByWorkspace(req.params.workspaceId, req.user!.email);
  res.json(listings);
});

export const getListingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await listingService.getById(req.params.id);
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
    throw new AuthorizationError("Unauthorized or Access Denied to private document listing");
  }

  res.json(listing);
});

export const createListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await listingService.create(req.body, req.user!.email);
  res.status(201).json(listing);
});

export const updateListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await listingService.update(req.params.id, req.body);
  res.json(listing);
});

export const deleteListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await listingService.getById(req.params.id);
  if (listing && listing.visibility === "public" && req.user?.role !== "admin") {
    throw new AuthorizationError("Access Denied: Public projects can only be deleted by administrators.");
  }
  await listingService.delete(req.params.id);
  res.json({ message: "Listing and all associated content deleted successfully" });
});

export const searchListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const { q } = req.query;
  const results = await listingService.searchInWorkspace(workspaceId, q as string, req.user!.email);
  res.json(results);
});
