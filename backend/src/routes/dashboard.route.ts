import express from "express";
import { verifyJWT } from "../middleware/auth";

const router = express.Router();

// 🔹 GET /api/dashboard
router.get("/", verifyJWT, (req, res) => {
  const user = (req as any).user; // JWT decoded info
  res.json({ message: `Welcome to dashboard, ${user.email}`, user });
});

export default router;