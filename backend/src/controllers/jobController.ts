import { Response } from "express";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import Job from "../models/Job";
import Application from "../models/Application";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import sequelize from "../config/database";

const JWT_SECRET = process.env.JWT_SECRET || "jobie_secret";

type LifecycleStatus = "draft" | "published" | "closed";
type ApprovalStatus = "approved" | "pending_review" | "rejected";

const VALID_LIFECYCLE: LifecycleStatus[] = ["draft", "published", "closed"];
const VALID_APPROVAL: ApprovalStatus[] = ["approved", "pending_review", "rejected"];
let jobColumnCache: Set<string> | null = null;

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function getJobColumns(): Promise<Set<string>> {
  if (jobColumnCache) return jobColumnCache;

  const tableNameRaw = (Job as any).getTableName?.() || "Jobs";
  const tableName = typeof tableNameRaw === "string" ? tableNameRaw : tableNameRaw?.tableName || "Jobs";

  try {
    const description = await sequelize.getQueryInterface().describeTable(tableName);
    jobColumnCache = new Set(Object.keys(description));
    return jobColumnCache;
  } catch {
    const description = await sequelize.getQueryInterface().describeTable(String(tableName).toLowerCase());
    jobColumnCache = new Set(Object.keys(description));
    return jobColumnCache;
  }
}

function toLegacyStatus(lifecycleStatus: LifecycleStatus, approvalStatus: ApprovalStatus): "pending" | "approved" | "rejected" {
  if (approvalStatus === "rejected") return "rejected";
  if (approvalStatus === "pending_review" || lifecycleStatus === "draft") return "pending";
  return "approved";
}

function filterToExistingColumns(payload: Record<string, unknown>, columns: Set<string>) {
  const next: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (columns.has(key)) next[key] = value;
  });
  return next;
}

function pickLifecycle(input: unknown, fallback: LifecycleStatus): LifecycleStatus {
  if (typeof input === "string" && VALID_LIFECYCLE.includes(input as LifecycleStatus)) {
    return input as LifecycleStatus;
  }
  return fallback;
}

function pickApproval(input: unknown, fallback: ApprovalStatus): ApprovalStatus {
  if (typeof input === "string" && VALID_APPROVAL.includes(input as ApprovalStatus)) {
    return input as ApprovalStatus;
  }
  return fallback;
}

function isJobPublic(job: any) {
  return (job.lifecycleStatus || "published") === "published" && (job.approvalStatus || job.status || "approved") === "approved";
}

