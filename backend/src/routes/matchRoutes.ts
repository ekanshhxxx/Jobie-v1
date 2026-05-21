import express from "express";
import {
  getCareerRoadmap,
  getMatchScore,
  getSkillGap,
} from "../controllers/matchController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/score/:userId/:jobId", verifyToken, getMatchScore);
router.get("/gap/:userId/:jobId", verifyToken, getSkillGap);
router.get("/roadmap/:userId/:targetRole", verifyToken, getCareerRoadmap);

export default router;
