import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { analyseUser, verifyAndSave, compareWithJob } from "../controllers/githubController";

const router = express.Router();

// Public — anyone can analyse a GitHub profile
router.get("/analyse/:username", analyseUser);

// Protected — verify & save needs auth
router.post("/verify/:userId", verifyToken, verifyAndSave);

// Protected — compare verified skills with a job
router.get("/compare/:userId/:jobId", verifyToken, compareWithJob);

export default router;
