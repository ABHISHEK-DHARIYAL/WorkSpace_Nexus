import { Router } from "express";
import { PublicController } from "../controllers/publicController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = Router();

// Public Exploration Dashboard / Nexus -- now requires login site-wide
router.get("/dashboardHub", authenticate, checkDb, PublicController.getDashboardHub);
router.get("/documentNexus", authenticate, checkDb, PublicController.getDocumentNexus);

// public listings / details
router.get("/projects", authenticate, checkDb, PublicController.getProjects);
router.get("/project/:id", authenticate, checkDb, PublicController.getProjectById);
router.get("/page/:id", authenticate, checkDb, PublicController.getPageById);

// Update / Toggle Project Visibility -> Strict Authenticate
router.patch("/project/:id/visibility", authenticate, checkDb, PublicController.updateProjectVisibility);
router.post("/project/:id/copy", authenticate, checkDb, PublicController.copyProjectToNexus);

// User Interactivity -> Strict Authenticate
router.post("/bookmarks", authenticate, checkDb, PublicController.toggleBookmark);
router.get("/bookmarks", authenticate, checkDb, PublicController.getBookmarks);
router.post("/favorites", authenticate, checkDb, PublicController.toggleFavorite);
router.post("/follow", authenticate, checkDb, PublicController.toggleFollow);
router.get("/follows", authenticate, checkDb, PublicController.getFollows);

// Moderate Public Content -> Strict Authenticate
router.patch("/moderate/:id", authenticate, checkDb, PublicController.moderateProject);

// Audit logs -> Strict Authenticate
router.get("/audit-logs", authenticate, checkDb, PublicController.getAuditLogs);

// Delete Workflow (Permanently Purge) -> Strict Authenticate
router.delete("/admin-delete/:id", authenticate, checkDb, PublicController.deletePublicContent);

export default router;
