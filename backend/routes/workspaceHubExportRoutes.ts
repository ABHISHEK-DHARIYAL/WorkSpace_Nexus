const { Router } = require("express");
const { WorkspaceHubExportController } = require("../controllers/workspaceHubExportController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

// Endpoint triggered on GET /api/export/workspace-hub (or /api/workspace-hub depending on how it's mounted)
// Since we mount under "/export" in the main router, we match /export/workspace-hub
router.get("/workspace-hub", authenticate, checkDb, WorkspaceHubExportController.exportHub);

module.exports = router;
