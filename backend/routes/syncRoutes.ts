import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { SyncController } from "../controllers/syncController";

const router = Router();

router.get("/export", authenticate, SyncController.exportBackup);
router.get("/cloud-backup", authenticate, SyncController.getCloudBackup);
router.post("/cloud-backup", authenticate, SyncController.saveCloudBackup);
router.post("/import", authenticate, SyncController.importRestore);

export default router;
