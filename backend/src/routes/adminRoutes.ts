import express from "express";
import { verifyToken, requireRole } from "../middleware/authMiddleware";
import {
  getStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllJobsAdmin,
  deleteJobAdmin,
  getAllApplicationsAdmin,
  searchUsers
} from "../controllers/adminController";

const router = express.Router();

// All admin routes require a valid token + admin role
router.use(verifyToken, requireRole("admin"));

// ── Dashboard ────────────────────────────────────────────────
router.get("/stats", getStats);

// ── Users ────────────────────────────────────────────────────
router.get("/users/search", searchUsers);        // GET /api/admin/users/search?q=john
router.get("/users", getAllUsers);               // GET /api/admin/users?role=candidate
router.get("/users/:id", getUserById);           // GET /api/admin/users/5
router.patch("/users/:id/role", updateUserRole); // PATCH /api/admin/users/5/role
router.delete("/users/:id", deleteUser);         // DELETE /api/admin/users/5

// ── Jobs ─────────────────────────────────────────────────────
router.get("/jobs", getAllJobsAdmin);             // GET /api/admin/jobs?recruiterId=2
router.delete("/jobs/:id", deleteJobAdmin);      // DELETE /api/admin/jobs/3

// ── Applications ─────────────────────────────────────────────
router.get("/applications", getAllApplicationsAdmin); // GET /api/admin/applications?status=hired

export default router;
