import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = Router();

router.post("/signup", checkDb, AuthController.signup);
router.post("/login", checkDb, AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/reset-password", checkDb, AuthController.resetPassword);
router.post("/refresh-token", authenticate, AuthController.refreshToken);
router.put("/update-password", authenticate, checkDb, AuthController.updatePassword);
router.delete("/delete-account", authenticate, checkDb, AuthController.deleteAccount);
router.get("/me", authenticate, checkDb, (req: any, res: any) => {
  res.json({ status: "success", user: req.user });
});

export default router;
