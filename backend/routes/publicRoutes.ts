const { Router } = require("express");
const { PublicController } = require("../controllers/publicController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

// Public Exploration Dashboard / Nexus
router.get("/dashboardHub", optionalAuthenticate, checkDb, PublicController.getDashboardHub);
router.get("/documentNexus", optionalAuthenticate, checkDb, PublicController.getDocumentNexus);

// public listings / details
router.get("/projects", optionalAuthenticate, checkDb, PublicController.getProjects);
router.get("/project/:id", optionalAuthenticate, checkDb, PublicController.getProjectById);
router.get("/page/:id", optionalAuthenticate, checkDb, PublicController.getPageById);

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

module.exports = router;
