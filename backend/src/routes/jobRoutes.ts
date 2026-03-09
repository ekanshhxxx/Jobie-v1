import express from "express";
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs
} from "../controllers/jobController";

const router = express.Router();

/* Candidate APIs */
router.get("/", getAllJobs);
router.get("/:id", getJobById);

/* Recruiter APIs */
router.post("/create", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.get("/recruiter", getRecruiterJobs);

export default router;