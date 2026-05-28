const { Router } = require("express");
const { ContentController } = require("../controllers/contentController");
const { authenticate, isAdmin } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", checkDb, ContentController.getAll);
router.get("/:slug", checkDb, ContentController.getBySlug);
router.post("/", authenticate, isAdmin, checkDb, ContentController.create);
router.delete("/:id", authenticate, isAdmin, checkDb, ContentController.delete);

module.exports = router;
