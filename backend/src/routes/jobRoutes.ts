import express from "express";
import {
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs,
} from "../controllers/jobController";

const router = express.Router();

router.post("/create", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.get("/recruiter", getRecruiterJobs);

export default router;