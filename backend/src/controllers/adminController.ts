import { Response } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import Profile from "../models/Profile";

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
// Platform-wide dashboard numbers
export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalJobs, totalApplications, candidates, recruiters, admins] =
      await Promise.all([
        User.count(),
        Job.count(),
        Application.count(),
        User.count({ where: { role: "candidate" } }),
        User.count({ where: { role: "recruiter" } }),
        User.count({ where: { role: "admin" } })
      ]);

    // Application breakdown by status
    const statusCounts = await Application.findAll({
      attributes: [
        "status",
        [(Application as any).sequelize.fn("COUNT", (Application as any).sequelize.col("id")), "count"]
      ],
      group: ["status"],
      raw: true
    });

    res.status(200).json({
      users: { total: totalUsers, candidates, recruiters, admins },
      jobs: { total: totalJobs },
      applications: {
        total: totalApplications,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// List all users; optional ?role=candidate|recruiter|admin filter
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.role) where.role = req.query.role;

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      include: [{ model: Profile, as: "profile", required: false }]
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
// Full user detail: profile + applications + jobs posted
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(Number(req.params.id), {
      attributes: { exclude: ["password"] },
      include: [
        { model: Profile, as: "profile", required: false },
        {
          model: Application, as: "applications", required: false,
          include: [{ model: Job, as: "Job", required: false }]
        },
        { model: Job, as: "postedJobs", required: false }
      ]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
// Change a user's role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles = ["candidate", "recruiter", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role", validRoles });
    }

    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent admin from demoting themselves
    if (Number(req.params.id) === req.user!.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    await user.update({ role });
    res.status(200).json({ message: "Role updated", userId: (user as any).id, newRole: role });
  } catch (error) {
    res.status(500).json({ message: "Error updating role", error });
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Remove a user (cascades via DB constraints on Applications + Profile)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Clean up related records first
    await Application.destroy({ where: { userId } });
    await Profile.destroy({ where: { userId } });
    await Job.destroy({ where: { recruiterId: userId } });
    await user.destroy();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// ─── GET /api/admin/jobs ──────────────────────────────────────────────────────
// All jobs with recruiter info; optional ?recruiterId filter
export const getAllJobsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.recruiterId) where.recruiterId = Number(req.query.recruiterId);

    const jobs = await Job.findAll({
      where,
      include: [{ model: User, as: "recruiter", attributes: ["id", "name", "email"] }]
    });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs", error });
  }
};

// ─── DELETE /api/admin/jobs/:id ───────────────────────────────────────────────
// Remove any job and its applications
export const deleteJobAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await Application.destroy({ where: { jobId } });
    await job.destroy();

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job", error });
  }
};

// ─── GET /api/admin/applications ─────────────────────────────────────────────
// All applications with user + job details; optional ?status filter
export const getAllApplicationsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const applications = await Application.findAll({
      where,
      include: [
        { model: User, as: "User", attributes: ["id", "name", "email", "role"] },
        { model: Job, as: "Job", attributes: ["id", "title", "company", "location"] }
      ]
    });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications", error });
  }
};

// ─── GET /api/admin/search ────────────────────────────────────────────────────
// Search users by name or email
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query param 'q' is required" });

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name:  { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } }
        ]
      },
      attributes: { exclude: ["password"] }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching users", error });
  }
};
