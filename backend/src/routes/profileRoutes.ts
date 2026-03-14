import express from "express";
import { getProfile, createProfile, updateProfile } from "../controllers/profileController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:userId", verifyToken, getProfile);
router.post("/:userId", verifyToken, createProfile);
router.put("/:userId", verifyToken, updateProfile);

export default router;
