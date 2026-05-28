const { Router } = require("express");
const { DocumentNexusExportController } = require("../controllers/documentNexusExportController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

// Endpoint triggered on GET /export/document-nexus
router.get("/document-nexus", authenticate, checkDb, DocumentNexusExportController.exportNexus);

module.exports = router;
