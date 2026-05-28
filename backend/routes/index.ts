const { Router } = require("express");
const authRoutes = require("./authRoutes");
const contentRoutes = require("./contentRoutes");
const userRoutes = require("./userRoutes");
const listingRoutes = require("./listingRoutes");
const workspaceRoutes = require("./workspaceRoutes");
const pageRoutes = require("./pageRoutes");
const highlightRoutes = require("./highlightRoutes");
const docPageRoutes = require("./docPageRoutes");
const docIndexRoutes = require("./docIndexRoutes");
const docUploadRoutes = require("./docUploadRoutes");
const searchRoutes = require("./searchRoutes");
const publicRoutes = require("./publicRoutes");
const exportRoutes = require("./exportRoutes");
const workspaceHubExportRoutes = require("./workspaceHubExportRoutes");
const documentNexusExportRoutes = require("./documentNexusExportRoutes");
const { sendSuccess } = require("../utils/response");
const { isDatabaseWorking } = require("../config/db");

const router = Router();

router.get("/health", (req, res) => {
  sendSuccess(res, { 
    status: "ok", 
    isDatabaseWorking,
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
router.use("/page", pageRoutes);
router.use("/highlight", highlightRoutes);
router.use("/docs", docUploadRoutes);
router.use("/search", searchRoutes);
router.use("/export", exportRoutes);
router.use("/export", workspaceHubExportRoutes);
router.use("/export", documentNexusExportRoutes);

module.exports = router;