function optionalRequester(req: AuthRequest): { id: number; role: string } | null {
  if (req.user) return req.user;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

async function buildJobMetrics(jobIds: number[]) {
  if (jobIds.length === 0) return new Map<number, { applicantCount: number; newApplicantCount: number; lastApplicationAt: string | null }>();

  const applications = await Application.findAll({
    where: { jobId: { [Op.in]: jobIds } },
    raw: true,
  });

  const metrics = new Map<number, { applicantCount: number; newApplicantCount: number; lastApplicationAt: string | null }>();

  applications.forEach((application: any) => {
    const current = metrics.get(application.jobId) || {
      applicantCount: 0,
      newApplicantCount: 0,
      lastApplicationAt: null,
    };

    current.applicantCount += 1;
    if (application.status === "applied") current.newApplicantCount += 1;

    const nextDate = application.createdAt ? new Date(application.createdAt).toISOString() : null;
    if (!current.lastApplicationAt || (nextDate && new Date(nextDate).getTime() > new Date(current.lastApplicationAt).getTime())) {
      current.lastApplicationAt = nextDate;
    }

    metrics.set(application.jobId, current);
  });

  return metrics;
}

function normalizeJob(job: any, metrics?: { applicantCount: number; newApplicantCount: number; lastApplicationAt: string | null }) {
  const plain = typeof job.get === "function" ? job.get({ plain: true }) : job;
  const requiredSkills = parseStringArray(plain.requiredSkills ?? plain.skills);
  const techStack = parseStringArray(plain.techStack ?? plain.techSkills);

  const legacyStatus = String(plain.status || "").toLowerCase();
  const lifecycleFallback: LifecycleStatus =
    legacyStatus === "pending" ? "draft" : legacyStatus === "rejected" ? "closed" : "published";
  const approvalFallback: ApprovalStatus =
    legacyStatus === "pending" ? "pending_review" : legacyStatus === "rejected" ? "rejected" : "approved";

  const lifecycleStatus = pickLifecycle(plain.lifecycleStatus, plain.status === "approved" ? "published" : "draft");
  const approvalStatus = pickApproval(plain.approvalStatus, approvalFallback);
  const applicantCount = metrics?.applicantCount ?? plain.applicantCount ?? 0;
  const newApplicantCount = metrics?.newApplicantCount ?? plain.newApplicantCount ?? 0;
  const updatedAt = plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null;
  const createdAt = plain.createdAt ? new Date(plain.createdAt).toISOString() : null;
  const lastActivityAt = metrics?.lastApplicationAt && updatedAt
    ? new Date(metrics.lastApplicationAt).getTime() > new Date(updatedAt).getTime()
      ? metrics.lastApplicationAt
      : updatedAt
    : metrics?.lastApplicationAt || updatedAt || createdAt;

  return {
    id: plain.id,
    title: plain.title,
    company: plain.company,
    location: plain.location || "",
    salary: plain.salary || "",
    description: plain.description || "",
    requiredSkills,
    techStack,
    experienceLevel: plain.experienceLevel || plain.experience || "mid",
    lifecycleStatus: plain.lifecycleStatus ? lifecycleStatus : lifecycleFallback,
    approvalStatus,
    status: plain.status || toLegacyStatus(lifecycleStatus, approvalStatus),
    recruiterId: plain.recruiterId ?? null,
    applicantCount,
    newApplicantCount,
    lastActivityAt,
    createdAt,
    updatedAt,
  };
}

function canManageJob(requester: { id: number; role: string } | undefined, job: any) {
  if (!requester) return false;
  return requester.role === "admin" || requester.id === Number(job.recruiterId);
}

// Get all jobs — public candidate view only shows published + approved roles
export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.findAll();
    const publicJobs = jobs.filter((job: any) => isJobPublic(job));
    res.status(200).json(publicJobs.map((job: any) => normalizeJob(job)));
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs", error });
  }
};

// Get single job
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findByPk(Number(req.params.id));

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const requester = optionalRequester(req);
    if (!isJobPublic(job) && !canManageJob(requester ?? undefined, job)) {
      return res.status(404).json({ message: "Job not found" });
    }

    const metrics = await buildJobMetrics([Number((job as any).id)]);
    res.status(200).json(normalizeJob(job, metrics.get(Number((job as any).id))));
  } catch (error) {
    res.status(500).json({ message: "Error fetching job", error });
  }
};

