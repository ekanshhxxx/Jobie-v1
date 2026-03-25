import express from "express";
import { verifyToken, requireRole, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ Normal protected route
router.get("/dashboard", verifyToken, (req: AuthRequest, res) => {
  res.json({ message: "Welcome to your dashboard!", user: req.user });
});

// ✅ Role-based protected route
router.get("/admin-dashboard", verifyToken, requireRole("admin"), (req: AuthRequest, res) => {
  res.json({ message: "Welcome Admin!", user: req.user });
});

export default router;
