import express from "express";
import { getRecruiterDashboard } from "../controllers/dashboardController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/recruiter/:recruiterId", verifyToken, getRecruiterDashboard);

export default router;
