import express from "express";
import { getRecruiterDashboard } from "../controllers/dashboardController";
import { requireRole, verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/recruiter/:recruiterId", verifyToken, requireRole("recruiter", "admin"), getRecruiterDashboard);

export default router;
