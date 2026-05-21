import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import Profile from "../models/Profile";
import Meeting from "../models/Meeting";
import CopilotSession from "../models/CopilotSession";
import CopilotMessage from "../models/CopilotMessage";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateMatchScore } from "../services/matchService";
import {
  generateStreamToken,
  isStreamConfigured,
  streamApiKey,
  streamClient,
  toStreamUserId,
} from "../services/streamService";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET || "jobie_secret";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type VerifiedIdentity = {
  id: number;
  role: string;
};

type CandidateSnapshot = {
  id: number;
  name: string;
  latestStatus: string;
  jobTitle: string;
  bestMatchScore: number;
  interviewAt: string | null;
};

type RecruiterPipelineSnapshot = {
  generatedAt: string;
  totalApplicants: number;
  statusCounts: Record<string, number>;
  jobBreakdown: Array<{ jobId: number; title: string; applicants: number }>;
  interviewCandidates: CandidateSnapshot[];
  topMatches: CandidateSnapshot[];
  candidates: CandidateSnapshot[];
};

type JobApplicantSnapshot = {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    requiredSkills: string[];
    techStack: string[];
  };
  totalApplicants: number;
  statusCounts: Record<string, number>;
  candidates: Array<{
    id: number;
    name: string;
    email: string;
    headline: string;
    status: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    skills: string[];
    experience: string;
    resumeSummary: string;
    interviewAt: string | null;
    appliedAt: string | null;
  }>;
};

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
      }
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const prettyStatus = (status: string): string => status.replace(/_/g, " ");

const getVerifiedIdentity = (req: Request): VerifiedIdentity | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: number; role?: string };
    if (!decoded?.id || !decoded?.role) return null;
    return { id: Number(decoded.id), role: String(decoded.role) };
  } catch {
    return null;
  }
};

