const { Router } = require("express");
const { ListingController } = require("../controllers/listingController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, ListingController.getAll);
router.get("/workspace/:workspaceId", authenticate, checkDb, ListingController.getByWorkspace);
router.get("/search/:workspaceId", authenticate, checkDb, ListingController.search);
router.get("/:id", optionalAuthenticate, checkDb, ListingController.getById);
router.post("/", authenticate, checkDb, ListingController.create);
router.put("/:id", authenticate, checkDb, ListingController.update);
router.delete("/:id", authenticate, checkDb, ListingController.delete);

module.exports = router;
