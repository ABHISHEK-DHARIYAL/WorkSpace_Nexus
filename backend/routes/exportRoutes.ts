const { Router } = require("express");
const { ExportController } = require("../controllers/exportController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

// Retrieve list of all exportable user projects
router.get("/all-projects", authenticate, checkDb, ExportController.allProjects);

// Trigger a single project package ZIP download
router.get("/project/:id", authenticate, checkDb, ExportController.getById);

module.exports = router;
