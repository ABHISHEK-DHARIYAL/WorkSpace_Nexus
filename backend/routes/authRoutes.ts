const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const { checkDb } = require("../middleware/checkDb");

const router = Router();

console.log("AuthController:", AuthController);
console.log("authenticate:", authenticate);
console.log("checkDb:", checkDb);

router.post("/signup", checkDb, AuthController.signup);
router.post("/login", checkDb, AuthController.login);
router.put(
  "/update-password",
  authenticate,
  checkDb,
  AuthController.updatePassword
);
router.delete(
  "/delete-account",
  authenticate,
  checkDb,
  AuthController.deleteAccount
);
router.get("/me", authenticate, checkDb, (req: any, res: any) => {
  res.json({ status: "success", user: req.user });
});

console.log("AuthController:", AuthController);
console.log("authenticate:", authenticate);
console.log("checkDb:", checkDb);

module.exports = router;
