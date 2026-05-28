const { Router } = require("express");
const { DocIndexController } = require("../controllers/docIndexController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, DocIndexController.getAll);
router.get("/:id", authenticate, checkDb, DocIndexController.getById);
router.post("/", authenticate, checkDb, DocIndexController.create);
router.put("/:id", authenticate, checkDb, DocIndexController.update);
router.delete("/:id", authenticate, checkDb, DocIndexController.delete);

module.exports = router;