const buildRecruiterSnapshot = async (recruiterId: number): Promise<RecruiterPipelineSnapshot> => {
  const [applications, meetings] = await Promise.all([
    Application.findAll({
      include: [
        {
          model: Job,
          required: true,
          where: { recruiterId },
          attributes: ["id", "title", "requiredSkills", "techStack"],
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["skills"],
              required: false,
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    }),
    Meeting.findAll({
      where: { recruiterId },
      attributes: ["candidateId", "scheduledAt", "status"],
      include: [
        { model: User, as: "candidate", attributes: ["id", "name"] },
        { model: Job, as: "job", attributes: ["id", "title"] },
      ],
      order: [["scheduledAt", "DESC"]],
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  const jobMap = new Map<number, { jobId: number; title: string; applicants: number }>();
  const candidateMap = new Map<number, CandidateSnapshot & { _touchedAt: number }>();
  const meetingByCandidate = new Map<number, string>();

  meetings.forEach((meeting: any) => {
    if (meeting.status === "cancelled") return;
    const candidateId = Number(meeting.candidateId);
    const scheduledAt = meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString() : "";
    if (!candidateId || !scheduledAt) return;
    if (!meetingByCandidate.has(candidateId)) {
      meetingByCandidate.set(candidateId, scheduledAt);
    }
  });

  applications.forEach((application: any) => {
    const status = String(application.status || "applied");
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const job = application.Job;
    const candidate = application.User;
    if (!job || !candidate) return;
    const jobId = Number(job.id);
    const existingJob = jobMap.get(jobId) || { jobId, title: String(job.title || "Untitled role"), applicants: 0 };
    existingJob.applicants += 1;
    jobMap.set(jobId, existingJob);

    const skills = parseStringArray(candidate.profile?.skills);
    const requiredSkills = parseStringArray(job.requiredSkills);
    const techStack = parseStringArray(job.techStack);
    const rigidMatch = calculateMatchScore(skills, requiredSkills, techStack);

    // Prefer LLM ATS score if available on the application, fallback to rigid string match
    const finalScore = application.atsMatchScore != null ? Number(application.atsMatchScore) : rigidMatch.score;

    const candidateId = Number(candidate.id);
    const touchedAt = new Date(application.updatedAt || application.createdAt || 0).getTime();
    const current = candidateMap.get(candidateId);
    const existingBest = current?.bestMatchScore ?? 0;

    const next: CandidateSnapshot & { _touchedAt: number } = {
      id: candidateId,
      name: String(candidate.name || `Candidate ${candidateId}`),
      latestStatus: current && current._touchedAt > touchedAt ? current.latestStatus : status,
      jobTitle: current && current._touchedAt > touchedAt ? current.jobTitle : String(job.title || "Untitled role"),
      bestMatchScore: Math.max(existingBest, finalScore),
      interviewAt: meetingByCandidate.get(candidateId) || current?.interviewAt || null,
      _touchedAt: Math.max(current?._touchedAt || 0, touchedAt),
    };

    candidateMap.set(candidateId, next);
  });

  const candidates = Array.from(candidateMap.values())
    .sort((a, b) => b._touchedAt - a._touchedAt)
    .map(({ _touchedAt, ...rest }) => rest);

  const interviewCandidates = candidates.filter((candidate) => candidate.latestStatus.startsWith("interview"));
  const topMatches = [...candidates].sort((a, b) => b.bestMatchScore - a.bestMatchScore).slice(0, 5);
  const jobBreakdown = Array.from(jobMap.values()).sort((a, b) => b.applicants - a.applicants).slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    totalApplicants: applications.length,
    statusCounts,
    jobBreakdown,
    interviewCandidates,
    topMatches,
    candidates,
  };
};

const buildRecruiterContextText = (snapshot: RecruiterPipelineSnapshot): string => {
  const topJobs = snapshot.jobBreakdown
    .slice(0, 5)
    .map((job) => `${job.title}: ${job.applicants}`)
    .join(", ");

  const topCandidates = snapshot.topMatches
    .map((candidate) => `${candidate.name} (${candidate.bestMatchScore}% on ${candidate.jobTitle})`)
    .join(", ");

  return [
    `Snapshot generated at: ${snapshot.generatedAt}`,
    `Total applicants: ${snapshot.totalApplicants}`,
    `Status counts: ${JSON.stringify(snapshot.statusCounts)}`,
    `Top jobs by applicants: ${topJobs || "none"}`,
    `Top match candidates: ${topCandidates || "none"}`,
  ].join("\n");
};

const summarizeExperience = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .slice(0, 3)
    .map((item: any) => {
      if (!item || typeof item !== "object") return "";
      const title = item.title || item.role || item.position || "";
      const company = item.company || item.organization || "";
      return [title, company].filter(Boolean).join(" at ");
    })
    .filter(Boolean)
    .join("; ");
};

const summarizeResumeReport = (value: unknown): string => {
  if (!value || typeof value !== "object") return "";
  const report = value as Record<string, any>;
  const score = report.score || report.overallScore || report.atsScore;
  const summary = report.summary || report.overview || report.feedback;
  return [score ? `Resume score: ${score}` : "", summary ? `Summary: ${summary}` : ""].filter(Boolean).join(". ");
};

const buildJobApplicantSnapshot = async (recruiterId: number, jobId: number): Promise<JobApplicantSnapshot> => {
  const job = await Job.findOne({
    where: { id: jobId, recruiterId },
    attributes: ["id", "title", "company", "location", "requiredSkills", "techStack"],
  });

  if (!job) {
    throw Object.assign(new Error("Job not found or not owned by recruiter"), { status: 404 });
  }

  const [applications, meetings] = await Promise.all([
    Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["headline", "skills", "experience", "resumeReport", "githubVerifiedSkills"],
              required: false,
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    }),
    Meeting.findAll({
      where: { recruiterId, jobId },
      attributes: ["candidateId", "scheduledAt", "status"],
      order: [["scheduledAt", "DESC"]],
    }),
  ]);

  const requiredSkills = parseStringArray((job as any).requiredSkills);
  const techStack = parseStringArray((job as any).techStack);
  const statusCounts: Record<string, number> = {};
  const meetingByCandidate = new Map<number, string>();

  meetings.forEach((meeting: any) => {
    if (meeting.status === "cancelled") return;
    const candidateId = Number(meeting.candidateId);
    if (!candidateId || !meeting.scheduledAt) return;
    if (!meetingByCandidate.has(candidateId)) {
      meetingByCandidate.set(candidateId, new Date(meeting.scheduledAt).toISOString());
    }
  });

  const candidates = applications.map((application: any) => {
    const candidate = application.User;
    const profile = candidate?.profile;
    const status = String(application.status || "applied");
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const profileSkills = parseStringArray(profile?.skills);
    const githubSkills = parseStringArray(profile?.githubVerifiedSkills);
    const allSkills = Array.from(new Set([...profileSkills, ...githubSkills]));
    const match = calculateMatchScore(allSkills, requiredSkills, techStack);

    return {
      id: Number(candidate?.id),
      name: String(candidate?.name || "Unknown candidate"),
      email: String(candidate?.email || ""),
      headline: String(profile?.headline || ""),
      status,
      matchScore: match.score,
      matchedSkills: [...(match.matched || []), ...(match.techMatched || [])],
      missingSkills: [...(match.missing || []), ...(match.techMissing || [])],
      skills: allSkills,
      experience: summarizeExperience(profile?.experience),
      resumeSummary: summarizeResumeReport(profile?.resumeReport),
      interviewAt: meetingByCandidate.get(Number(candidate?.id)) || null,
      appliedAt: application.createdAt ? new Date(application.createdAt).toISOString() : null,
    };
  });

  return {
    job: {
      id: Number((job as any).id),
      title: String((job as any).title || "Untitled role"),
      company: String((job as any).company || ""),
      location: String((job as any).location || ""),
      requiredSkills,
      techStack,
    },
    totalApplicants: candidates.length,
    statusCounts,
    candidates: candidates.sort((a, b) => b.matchScore - a.matchScore),
  };
};

const buildJobApplicantContextText = (snapshot: JobApplicantSnapshot): string => {
  const candidateLines = snapshot.candidates.map((candidate) => {
    const interview = candidate.interviewAt ? `; interviewAt=${candidate.interviewAt}` : "";
    const skills = candidate.skills.length ? `; skills=${candidate.skills.slice(0, 14).join(", ")}` : "";
    const matched = candidate.matchedSkills.length ? `; matched=${candidate.matchedSkills.join(", ")}` : "";
    const missing = candidate.missingSkills.length ? `; missing=${candidate.missingSkills.join(", ")}` : "";
    const experience = candidate.experience ? `; experience=${candidate.experience}` : "";
    const resume = candidate.resumeSummary ? `; resume=${candidate.resumeSummary}` : "";
    return `- ${candidate.name} <${candidate.email}>: status=${prettyStatus(candidate.status)}; match=${candidate.matchScore}%; headline=${candidate.headline || "n/a"}${matched}${missing}${skills}${experience}${resume}${interview}`;
  });

  return [
    `Job: ${snapshot.job.title} at ${snapshot.job.company}`,
    `Location: ${snapshot.job.location || "not specified"}`,
    `Required skills: ${snapshot.job.requiredSkills.join(", ") || "not specified"}`,
    `Tech stack: ${snapshot.job.techStack.join(", ") || "not specified"}`,
    `Total applicants: ${snapshot.totalApplicants}`,
    `Status counts: ${JSON.stringify(snapshot.statusCounts)}`,
    `Applicants:\n${candidateLines.join("\n") || "No applicants for this job yet."}`,
  ].join("\n");
};

const buildFallbackJobReply = (question: string, snapshot: JobApplicantSnapshot): string => {
  const lower = question.toLowerCase();
  if (!snapshot.totalApplicants) {
    return `There are no applicants for ${snapshot.job.title} yet.`;
  }

  if (/best|top|strong|shortlist|recommend/.test(lower)) {
    const top = snapshot.candidates.slice(0, 5);
    return [
      `Top candidates for ${snapshot.job.title}:`,
      ...top.map((candidate, index) => `${index + 1}. ${candidate.name} - ${candidate.matchScore}% match, ${prettyStatus(candidate.status)}${candidate.matchedSkills.length ? `, matched: ${candidate.matchedSkills.slice(0, 5).join(", ")}` : ""}`),
    ].join("\n");
  }

  if (/count|how many|status|pipeline/.test(lower)) {
    return `For ${snapshot.job.title}, you have ${snapshot.totalApplicants} applicants. Status breakdown: ${JSON.stringify(snapshot.statusCounts)}.`;
  }

  return `I found ${snapshot.totalApplicants} applicants for ${snapshot.job.title}. The strongest current match is ${snapshot.candidates[0].name} at ${snapshot.candidates[0].matchScore}%.`;
};

const getLastUserMessage = (messages: ChatMessage[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content.trim();
    }
  }
  return "";
};

const findCandidateByName = (snapshot: RecruiterPipelineSnapshot, queryName: string): CandidateSnapshot[] => {
  const needle = queryName.trim().toLowerCase();
  if (!needle) return [];
  return snapshot.candidates.filter((candidate) => candidate.name.toLowerCase().includes(needle));
};

const buildDeterministicRecruiterReply = (
  lastUserMessage: string,
  snapshot: RecruiterPipelineSnapshot,
  recruiterName: string
): string | null => {
  const lower = lastUserMessage.toLowerCase();

  if (/(who\s+am\s+i|what\s+is\s+my\s+name)/i.test(lower)) {
    return `You are ${recruiterName}, logged in as a recruiter in Jobie.`;
  }

  if (/(how\s+many|count).*(appl|applicant|apply)/i.test(lower)) {
    if (snapshot.jobBreakdown.length === 0) {
      return "There are no applications in your pipeline yet.";
    }

    if (snapshot.jobBreakdown.length === 1) {
      const onlyJob = snapshot.jobBreakdown[0];
      return `You currently have ${onlyJob.applicants} applicants for ${onlyJob.title}.`;
    }

    const breakdown = snapshot.jobBreakdown.slice(0, 5).map((job) => `${job.title}: ${job.applicants}`).join("; ");
    return `You currently have ${snapshot.totalApplicants} total applicants across your jobs. Top roles by volume: ${breakdown}.`;
  }

  if (/(selected.*interview|who.*interview|shortlisted)/i.test(lower)) {
    if (!snapshot.interviewCandidates.length) {
      return "No candidates are currently in an interview stage in your pipeline.";
    }

    const lines = snapshot.interviewCandidates.slice(0, 8).map((candidate) => {
      const meetingSuffix = candidate.interviewAt
        ? `, interview scheduled for ${new Date(candidate.interviewAt).toLocaleString()}`
        : "";
      return `- ${candidate.name}: ${prettyStatus(candidate.latestStatus)} for ${candidate.jobTitle}${meetingSuffix}`;
    });

    return `Candidates currently in interview stages:\n${lines.join("\n")}`;
  }

  const whatAboutMatch = lower.match(/what\s+about\s+([a-z0-9 .'-]{2,})\??$/i);
  if (whatAboutMatch?.[1]) {
    const found = findCandidateByName(snapshot, whatAboutMatch[1]);
    if (!found.length) {
      return `I cannot find ${whatAboutMatch[1].trim()} in your current applications.`;
    }

    const candidate = found[0];
    const meetingSuffix = candidate.interviewAt
      ? ` Interview is scheduled for ${new Date(candidate.interviewAt).toLocaleString()}.`
      : "";
    return `${candidate.name} is currently in ${prettyStatus(candidate.latestStatus)} for ${candidate.jobTitle}. Best ATS match score in current data is ${candidate.bestMatchScore}%.${meetingSuffix}`;
  }
  return null;
};

export const getChatResponse = async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const sanitizedMessages: ChatMessage[] = messages
      .map((message: any): ChatMessage => {
        const role: ChatMessage["role"] = message?.role === "user" ? "user" : "assistant";
        const content = typeof message?.content === "string" ? message.content.trim() : "";
        return { role, content };
      })
      .filter((message: ChatMessage) => message.content.length > 0)
      .slice(-10);

    if (!sanitizedMessages.length) {
      return res.status(400).json({ error: "At least one valid message is required." });
    }

    const verifiedIdentity = getVerifiedIdentity(req);
    const requester = verifiedIdentity ? await User.findByPk(verifiedIdentity.id, { attributes: ["id", "name", "role"] }) : null;
    const effectiveRole = requester ? String((requester as any).role) : String(userContext?.role || "guest");
    const effectiveName = requester ? String((requester as any).name || "there") : String(userContext?.name || "there");

    let recruiterSnapshot: RecruiterPipelineSnapshot | null = null;
    if (verifiedIdentity?.role === "recruiter") {
      try {
        recruiterSnapshot = await buildRecruiterSnapshot(verifiedIdentity.id);
      } catch (snapshotError) {
        console.warn("Recruiter snapshot unavailable for chat:", snapshotError);
      }
    }

    const lastUserMessage = getLastUserMessage(sanitizedMessages);
    if (effectiveRole === "recruiter" && recruiterSnapshot) {
      const deterministicReply = buildDeterministicRecruiterReply(lastUserMessage, recruiterSnapshot, effectiveName);
      if (deterministicReply) {
        return res.status(200).json({ reply: deterministicReply });
      }
    }

    let systemPrompt = `You are Jobie AI, an incredibly smart, friendly, and highly capable AI assistant for the Jobie platform (an AI-powered job matching and recruitment platform). 
Current Date and Time: ${new Date().toLocaleString()}

Capabilities & Rules:
1) You have general world knowledge. You CAN and SHOULD answer general questions (e.g. tech trends, programming help, date/time, general advice, etc.) intelligently.
2) When answering questions specifically about Jobie platform data (like candidates, applications, jobs, or ATS scores), ONLY use the facts explicitly provided in this prompt context. Do not invent platform data.
3) If the user asks about the platform, Jobie was created by an incredibly talented developer to revolutionize AI recruitment. 
4) Keep your tone professional, enthusiastic, and highly helpful.
5) Do not claim "live memory" or hidden data access. Keep responses practical.`;

    systemPrompt += `\n\nVerified user context: role=${effectiveRole}; name=${effectiveName}.`;

    if (effectiveRole === "recruiter") {
      systemPrompt += `\n\nThe user is a recruiter. Prioritize pipeline clarity and precise status summaries.`;
    } else if (effectiveRole === "candidate") {
      systemPrompt += `\n\nThe user is a candidate. Help with jobs, resume quality, and application progress.`;
    }

    // @ts-ignore
    if (recruiterSnapshot && typeof buildRecruiterContextText === 'function') {
      systemPrompt += `\n\nAuthoritative recruiter pipeline context:\n${buildRecruiterContextText(recruiterSnapshot)}`;
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedMessages.map((m: ChatMessage) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages as any,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I'm having trouble thinking right now. Please try again later!";

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Failed to fetch response." });
  }
};

const serializeSession = (session: any, messageCount = 0) => ({
  id: session.id,
  recruiterId: session.recruiterId,
  jobId: session.jobId,
  title: session.title,
  metadata: session.metadata,
  messageCount,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

export const getCopilotJobs = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "recruiter" && requester.role !== "admin") {
      return res.status(403).json({ message: "Recruiter access required" });
    }

    const jobs = await Job.findAll({
      where: requester.role === "admin" ? {} : { recruiterId: requester.id },
      attributes: ["id", "title", "company", "location", "recruiterId", "createdAt"],
      include: [{ model: Application, as: "applications", attributes: ["id", "status"], required: false }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      jobs: jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        recruiterId: job.recruiterId,
        applicantCount: Array.isArray(job.applications) ? job.applications.length : 0,
      })),
    });
  } catch (error) {
    console.error("Error loading copilot jobs:", error);
    return res.status(500).json({ message: "Failed to load copilot jobs" });
  }
};

export const getCopilotSessions = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "recruiter" && requester.role !== "admin") {
      return res.status(403).json({ message: "Recruiter access required" });
    }

    const where: Record<string, unknown> = { recruiterId: requester.id };
    if (req.query.jobId) where.jobId = Number(req.query.jobId);

    const sessions = await CopilotSession.findAll({
      where,
      include: [{ model: CopilotMessage, as: "messages", attributes: ["id"], required: false }],
      order: [["updatedAt", "DESC"]],
    });

    return res.status(200).json({
      sessions: sessions.map((session: any) => serializeSession(session, session.messages?.length || 0)),
    });
  } catch (error) {
    console.error("Error loading copilot sessions:", error);
    return res.status(500).json({ message: "Failed to load copilot sessions" });
  }
};

