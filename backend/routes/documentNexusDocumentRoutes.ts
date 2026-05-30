import express from "express";
import { DocumentNexusDocumentController } from "../controllers/documentNexusDocumentController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = express.Router();

router.get("/", authenticate, checkDb, DocumentNexusDocumentController.getAll);
router.get("/workspace/:workspaceId", authenticate, checkDb, DocumentNexusDocumentController.getByWorkspace);
router.get("/:id", authenticate, checkDb, DocumentNexusDocumentController.getById);
router.post("/", authenticate, checkDb, DocumentNexusDocumentController.create);
router.put("/:id", authenticate, checkDb, DocumentNexusDocumentController.update);
router.delete("/:id", authenticate, checkDb, DocumentNexusDocumentController.delete);

export default router;
