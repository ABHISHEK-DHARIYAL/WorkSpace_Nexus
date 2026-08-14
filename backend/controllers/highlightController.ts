import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { highlightService } from "../di/container";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

export const getAllHighlights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const highlights = await highlightService.getAll();
  res.json(highlights);
});

export const getHighlightsByPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const highlights = await highlightService.getByPage(req.params.pageId);
  res.json(highlights);
});

export const createHighlight = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.debug("Creating highlight", { body: req.body });
  const highlight = await highlightService.create({
    ...req.body,
    userId: req.user?.uid || req.user?.email,
  });
  res.status(201).json(highlight);
});
