const { Router } = require("express");
const { DocPageController } = require("../controllers/docPageController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, DocPageController.getAll);
router.get("/:id", authenticate, checkDb, DocPageController.getById);
router.post("/", authenticate, checkDb, DocPageController.create);
router.put("/:id", authenticate, checkDb, DocPageController.update);
router.delete("/:id", authenticate, checkDb, DocPageController.delete);

module.exports = router;
