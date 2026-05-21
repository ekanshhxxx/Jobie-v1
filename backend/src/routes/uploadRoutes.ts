import express from "express";
import {
  parseJd,
  uploadAvatar,
  uploadAvatarMiddleware,
  uploadJdMiddleware,
  uploadResume,
  uploadApplicationResume,
  uploadResumeMiddleware,
} from "../controllers/uploadController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/avatar/:userId", verifyToken, uploadAvatarMiddleware, uploadAvatar);
router.post("/resume/:userId", verifyToken, uploadResumeMiddleware, uploadResume);
router.post("/application-resume", verifyToken, uploadResumeMiddleware, uploadApplicationResume);
router.post("/parse-jd", verifyToken, uploadJdMiddleware, parseJd);

export default router;
