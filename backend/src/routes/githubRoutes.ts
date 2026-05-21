import express from "express";
import {
  analyseUser,
  compareWithJob,
  getDeepScan,
  verifyAndSave,
} from "../controllers/githubController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/analyse/:username", analyseUser);
router.post("/verify/:userId", verifyToken, verifyAndSave);
router.get("/deep/:userId", verifyToken, getDeepScan);
router.get("/compare/:userId/:jobId", verifyToken, compareWithJob);

export default router;
