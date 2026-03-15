import express from "express";
import {
  applyJob,
  getUserApplications,
  getJobApplications,
  getRecruiterApplications,
  updateApplicationStatus
} from "../controllers/applicationController";

import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

/* ---------------- Candidate APIs ---------------- */

// Apply for job
router.post("/apply", verifyToken, applyJob);

// Get applications for logged-in user
router.get("/user/:id", verifyToken, getUserApplications);


/* ---------------- Recruiter APIs ---------------- */

// Get applications for a specific job
router.get("/job/:jobId", verifyToken, getJobApplications);

// Get all applications for recruiter's jobs
router.get("/recruiter/:recruiterId", verifyToken, getRecruiterApplications);

// Update application status (Accept / Reject)
router.put("/:id", verifyToken, updateApplicationStatus);

export default router;