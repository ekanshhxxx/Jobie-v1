import { Request, Response } from "express";
import Application from "../models/Application";
import Job from "../models/Job";
import Profile from "../models/Profile";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateMatchScore } from "../services/matchService";
import { sendShortlistedEmail, sendOfferLetterEmail, sendHiredEmail, sendRejectedEmail } from "../services/emailService";

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

function normalizeApplication(application: any) {
  const profile = application.User?.profile;
  const candidateSkills = parseStringArray(profile?.skills);
  const requiredSkills = parseStringArray(application.Job?.requiredSkills);
  const techStack = parseStringArray(application.Job?.techStack);
  const match = calculateMatchScore(candidateSkills, requiredSkills, techStack);
  const experience = parseStringArray(profile?.experience);
  const experienceSignal = Math.min(experience.length / 3, 1) * 100;
  const hiringProbability = Math.round(match.score * 0.7 + experienceSignal * 0.3);

  return {
    id: application.id,
    userId: application.userId,
    jobId: application.jobId,
    status: application.status,
    atsMatchScore: application.atsMatchScore ?? null,
    offerDetails: application.offerDetails ?? null,
    createdAt: application.createdAt ? new Date(application.createdAt).toISOString() : null,
    updatedAt: application.updatedAt ? new Date(application.updatedAt).toISOString() : null,
    User: {
      id: application.User?.id,
      name: application.User?.name || "Unknown",
      email: application.User?.email || "",
      role: application.User?.role || "candidate",
      profile: {
        title: profile?.headline || "Candidate",
        skills: candidateSkills,
      },
    },
    Job: application.Job
      ? {
          id: application.Job.id,
          title: application.Job.title,
          company: application.Job.company,
          location: application.Job.location,
          lifecycleStatus: application.Job.lifecycleStatus || "published",
          approvalStatus: application.Job.approvalStatus || application.Job.status || "approved",
        }
      : null,
    matchSummary: {
      matchScore: match.score,
      hiringProbability,
      matchedSkills: match.matched,
      missingSkills: match.missing,
      matchedTech: match.techMatched,
      missingTech: match.techMissing,
    },
  };
}

export const applyJob = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const { userId, jobId, resumeUrl, atsCheckId, atsMatchScore } = req.body;

    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "candidate" && requester.role !== "admin") {
      return res.status(403).json({ message: "Only candidates can apply to jobs" });
    }

    const candidateId = requester.role === "admin" && userId ? Number(userId) : requester.id;
    const job = await Job.findByPk(Number(jobId));
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const lifecycle = (job as any).lifecycleStatus || ((job as any).status === "approved" ? "published" : "draft");
    const approval = (job as any).approvalStatus || (job as any).status || "approved";
    if (lifecycle !== "published" || approval !== "approved") {
      return res.status(400).json({ message: "This role is not accepting applications" });
    }

    const existing = await Application.findOne({
      where: { userId: candidateId, jobId: Number(jobId) },
    });
    if (existing) {
      return res.status(409).json({ message: "You already applied to this role" });
    }

    const application = await Application.create({
      userId: candidateId,
      jobId: Number(jobId),
      resumeUrl: resumeUrl || null,
      atsCheckId: atsCheckId || null,
      atsMatchScore: atsMatchScore != null ? Number(atsMatchScore) : null,
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({
      message: "Error applying for job",
      error,
    });
  }
};

export const getUserApplications = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const userId = Number(req.params.id);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const applications = await Application.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(applications);
  } catch (error) {
    console.error("GET USER APPS ERROR:", error);
    res.status(500).json({
      message: "Error fetching applications",
      error: String(error),
    });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const jobId = Number(req.params.jobId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (requester.role !== "admin" && requester.id !== Number((job as any).recruiterId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const applications = await Application.findAll({
      where: { jobId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job applications",
      error,
    });
  }
};

export const getRecruiterApplications = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const recruiterId = Number(req.params.recruiterId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== recruiterId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const jobIdFilter = req.query.jobId ? Number(req.query.jobId) : null;
    const jobWhere: Record<string, unknown> = { recruiterId };
    if (jobIdFilter) jobWhere.id = jobIdFilter;

    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          required: true,
          where: jobWhere,
          attributes: [
            "id",
            "title",
            "company",
            "location",
            "status",
            "lifecycleStatus",
            "approvalStatus",
            "requiredSkills",
            "techStack",
          ],
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

    res.status(200).json(applications.map((application: any) => normalizeApplication(application)));
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recruiter applications",
      error,
    });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const id = Number(req.params.id);
    const { status, offerDetails } = req.body;

    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validStatuses = [
      "applied",
      "shortlisted",
      "interview_scheduled",
      "interview_done",
      "offer_sent",
      "offer_accepted",
      "offer_rejected",
      "hired",
      "rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findByPk(id, {
      include: [
        { model: Job, attributes: ["id", "recruiterId", "title", "company"] },
        { model: User, attributes: ["id", "name", "email"] },
      ],
    });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const recruiterId = Number((application as any).Job?.recruiterId);
    const candidateId = Number((application as any).userId);

    const isCandidateRespondingToOffer = 
      requester.id === candidateId && 
      requester.role === "candidate" && 
      (status === "offer_accepted" || status === "offer_rejected") && 
      (application as any).status === "offer_sent";

    if (requester.role !== "admin" && requester.id !== recruiterId && !isCandidateRespondingToOffer) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatePayload: Record<string, unknown> = { status };

    // If recruiter is sending an offer, store the offer details
    if (status === "offer_sent" && offerDetails) {
      updatePayload.offerDetails = offerDetails;
    }

    await (application as any).update(updatePayload);

    // ── Fire & forget email notifications ─────────────────────────────────────
    const candidateName = (application as any).User?.name || "Candidate";
    const candidateEmail = (application as any).User?.email;
    const jobTitle = (application as any).Job?.title || "the position";
    const company = (application as any).Job?.company || "";

    if (candidateEmail) {
      if (status === "shortlisted") {
        sendShortlistedEmail({ candidateName, candidateEmail, jobTitle, company }).catch(() => {});
      } else if (status === "offer_sent") {
        sendOfferLetterEmail({
          candidateName,
          candidateEmail,
          jobTitle,
          company,
          offerDetails: offerDetails ?? null,
        }).catch(() => {});
      } else if (status === "hired") {
        sendHiredEmail({ candidateName, candidateEmail, jobTitle, company }).catch(() => {});
      } else if (status === "rejected") {
        sendRejectedEmail({ candidateName, candidateEmail, jobTitle, company }).catch(() => {});
      }
    }

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: "Error updating application status", error });
  }
};
