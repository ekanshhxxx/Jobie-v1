import express from "express";
import { getProfile, getProfileView, createProfile, updateProfile } from "../controllers/profileController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/view/:userId", verifyToken, getProfileView);
router.get("/:userId", verifyToken, getProfile);
router.post("/:userId", verifyToken, createProfile);
router.put("/:userId", verifyToken, updateProfile);

export default router;
