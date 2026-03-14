import express from "express";
import { getMatchScore, getSkillGap, getCareerRoadmap } from "../controllers/matchController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/score/:userId/:jobId", verifyToken, getMatchScore);
router.get("/gap/:userId/:jobId", verifyToken, getSkillGap);
router.get("/roadmap/:userId/:targetRole", verifyToken, getCareerRoadmap);

export default router;
