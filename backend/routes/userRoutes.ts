const { Router } = require("express");
const { UserController } = require("../controllers/userController");
const { authenticate, isAdmin } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

router.get("/", authenticate, isAdmin, checkDb, UserController.getAll);

module.exports = router;
