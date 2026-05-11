import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  uploadAvatar,
  uploadResume,
  uploadAvatarMiddleware,
  uploadResumeMiddleware,
  uploadJdMiddleware,
  parseJd
} from "../controllers/uploadController";

const router = Router();

router.post("/parse-jd", verifyToken, uploadJdMiddleware, parseJd);
router.post("/avatar/:userId", verifyToken, uploadAvatarMiddleware, uploadAvatar);
router.post("/resume/:userId", verifyToken, uploadResumeMiddleware, uploadResume);

export default router;
