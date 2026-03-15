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

/* ---------------- Candidate APIs ---------------- */

router.get("/", getAllJobs);

/* ---------------- Recruiter APIs ---------------- */

router.get("/recruiter", getRecruiterJobs);

/* ---------------- Single Job ---------------- */

router.get("/:id", getJobById);

router.post("/create", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;