export const createCopilotSession = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });
    if (requester.role !== "recruiter" && requester.role !== "admin") {
      return res.status(403).json({ message: "Recruiter access required" });
    }

    const jobId = Number(req.body?.jobId);
    if (!jobId) return res.status(400).json({ message: "jobId is required" });

    const snapshot = await buildJobApplicantSnapshot(requester.id, jobId);
    const session = await CopilotSession.create({
      recruiterId: requester.id,
      jobId,
      title: req.body?.title || `${snapshot.job.title} review`,
      metadata: {
        jobTitle: snapshot.job.title,
        company: snapshot.job.company,
        applicantCount: snapshot.totalApplicants,
      },
    } as any);

    const welcome = await CopilotMessage.create({
      sessionId: (session as any).id,
      role: "assistant",
      content: `I loaded ${snapshot.totalApplicants} applicant${snapshot.totalApplicants === 1 ? "" : "s"} for ${snapshot.job.title}. Ask me to rank candidates, compare skills, explain gaps, or prepare an interview shortlist.`,
    } as any);

    return res.status(201).json({
      session: serializeSession(session, 1),
      messages: [welcome],
    });
  } catch (error: any) {
    console.error("Error creating copilot session:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to create copilot session" });
  }
};

export const getCopilotSession = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const session = await CopilotSession.findOne({
      where: { id: Number(req.params.sessionId), recruiterId: requester.id },
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const messages = await CopilotMessage.findAll({
      where: { sessionId: (session as any).id },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      session: serializeSession(session, messages.length),
      messages,
    });
  } catch (error) {
    console.error("Error loading copilot session:", error);
    return res.status(500).json({ message: "Failed to load copilot session" });
  }
};

