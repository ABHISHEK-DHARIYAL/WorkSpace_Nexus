const { Router } = require("express");
const { HighlightController } = require("../controllers/highlightController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, HighlightController.getAll);
router.get("/:pageId", authenticate, checkDb, HighlightController.getByPage);
router.post("/", authenticate, checkDb, HighlightController.create);

module.exports = router;
