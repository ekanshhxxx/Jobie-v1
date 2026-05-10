import { Response } from "express";
import { Op } from "sequelize";
import { QueryTypes } from "sequelize";
import { AuthRequest } from "../middleware/authMiddleware";
import sequelize from "../config/database";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import Profile from "../models/Profile";

// ─── PATCH /api/admin/jobs/:id/approve ──────────────────────────────────────
export const approveJob = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    await job.update({ status: "approved", approvalStatus: "approved" });
    res.status(200).json({ message: "Job approved", jobId, status: "approved" });
  } catch (error) {
    res.status(500).json({ message: "Error approving job", error });
  }
};

// ─── PATCH /api/admin/jobs/:id/reject ───────────────────────────────────────
export const rejectJob = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = Number(req.params.id);
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    await job.update({ status: "rejected", approvalStatus: "rejected" });
    res.status(200).json({ message: "Job rejected", jobId, status: "rejected" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting job", error });
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
// Platform-wide dashboard numbers
export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalJobs, pendingJobs, approvedJobs, rejectedJobs, totalApplications, candidates, recruiters, admins] =
      await Promise.all([
        User.count(),
        Job.count(),
        Job.count({ where: { approvalStatus: "pending_review" } }),
        Job.count({ where: { approvalStatus: "approved" } }),
        Job.count({ where: { approvalStatus: "rejected" } }),
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
      jobs: { total: totalJobs, pending: pendingJobs, approved: approvedJobs, rejected: rejectedJobs },
      applications: {
        total: totalApplications,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error });
  }
};

// GET /api/admin/data-health
// Duplicate/orphan diagnostics for identity consistency.
export const getDataHealth = async (_req: AuthRequest, res: Response) => {
  try {
    const sequelize = (User as any).sequelize;
    if (!sequelize) {
      return res.status(500).json({ message: "Sequelize instance unavailable" });
    }

    const duplicateEmails = await sequelize.query(
      `SELECT LOWER(TRIM(email)) AS normalizedEmail,
              COUNT(*) AS total,
              GROUP_CONCAT(id ORDER BY id) AS userIds,
              GROUP_CONCAT(email ORDER BY id SEPARATOR ' | ') AS rawEmails
         FROM users
        GROUP BY LOWER(TRIM(email))
       HAVING COUNT(*) > 1`,
      { type: QueryTypes.SELECT }
    );

    const duplicateFirebaseUids = await sequelize.query(
      `SELECT TRIM(firebaseUid) AS firebaseUid,
              COUNT(*) AS total,
              GROUP_CONCAT(id ORDER BY id) AS userIds
         FROM users
        WHERE firebaseUid IS NOT NULL AND TRIM(firebaseUid) <> ''
        GROUP BY TRIM(firebaseUid)
       HAVING COUNT(*) > 1`,
      { type: QueryTypes.SELECT }
    );

    const duplicateGithubUids = await sequelize.query(
      `SELECT TRIM(githubUid) AS githubUid,
              COUNT(*) AS total,
              GROUP_CONCAT(id ORDER BY id) AS userIds
         FROM users
        WHERE githubUid IS NOT NULL AND TRIM(githubUid) <> ''
        GROUP BY TRIM(githubUid)
       HAVING COUNT(*) > 1`,
      { type: QueryTypes.SELECT }
    );

    const orphanProfiles = await sequelize.query(
      `SELECT p.id, p.userId
         FROM profiles p
         LEFT JOIN users u ON u.id = p.userId
        WHERE u.id IS NULL`,
      { type: QueryTypes.SELECT }
    );

    const usersWithoutProfile = await sequelize.query(
      `SELECT u.id
         FROM users u
         LEFT JOIN profiles p ON p.userId = u.id
        WHERE p.id IS NULL`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      duplicates: {
        emails: duplicateEmails,
        firebaseUids: duplicateFirebaseUids,
        githubUids: duplicateGithubUids,
      },
      integrity: {
        orphanProfiles,
        usersWithoutProfileCount: usersWithoutProfile.length,
      },
      recommendation:
        "If duplicates are present, merge accounts first, then enforce/verify unique indexes on users(email,firebaseUid,githubUid) and profiles(userId).",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching data health", error });
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

// ─── GET /api/admin/recruiters/pending ────────────────────────────────────────
// List all recruiters awaiting profile verification
export const getPendingRecruiters = async (_req: AuthRequest, res: Response) => {
  try {
    const recruiters = await User.findAll({
      where: { role: "recruiter" },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Profile,
          as: "profile",
          where: { headline: "PENDING_ADMIN_APPROVAL" }
        }
      ]
    });
    res.status(200).json(recruiters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending recruiters", error });
  }
};

// ─── PATCH /api/admin/recruiters/:id/approve ──────────────────────────────────
// Verify a recruiter profile
export const approveRecruiter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    await profile.update({ headline: "VERIFIED" });
    res.status(200).json({ message: "Recruiter approved", userId });
  } catch (error) {
    res.status(500).json({ message: "Error approving recruiter", error });
  }
};

// ─── PATCH /api/admin/recruiters/:id/reject ───────────────────────────────────
// Reject a recruiter profile
export const rejectRecruiter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    await profile.update({ headline: "REJECTED" });
    res.status(200).json({ message: "Recruiter rejected", userId });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting recruiter", error });
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

    await sequelize.transaction(async (transaction) => {
      await Application.destroy({ where: { userId }, transaction });
      await Profile.destroy({ where: { userId }, transaction });
      await Job.destroy({ where: { recruiterId: userId }, transaction });
      await user.destroy({ transaction });
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

// ─── GET /api/admin/jobs ──────────────────────────────────────────────────────
// All jobs with recruiter info; optional ?recruiterId and ?status filters
export const getAllJobsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.query.recruiterId) where.recruiterId = Number(req.query.recruiterId);
    if (req.query.status) where.status = req.query.status;

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

// ─── PATCH /api/admin/users/:id/ban  (added 2026-03-09) ──────────────────────
export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    await (user as any).update({ banned: true });
    res.status(200).json({ message: "User banned" });
  } catch (error) {
    res.status(500).json({ message: "Error banning user", error });
  }
};

// ─── PATCH /api/admin/users/:id/unban ────────────────────────────────────────
export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    await (user as any).update({ banned: false });
    res.status(200).json({ message: "User unbanned" });
  } catch (error) {
    res.status(500).json({ message: "Error unbanning user", error });
  }
};