export const sendCopilotMessage = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ message: "Message content is required" });

    const session = await CopilotSession.findOne({
      where: { id: Number(req.params.sessionId), recruiterId: requester.id },
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const snapshot = await buildJobApplicantSnapshot(requester.id, Number((session as any).jobId));
    const previousMessages = await CopilotMessage.findAll({
      where: { sessionId: (session as any).id },
      order: [["createdAt", "ASC"]],
      limit: 30,
    });

    const userMessage = await CopilotMessage.create({
      sessionId: (session as any).id,
      role: "user",
      content,
    } as any);

    const systemPrompt = `You are Jobie Recruiter Copilot.
You answer only about the selected job and its applicants using the authoritative context below.
Rules:
1) Do not invent candidate names, skills, scores, statuses, dates, emails, or resume facts.
2) If asked to rank, compare, shortlist, or summarize, use the applicant context.
3) If the requested information is missing, say what is missing and suggest the next action.
4) Keep answers practical for a recruiter. Use short bullets when helpful.

Authoritative selected-job context:
${buildJobApplicantContextText(snapshot)}`;

    let reply = "";
    if (!process.env.GROQ_API_KEY) {
      reply = buildFallbackJobReply(content, snapshot);
    } else {
      const groqMessages = [
        { role: "system", content: systemPrompt },
        ...previousMessages.slice(-12).map((message: any) => ({
          role: message.role === "user" ? "user" : "assistant",
          content: String(message.content || ""),
        })),
        { role: "user", content },
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages: groqMessages as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        max_tokens: 800,
      });

      reply = chatCompletion.choices[0]?.message?.content || buildFallbackJobReply(content, snapshot);
    }

    const assistantMessage = await CopilotMessage.create({
      sessionId: (session as any).id,
      role: "assistant",
      content: reply,
    } as any);

    await (session as any).update({
      title: String((session as any).title || "").startsWith("Candidate review") ? content.slice(0, 80) : (session as any).title,
      metadata: {
        ...((session as any).metadata || {}),
        jobTitle: snapshot.job.title,
        applicantCount: snapshot.totalApplicants,
        lastAskedAt: new Date().toISOString(),
      },
    });

    return res.status(201).json({
      userMessage,
      assistantMessage,
      snapshot: {
        applicantCount: snapshot.totalApplicants,
        statusCounts: snapshot.statusCounts,
      },
    });
  } catch (error: any) {
    console.error("Error sending copilot message:", error);
    return res.status(error.status || 500).json({ message: error.message || "Failed to send copilot message" });
  }
};

