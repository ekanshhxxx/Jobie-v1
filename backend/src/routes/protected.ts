import express from "express";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.status(200).json({ message: "Protected route", user: (req as any).user });
});

export default router;
