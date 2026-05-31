import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { SyncController } from "../controllers/syncController";

const router = Router();

router.get("/export", authenticate, SyncController.exportBackup);
router.post("/import", authenticate, SyncController.importRestore);

export default router;
