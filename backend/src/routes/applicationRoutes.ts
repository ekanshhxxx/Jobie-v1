import express from "express";
import { applyJob, getUserApplications, getJobApplications } from "../controllers/applicationController";

const router = express.Router();

router.post("/apply", applyJob);

// NEW ROUTE
router.get("/user/:id", getUserApplications);
router.get("/job/:jobId", getJobApplications);

export default router;