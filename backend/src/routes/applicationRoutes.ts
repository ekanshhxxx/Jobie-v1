import express from "express";

import {
  applyJob,
  getUserApplications,
  getJobApplications,
  getRecruiterApplications
} from "../controllers/applicationController";

const router = express.Router();

/* Apply job */

router.post("/apply", applyJob);

/* Get applications by user */

router.get("/user/:id", getUserApplications);

/* Get applications for a job */

router.get("/job/:jobId", getJobApplications);

/* NEW: Recruiter view applications */

router.get("/recruiter/:recruiterId", getRecruiterApplications);

export default router;