import express from "express";
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs
} from "../controllers/jobController";
import { requireRole, verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/recruiter", verifyToken, getRecruiterJobs);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", verifyToken, requireRole("recruiter", "admin"), createJob);
router.put("/:id", verifyToken, requireRole("recruiter", "admin"), updateJob);
router.delete("/:id", verifyToken, requireRole("recruiter", "admin"), deleteJob);

export default router;