// Create job
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!["recruiter", "admin"].includes(requester.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      title,
      company,
      location,
      salary,
      description,
      requiredSkills,
      techStack,
      experienceLevel,
      recruiterId,
      lifecycleStatus,
      approvalStatus,
      status,
      intent,
    } = req.body;

    const ownerId = requester.role === "admin" && recruiterId ? Number(recruiterId) : requester.id;
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return res.status(401).json({ message: "Session account no longer exists. Please sign in again." });
    }
    if (!["recruiter", "admin"].includes(String((owner as any).role))) {
      return res.status(403).json({ message: "Only recruiter/admin accounts can create jobs." });
    }

    const nextLifecycle = pickLifecycle(
      lifecycleStatus,
      intent === "publish" || status === "approved" ? "published" : "draft"
    );
    const nextApproval = pickApproval(
      approvalStatus,
      status === "rejected" ? "rejected" : "approved"
    );
    const nextLegacyStatus = toLegacyStatus(nextLifecycle, nextApproval);
    const columns = await getJobColumns();

    const createPayload = filterToExistingColumns({
      title,
      company,
      location,
      salary,
      description,
      requiredSkills: parseStringArray(requiredSkills),
      skills: parseStringArray(requiredSkills),
      techStack: parseStringArray(techStack),
      techSkills: parseStringArray(techStack),
      experienceLevel: experienceLevel || "mid",
      experience: experienceLevel || "mid",
      lifecycleStatus: nextLifecycle,
      approvalStatus: nextApproval,
      recruiterId: ownerId,
      status: nextLegacyStatus,
    }, columns);

    const job = await Job.create(createPayload as any);

    res.status(201).json(normalizeJob(job));
  } catch (error: any) {
    if (error?.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: "Invalid recruiter account for this job. Please sign out and sign in again.",
        detail: error?.message || String(error),
      });
    }
    if (error?.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Job payload validation failed.",
        detail: error?.message || String(error),
      });
    }
    res.status(500).json({ message: "Error creating job", detail: error?.message || String(error) });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jobId = Number(req.params.id);
    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!canManageJob(requester, job)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const payload: Record<string, unknown> = {};

    if (req.body.title !== undefined) payload.title = req.body.title;
    if (req.body.company !== undefined) payload.company = req.body.company;
    if (req.body.location !== undefined) payload.location = req.body.location;
    if (req.body.salary !== undefined) payload.salary = req.body.salary;
    if (req.body.description !== undefined) payload.description = req.body.description;
    if (req.body.experienceLevel !== undefined) {
      payload.experienceLevel = req.body.experienceLevel;
      payload.experience = req.body.experienceLevel;
    }
    if (req.body.requiredSkills !== undefined) {
      const parsed = parseStringArray(req.body.requiredSkills);
      payload.requiredSkills = parsed;
      payload.skills = parsed;
    }
    if (req.body.techStack !== undefined) {
      const parsed = parseStringArray(req.body.techStack);
      payload.techStack = parsed;
      payload.techSkills = parsed;
    }

    let nextLifecycle = pickLifecycle((job as any).lifecycleStatus, (job as any).status === "approved" ? "published" : "draft");
    let nextApproval = pickApproval((job as any).approvalStatus, (job as any).status === "rejected" ? "rejected" : "approved");

    if (req.body.lifecycleStatus !== undefined) {
      nextLifecycle = pickLifecycle(req.body.lifecycleStatus, nextLifecycle);
      payload.lifecycleStatus = nextLifecycle;
    } else if (req.body.intent === "publish") {
      nextLifecycle = "published";
      payload.lifecycleStatus = "published";
    } else if (req.body.intent === "draft") {
      nextLifecycle = "draft";
      payload.lifecycleStatus = "draft";
    }
    if (req.body.approvalStatus !== undefined || req.body.status !== undefined) {
      nextApproval = pickApproval(req.body.approvalStatus ?? req.body.status, nextApproval);
      payload.approvalStatus = nextApproval;
    }
    payload.status = toLegacyStatus(nextLifecycle, nextApproval);

    const columns = await getJobColumns();
    const updatePayload = filterToExistingColumns(payload, columns);

    await (job as any).update(updatePayload);

    const metrics = await buildJobMetrics([jobId]);
    res.status(200).json(normalizeJob(job, metrics.get(jobId)));
  } catch (error: any) {
    res.status(500).json({ message: "Error updating job", detail: error?.message || String(error) });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jobId = Number(req.params.id);
    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!canManageJob(requester, job)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Application.destroy({ where: { jobId } });
    await (job as any).destroy();

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job", error });
  }
};

// Get all jobs posted by a specific recruiter
export const getRecruiterJobs = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recruiterId = Number(req.query.recruiterId || req.params.recruiterId || requester.id);
    if (!recruiterId) {
      return res.status(400).json({ message: "recruiterId query param is required" });
    }

    if (requester.role !== "admin" && requester.id !== recruiterId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const where: Record<string, unknown> = { recruiterId };
    if (req.query.lifecycleStatus) {
      where.lifecycleStatus = pickLifecycle(req.query.lifecycleStatus, "published");
    }
    if (req.query.approvalStatus) {
      where.approvalStatus = pickApproval(req.query.approvalStatus, "approved");
    }

    const jobs = await Job.findAll({
      where,
      order: [["updatedAt", "DESC"]],
    });

    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const filtered = search
      ? jobs.filter((job: any) =>
          `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(search)
        )
      : jobs;

    const metrics = await buildJobMetrics(filtered.map((job: any) => Number(job.id)));
    res.status(200).json(filtered.map((job: any) => normalizeJob(job, metrics.get(Number(job.id)))));
  } catch (error) {
    res.status(500).json({ message: "Error fetching recruiter jobs", error });
  }
};