const buildDisplayName = (user: any) => user?.name || `User ${user?.id}`;
const buildAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f2937&color=ffffff`;

const ensureStreamUser = async (user: any) => {
  try {
    const userId = toStreamUserId(user.id);
    const userName = buildDisplayName(user);
    await streamClient.upsertUsers([
      {
        id: userId,
        name: userName,
        image: buildAvatar(userName),
      } as any,
    ]);
  } catch (error: any) {
    // Log but don't throw - Stream user creation is not critical
    console.warn(`[Stream] Failed to upsert user ${user.id}:`, error.message);
    throw error; // Still throw to let the caller handle it
  }
};

export const getStreamChatAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!isStreamConfigured) {
      return res.status(503).json({ 
        message: "Stream Chat is not configured on server",
        hint: "Set STREAM_API_KEY and STREAM_API_SECRET in .env"
      });
    }

    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findByPk(requester.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Try to ensure Stream user exists
    try {
      await ensureStreamUser(user);
    } catch (streamError: any) {
      console.error("[Stream] User upsert failed:", streamError.message);
      return res.status(503).json({ 
        message: "Stream Chat service unavailable",
        detail: streamError.message,
        hint: "Check your Stream API credentials or try again later"
      });
    }

    const token = generateStreamToken(requester.id);

    return res.status(200).json({
      token,
      apiKey: streamApiKey,
      streamUserId: toStreamUserId(requester.id),
    });
  } catch (error: any) {
    console.error("Error creating Stream chat auth:", error);
    return res.status(500).json({ 
      message: "Failed to initialize live messaging", 
      detail: error.message 
    });
  }
};

export const getMessagingContacts = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    if (requester.role === "recruiter" || requester.role === "admin") {
      const jobs = await Job.findAll({
        where: requester.role === "admin" ? {} : { recruiterId: requester.id },
        attributes: ["id", "title", "company", "recruiterId"],
      });

      if (!jobs.length) return res.status(200).json({ contacts: [] });
      const jobIds = jobs.map((j: any) => j.id);

      const applications = await Application.findAll({
        where: { jobId: { [Op.in]: jobIds } },
        include: [
          { model: User, as: "User", attributes: ["id", "name", "email", "role"] },
          { model: Job, as: "Job", attributes: ["id", "title", "company"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      const seen = new Set<string>();
      const contacts = applications
        .map((a: any) => {
          const candidate = a.User;
          const job = a.Job;
          if (!candidate || !job) return null;
          const key = `${candidate.id}:${job.id}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return {
            candidateId: candidate.id,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            lastStatus: a.status,
          };
        })
        .filter(Boolean);

      return res.status(200).json({ contacts });
    }

    const applications = await Application.findAll({
      where: { userId: requester.id },
      include: [
        {
          model: Job,
          as: "Job",
          attributes: ["id", "title", "company", "recruiterId"],
          include: [{ model: User, as: "recruiter", attributes: ["id", "name", "email", "role"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const seen = new Set<number>();
    const contacts = applications
      .map((a: any) => {
        const job = a.Job;
        const recruiter = job?.recruiter;
        if (!job || !recruiter) return null;
        if (seen.has(job.id)) return null;
        seen.add(job.id);
        return {
          recruiterId: recruiter.id,
          recruiterName: recruiter.name,
          recruiterEmail: recruiter.email,
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          lastStatus: a.status,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error fetching messaging contacts:", error);
    return res.status(500).json({ message: "Failed to fetch contacts", error });
  }
};

export const createOrGetDirectChannel = async (req: AuthRequest, res: Response) => {
  try {
    if (!isStreamConfigured) {
      return res.status(503).json({ message: "Stream Chat is not configured on server" });
    }

    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const { jobId, candidateId } = req.body as { jobId?: number; candidateId?: number };
    if (!jobId) return res.status(400).json({ message: "jobId is required" });

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    let recruiterId = Number((job as any).recruiterId);
    let resolvedCandidateId: number;

    if (requester.role === "candidate") {
      const application = await Application.findOne({
        where: { jobId, userId: requester.id },
      });
      if (!application) {
        return res.status(403).json({ message: "You can only message recruiters for jobs you applied to" });
      }
      resolvedCandidateId = requester.id;
    } else {
      if (!(requester.role === "admin" || recruiterId === requester.id)) {
        return res.status(403).json({ message: "You can only message candidates for your own jobs" });
      }
      if (!candidateId) return res.status(400).json({ message: "candidateId is required for recruiter messaging" });
      resolvedCandidateId = Number(candidateId);
    }

    const [recruiter, candidate] = await Promise.all([
      User.findByPk(recruiterId),
      User.findByPk(resolvedCandidateId),
    ]);
    if (!recruiter || !candidate) return res.status(404).json({ message: "Channel participants not found" });

    await Promise.all([ensureStreamUser(recruiter), ensureStreamUser(candidate)]);

    const memberA = toStreamUserId(recruiterId);
    const memberB = toStreamUserId(resolvedCandidateId);
    const channelId = `job-${jobId}-r${recruiterId}-c${resolvedCandidateId}`;

    const channelName = `${(job as any).title} - ${(job as any).company}`;
    const channel = streamClient.chat.channel("messaging", channelId);

    const createdChannel = await channel.getOrCreate({
      state: true,
      data: {
        created_by_id: toStreamUserId(requester.id),
        members: [{ user_id: memberA }, { user_id: memberB }],
        custom: {
          name: channelName,
          jobId,
          recruiterId,
          candidateId: resolvedCandidateId,
        },
      } as any,
    } as any);

    // Heal legacy/broken channels that may exist without correct membership.
    // `getOrCreate` does not guarantee adding missing members on already-existing channels.
    await channel.update({
      add_members: [{ user_id: memberA }, { user_id: memberB }],
      data: {
        custom: {
          name: channelName,
          jobId,
          recruiterId,
          candidateId: resolvedCandidateId,
        },
      } as any,
    } as any);

    return res.status(200).json({
      channelId,
      cid: createdChannel.channel?.cid,
      name: channelName,
      members: [memberA, memberB],
    });
  } catch (error) {
    console.error("Error creating direct channel:", error);
    return res.status(500).json({ message: "Failed to create direct channel", error });
  }
};
