import express from "express";
import { applyJob, getUserApplications, getJobApplications, updateApplicationStatus } from "../controllers/applicationController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/apply", verifyToken, applyJob);
router.get("/user/:id", verifyToken, getUserApplications);
router.get("/job/:jobId", verifyToken, getJobApplications);
router.put("/:id/status", verifyToken, updateApplicationStatus);

export default router;