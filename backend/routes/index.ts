import { Router } from "express";
import authRoutes from "./authRoutes";
import contentRoutes from "./contentRoutes";
import userRoutes from "./userRoutes";
import listingRoutes from "./listingRoutes";
import workspaceRoutes from "./workspaceRoutes";
import pageRoutes from "./pageRoutes";
import highlightRoutes from "./highlightRoutes";
import docPageRoutes from "./docPageRoutes";
import docIndexRoutes from "./docIndexRoutes";
import docUploadRoutes from "./docUploadRoutes";
import searchRoutes from "./searchRoutes";
import publicRoutes from "./publicRoutes";
import exportRoutes from "./exportRoutes";
import workspaceHubExportRoutes from "./workspaceHubExportRoutes";
import documentNexusExportRoutes from "./documentNexusExportRoutes";
import documentNexusWorkspaceRoutes from "./documentNexusWorkspaceRoutes";
import documentNexusDocumentRoutes from "./documentNexusDocumentRoutes";
import { sendSuccess } from "../utils/response";
import { isFirestoreWorking } from "../config/firebase";

const router = Router();

router.get("/health", (req, res) => {
  sendSuccess(res, { 
    status: "ok", 
    isFirestoreWorking,
    timestamp: new Date().toISOString() 
  });
});

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/content/page", docPageRoutes);
router.use("/content", contentRoutes);
router.use("/index", docIndexRoutes);
router.use("/users", userRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/listing", listingRoutes);
router.use("/document-nexus/workspace", documentNexusWorkspaceRoutes);
router.use("/document-nexus/document", documentNexusDocumentRoutes);
router.use("/page", pageRoutes);
router.use("/highlight", highlightRoutes);
router.use("/docs", docUploadRoutes);
router.use("/search", searchRoutes);
router.use("/export", exportRoutes);
router.use("/export", workspaceHubExportRoutes);
router.use("/export", documentNexusExportRoutes);

export default router;
