import express from "express";
import {
  applyJob,
  getUserApplications,
  getJobApplications,
  getRecruiterApplications,
  updateApplicationStatus,
} from "../controllers/applicationController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/apply", verifyToken, applyJob);
router.get("/user/:id", verifyToken, getUserApplications);
router.get("/job/:jobId", verifyToken, getJobApplications);
router.get("/recruiter/:recruiterId", verifyToken, getRecruiterApplications);
router.put("/:id/status", verifyToken, updateApplicationStatus);
router.put("/:id", verifyToken, updateApplicationStatus);

export default router;
