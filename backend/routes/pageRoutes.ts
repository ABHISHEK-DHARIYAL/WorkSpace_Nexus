import { Router } from "express";
import {
  getAllPages,
  getPagesByListing,
  getPagesByWorkspace,
  createPage,
  updatePage,
  deletePage,
} from "../controllers/pageController";
import { AnnotationController } from "../controllers/annotationController";
import { VersionController } from "../controllers/versionController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = Router();

router.get("/", authenticate, checkDb, getAllPages);
router.get("/:listingId", authenticate, checkDb, getPagesByListing);
router.get("/workspace/:workspaceId", authenticate, checkDb, getPagesByWorkspace);
router.post("/", authenticate, checkDb, createPage);
router.put("/:id", authenticate, checkDb, updatePage);
router.delete("/:id", authenticate, checkDb, deletePage);

// Annotations
router.get("/:pageId/annotations", authenticate, checkDb, AnnotationController.getByPage);
router.post("/annotations", authenticate, checkDb, AnnotationController.create);
router.put("/annotations/:id", authenticate, checkDb, AnnotationController.update);
router.delete("/annotations/:id", authenticate, checkDb, AnnotationController.delete);

// Versions
router.get("/:pageId/versions", authenticate, checkDb, VersionController.getByPage);
router.post("/versions", authenticate, checkDb, VersionController.create);

export default router;
