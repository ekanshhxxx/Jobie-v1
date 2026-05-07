import { Response } from "express";
import Application from "../models/Application";
import Job from "../models/Job";
import Profile from "../models/Profile";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateMatchScore } from "../services/matchService";
import sequelize from "../config/database";

let jobColumnCache: Set<string> | null = null;

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

function getSafeJobAttributes(columns: Set<string>) {
  const candidates = [
    "id",
    "title",
    "company",
    "location",
    "salary",
    "description",
    "requiredSkills",
    "skills",
    "techStack",
    "techSkills",
    "experienceLevel",
    "experience",
    "lifecycleStatus",
    "approvalStatus",
    "status",
    "recruiterId",
    "createdAt",
    "updatedAt",
  ];

  return candidates.filter((column) => columns.has(column));
}

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

function normalizeJob(job: any, applicantCount: number, newApplicantCount: number, lastActivityAt: string | null) {
  const legacyStatus = String(job.status || "").toLowerCase();
  const lifecycleFallback =
    legacyStatus === "pending" ? "draft" : legacyStatus === "rejected" ? "closed" : "published";
  const approvalFallback =
    legacyStatus === "pending" ? "pending_review" : legacyStatus === "rejected" ? "rejected" : "approved";

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location || "",
    salary: job.salary || "",
    description: job.description || "",
    requiredSkills: parseStringArray(job.requiredSkills ?? job.skills),
    techStack: parseStringArray(job.techStack ?? job.techSkills),
    experienceLevel: job.experienceLevel || job.experience || "mid",
    lifecycleStatus: job.lifecycleStatus || lifecycleFallback,
    approvalStatus: job.approvalStatus || approvalFallback,
    status: job.approvalStatus || job.status || "approved",
    recruiterId: job.recruiterId ?? null,
    applicantCount,
    newApplicantCount,
    lastActivityAt: lastActivityAt || (job.updatedAt ? new Date(job.updatedAt).toISOString() : null),
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
  };
}

export const getRecruiterDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    const recruiterId = Number(req.params.recruiterId);

    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role !== "admin" && requester.id !== recruiterId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const jobColumns = await getJobColumns();
    const safeJobAttributes = getSafeJobAttributes(jobColumns);

    const jobs = await Job.findAll({
      where: { recruiterId },
      attributes: safeJobAttributes,
      order: [["updatedAt", "DESC"]],
      raw: true,
    });

    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          required: true,
          where: { recruiterId },
          attributes: safeJobAttributes,
        },
        {
          model: User,
          attributes: ["id", "name", "email", "role"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["headline", "skills", "experience"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const jobMetrics = new Map<number, { applicantCount: number; newApplicantCount: number; lastActivityAt: string | null }>();
    applications.forEach((application: any) => {
      const jobId = Number(application.jobId);
      const current = jobMetrics.get(jobId) || {
        applicantCount: 0,
        newApplicantCount: 0,
        lastActivityAt: null,
      };
      current.applicantCount += 1;
      if (application.status === "applied") current.newApplicantCount += 1;
      const nextDate = application.createdAt ? new Date(application.createdAt).toISOString() : null;
      if (!current.lastActivityAt || (nextDate && new Date(nextDate).getTime() > new Date(current.lastActivityAt).getTime())) {
        current.lastActivityAt = nextDate;
      }
      jobMetrics.set(jobId, current);
    });

    const jobsWithMetrics = jobs.map((job: any) => {
      const metrics = jobMetrics.get(Number(job.id)) || {
        applicantCount: 0,
        newApplicantCount: 0,
        lastActivityAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
      };
      return normalizeJob(job, metrics.applicantCount, metrics.newApplicantCount, metrics.lastActivityAt);
    });

    const openRoles = jobsWithMetrics.filter((job) => job.lifecycleStatus === "published" && job.approvalStatus === "approved");
    const draftRoles = jobsWithMetrics.filter((job) => job.lifecycleStatus === "draft");
    const pendingApproval = jobsWithMetrics.filter((job) => job.approvalStatus === "pending_review");
    const closedRoles = jobsWithMetrics.filter((job) => job.lifecycleStatus === "closed");
    const totalApplicants = applications.length;
    const newApplicants = applications.filter((application: any) => application.status === "applied").length;
    const interviewing = applications.filter((application: any) => String(application.status).startsWith("interview")).length;
    const offers = applications.filter((application: any) => String(application.status).startsWith("offer")).length;
    const hired = applications.filter((application: any) => application.status === "hired").length;
    const activePipeline = applications.filter((application: any) => !["hired", "rejected", "offer_rejected"].includes(application.status)).length;

    const recentApplicants = applications.slice(0, 6).map((application: any) => {
      const profile = application.User?.profile;
      const candidateSkills = parseStringArray(profile?.skills);
      const requiredSkills = parseStringArray(application.Job?.requiredSkills);
      const techStack = parseStringArray(application.Job?.techStack);
      const match = calculateMatchScore(candidateSkills, requiredSkills, techStack);
      const experience = parseStringArray(profile?.experience);
      const projectDensity = Math.min(experience.length / 3, 1) * 100;
      const hiringProbability = Math.round(match.score * 0.7 + projectDensity * 0.3);

      return {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt ? new Date(application.createdAt).toISOString() : null,
        candidate: {
          id: application.User?.id,
          name: application.User?.name || "Unknown",
          email: application.User?.email || "",
          headline: profile?.headline || "Candidate",
        },
        job: {
          id: application.Job?.id,
          title: application.Job?.title || "Untitled role",
        },
        matchSummary: {
          matchScore: match.score,
          hiringProbability,
        },
      };
    });

    const pipelinePreview = {
      applied: applications.filter((application: any) => application.status === "applied").length,
      shortlisted: applications.filter((application: any) => application.status === "shortlisted").length,
      interview: applications.filter((application: any) => String(application.status).startsWith("interview")).length,
      offer: applications.filter((application: any) => String(application.status).startsWith("offer")).length,
      hired,
      rejected: applications.filter((application: any) => application.status === "rejected").length,
    };

    res.status(200).json({
      recruiterId,
      summary: {
        openRoles: openRoles.length,
        draftRoles: draftRoles.length,
        pendingApproval: pendingApproval.length,
        closedRoles: closedRoles.length,
        totalApplicants,
        newApplicants,
        activePipeline,
        interviewing,
        offers,
        hired,
      },
      roles: jobsWithMetrics,
      roleHealth: jobsWithMetrics.slice(0, 8),
      zeroApplicantRoles: jobsWithMetrics.filter((job) => job.applicantCount === 0).slice(0, 6),
      recentApplicants,
      pipelinePreview,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching recruiter dashboard", error });
  }
};
