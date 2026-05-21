import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  parseResumeFromPDF,
  parseResumeFromText,
  parseAndSaveToProfile,
  matchResumeToJob,
  uploadMiddleware,
  getResumeReport,
} from "../controllers/resumeController";

const router = Router();

// Public — just AI‑parse a PDF file, no login needed
router.post("/parse", uploadMiddleware, parseResumeFromPDF);

// Public — paste raw text and get AI‑parsed result
router.post("/parse-text", parseResumeFromText);

// Protected — parse resume then auto‑fill profile (accepts PDF or text body)
router.post("/parse-and-save/:userId", verifyToken, uploadMiddleware, parseAndSaveToProfile);

// Protected — upload resume, compare against a specific job's requirements
router.post("/match/:jobId", verifyToken, uploadMiddleware, matchResumeToJob);

// Protected — get stored resume report card from DB
router.get("/report/:userId", verifyToken, getResumeReport);

export default router;
