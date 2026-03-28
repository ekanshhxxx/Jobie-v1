import express from "express";
import {
  scheduleMeeting,
  getRecruiterMeetings,
  getCandidateMeetings,
  getStreamToken
} from "../controllers/meetingController";
import { verifyToken, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/token", verifyToken, getStreamToken);
router.post("/schedule", verifyToken, requireRole("recruiter", "admin"), scheduleMeeting);
router.get("/recruiter", verifyToken, requireRole("recruiter", "admin"), getRecruiterMeetings);
router.get("/candidate", verifyToken, requireRole("candidate"), getCandidateMeetings);

export default router;
