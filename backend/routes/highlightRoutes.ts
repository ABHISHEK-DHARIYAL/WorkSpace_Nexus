import { Router } from "express";
import { getAllHighlights, getHighlightsByPage, createHighlight } from "../controllers/highlightController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = Router();

router.get("/", authenticate, checkDb, getAllHighlights);
router.get("/:pageId", authenticate, checkDb, getHighlightsByPage);
router.post("/", authenticate, checkDb, createHighlight);

export default router;
