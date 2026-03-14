import express from "express";

import {
  applyJob,
  getUserApplications,
  getJobApplications,
  getRecruiterApplications,
  updateApplicationStatus
} from "../controllers/applicationController";

const router = express.Router();

/* Apply job */

router.post("/apply", applyJob);

/* Get applications by user */

router.get("/user/:id", getUserApplications);

/* Get applications for a job */

router.get("/job/:jobId", getJobApplications);

/* Recruiter view applications */

router.get("/recruiter/:recruiterId", getRecruiterApplications);

/* NEW: Update application status (Accept / Reject) */

router.put("/:id", updateApplicationStatus);

export default router;
