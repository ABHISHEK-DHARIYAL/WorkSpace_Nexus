import { Router } from "express";
import {
  getAllListings,
  getListingsByWorkspace,
  searchListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController";
import { authenticate } from "../middleware/auth";
import { checkDb } from "../middleware/checkDb";

const router = Router();

router.get("/", authenticate, checkDb, getAllListings);
router.get("/workspace/:workspaceId", authenticate, checkDb, getListingsByWorkspace);
router.get("/search/:workspaceId", authenticate, checkDb, searchListings);
router.get("/:id", authenticate, checkDb, getListingById);
router.post("/", authenticate, checkDb, createListing);
router.put("/:id", authenticate, checkDb, updateListing);
router.delete("/:id", authenticate, checkDb, deleteListing);

export default router;
