const { Router } = require("express");
const { PageController } = require("../controllers/pageController");
const { AnnotationController } = require("../controllers/annotationController");
const { VersionController } = require("../controllers/versionController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, PageController.getAll);
router.get("/:listingId", optionalAuthenticate, checkDb, PageController.getByListing);
router.get("/workspace/:workspaceId", authenticate, checkDb, PageController.getByWorkspace);
router.post("/", authenticate, checkDb, PageController.create);
router.put("/:id", authenticate, checkDb, PageController.update);
router.delete("/:id", authenticate, checkDb, PageController.delete);

// Annotations
router.get("/:pageId/annotations", authenticate, checkDb, AnnotationController.getByPage);
router.post("/annotations", authenticate, checkDb, AnnotationController.create);
router.put("/annotations/:id", authenticate, checkDb, AnnotationController.update);
router.delete("/annotations/:id", authenticate, checkDb, AnnotationController.delete);

// Versions
router.get("/:pageId/versions", authenticate, checkDb, VersionController.getByPage);
router.post("/versions", authenticate, checkDb, VersionController.create);

module.exports = router;
