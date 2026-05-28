const { Router } = require("express");
const { SearchController } = require("../controllers/searchController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, checkDb, SearchController.search);

module.exports = router;
