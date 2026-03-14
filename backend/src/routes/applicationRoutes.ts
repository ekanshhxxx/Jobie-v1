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

/* Apply for job (Candidate) */
router.post("/apply", verifyToken, applyJob);

/* Candidate applications */
router.get("/user/:id", verifyToken, getUserApplications);

/* Applications for specific job (Recruiter) */
router.get("/job/:jobId", verifyToken, getJobApplications);

/* Recruiter dashboard applications */
router.get("/recruiter/:recruiterId", verifyToken, getRecruiterApplications);

/* Update application status */
router.put("/:id/status", verifyToken, updateApplicationStatus);

export default router;