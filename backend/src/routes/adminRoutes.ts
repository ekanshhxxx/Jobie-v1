import express from "express";
import { verifyToken, requireRole } from "../middleware/authMiddleware";
import {
  getStats,
  getDataHealth,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  banUser,
  unbanUser,
  getAllJobsAdmin,
  deleteJobAdmin,
  getAllApplicationsAdmin,
  searchUsers,
  approveJob,
  rejectJob,
  getPendingRecruiters,
  approveRecruiter,
  rejectRecruiter
} from "../controllers/adminController";

const router = express.Router();

// All admin routes require a valid token + admin role
router.use(verifyToken, requireRole("admin"));

// ── Dashboard ────────────────────────────────────────────────
router.get("/stats", getStats);
router.get("/data-health", getDataHealth);

// ── Recruiters ───────────────────────────────────────────────
router.get("/recruiters/pending", getPendingRecruiters);
router.patch("/recruiters/:id/approve", approveRecruiter);
router.patch("/recruiters/:id/reject", rejectRecruiter);

// ── Users ────────────────────────────────────────────────────
router.get("/users/search", searchUsers);        // GET /api/admin/users/search?q=john
router.get("/users", getAllUsers);               // GET /api/admin/users?role=candidate
router.get("/users/:id", getUserById);           // GET /api/admin/users/5
router.patch("/users/:id/role", updateUserRole); // PATCH /api/admin/users/5/role
router.patch("/users/:id/ban",  banUser);         // PATCH /api/admin/users/5/ban
router.patch("/users/:id/unban", unbanUser);      // PATCH /api/admin/users/5/unban
router.delete("/users/:id", deleteUser);          // DELETE /api/admin/users/5

// ── Jobs ─────────────────────────────────────────────────────
router.get("/jobs", getAllJobsAdmin);              // GET /api/admin/jobs?status=pending
router.patch("/jobs/:id/approve", approveJob);    // PATCH /api/admin/jobs/3/approve
router.patch("/jobs/:id/reject", rejectJob);      // PATCH /api/admin/jobs/3/reject
router.delete("/jobs/:id", deleteJobAdmin);       // DELETE /api/admin/jobs/3

// ── Applications ─────────────────────────────────────────────
router.get("/applications", getAllApplicationsAdmin); // GET /api/admin/applications?status=hired

export default router;
