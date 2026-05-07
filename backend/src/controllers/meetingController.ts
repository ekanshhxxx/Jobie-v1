import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Meeting from "../models/Meeting";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import { generateStreamToken, isStreamConfigured, streamApiKey } from "../services/streamService";

const MEETING_URL_MARKER = "[MEETING_URL]";

const isGoogleMeetUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.toLowerCase() === "meet.google.com";
  } catch {
    return false;
  }
};

const normalizeGoogleMeetUrl = (value: string): string => {
  const url = new URL(value);
  return `https://meet.google.com${url.pathname}${url.search}`;
};

const extractMeetingUrlFromDescription = (description: unknown): string | null => {
  const text = String(description || "");
  const line = text
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith(MEETING_URL_MARKER));

  if (!line) return null;
  const url = line.slice(MEETING_URL_MARKER.length).trim();
  return url || null;
};

const stripMeetingUrlFromDescription = (description: unknown): string => {
  const text = String(description || "");
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith(MEETING_URL_MARKER))
    .join("\n")
    .trim();
};

const serializeDescriptionWithMeetingUrl = (description: unknown, meetingUrl: string): string => {
  const base = String(description || "").trim();
  const parts = [base, `${MEETING_URL_MARKER} ${meetingUrl}`].filter(Boolean);
  return parts.join("\n\n");
};

const mapMeetingForResponse = (meeting: any) => {
  const plain = typeof meeting.get === "function" ? meeting.get({ plain: true }) : meeting;
  return {
    ...plain,
    description: stripMeetingUrlFromDescription(plain.description),
    meetingUrl: extractMeetingUrlFromDescription(plain.description),
  };
};

const shouldAutoCompleteMeeting = (meeting: any): boolean => {
  const status = String(meeting?.status || "");
  if (!["scheduled", "in_progress"].includes(status)) return false;
  const scheduledAt = new Date(meeting?.scheduledAt || 0).getTime();
  if (!Number.isFinite(scheduledAt) || Number.isNaN(scheduledAt)) return false;
  const duration = Number(meeting?.duration || 30);
  const endAt = scheduledAt + Math.max(1, duration) * 60 * 1000;
  return Date.now() >= endAt;
};

const reconcileCompletedMeetings = async (meetings: any[]) => {
  for (const meeting of meetings) {
    const plain = typeof meeting.get === "function" ? meeting.get({ plain: true }) : meeting;
    if (!shouldAutoCompleteMeeting(plain)) continue;

    await (meeting as any).update({ status: "completed" });

    await (Application as any).update(
      { status: "interview_done" },
      {
        where: {
          jobId: plain.jobId,
          userId: plain.candidateId,
          status: "interview_scheduled",
        },
      }
    );
  }
};

export const scheduleMeeting = async (req: Request, res: Response) => {
  try {
    const { jobId, candidateId, title, description, scheduledAt, duration, meetingUrl } = req.body;
    const requester = (req as any).user;
    const recruiterId = requester.id;
    const parsedJobId = Number(jobId);
    const parsedCandidateId = Number(candidateId);
    const parsedDuration = Number(duration || 30);
    const parsedScheduledAt = new Date(scheduledAt);

    if (!jobId || !candidateId || !title || !scheduledAt) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const incomingMeetingUrl = String(meetingUrl || "").trim();
    if (!incomingMeetingUrl) {
      return res.status(400).json({ message: "Google Meet link is required" });
    }
    if (!isGoogleMeetUrl(incomingMeetingUrl)) {
      return res.status(400).json({ message: "Please provide a valid Google Meet URL (https://meet.google.com/...)" });
    }
    const normalizedMeetingUrl = normalizeGoogleMeetUrl(incomingMeetingUrl);

    if (!Number.isFinite(parsedJobId) || !Number.isFinite(parsedCandidateId)) {
      return res.status(400).json({ message: "Invalid jobId or candidateId" });
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > 180) {
      return res.status(400).json({ message: "Duration must be between 1 and 180 minutes" });
    }

    if (Number.isNaN(parsedScheduledAt.getTime())) {
      return res.status(400).json({ message: "Invalid scheduledAt value" });
    }

    if (parsedScheduledAt.getTime() < Date.now() - 60 * 1000) {
      return res.status(400).json({ message: "Meeting time must be in the future" });
    }

    const job = await Job.findByPk(parsedJobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isAdmin = requester.role === "admin";
    const jobRecruiterId = Number((job as any).recruiterId);
    if (!Number.isFinite(jobRecruiterId) || jobRecruiterId <= 0) {
      return res.status(400).json({ message: "Job has no assigned recruiter" });
    }
    if (!isAdmin && jobRecruiterId !== recruiterId) {
      return res.status(403).json({ message: "You can only schedule meetings for your own jobs" });
    }
    const meetingRecruiterId = isAdmin ? jobRecruiterId : recruiterId;

    const candidate = await User.findByPk(parsedCandidateId);
    if (!candidate || (candidate as any).role !== "candidate") {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const application = await Application.findOne({
      where: { jobId: parsedJobId, userId: parsedCandidateId },
    });

    if (!application) {
      return res.status(400).json({ message: "Candidate has not applied for this job" });
    }

    const streamCallId = uuidv4();
    const persistedDescription = serializeDescriptionWithMeetingUrl(description, normalizedMeetingUrl);

    const meeting = await Meeting.create({
      jobId: parsedJobId,
      recruiterId: meetingRecruiterId,
      candidateId: parsedCandidateId,
      title,
      description: persistedDescription,
      scheduledAt: parsedScheduledAt,
      duration: parsedDuration,
      streamCallId,
    });

    await (application as any).update({ status: "interview_scheduled" });

    res.status(201).json({ message: "Meeting scheduled successfully", meeting: mapMeetingForResponse(meeting) });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({ message: "Error scheduling meeting", error });
  }
};

export const getRecruiterMeetings = async (req: Request, res: Response) => {
  try {
    const recruiterId = (req as any).user.id;

    const meetings = await Meeting.findAll({
      where: { recruiterId },
      include: [
        { model: User, as: "candidate", attributes: ["id", "name", "email", "role"] },
        { model: Job, as: "job", attributes: ["id", "title", "company"] }
      ],
      order: [["scheduledAt", "ASC"]]
    });

    await reconcileCompletedMeetings(meetings as any[]);

    res.status(200).json(meetings.map((meeting) => mapMeetingForResponse(meeting)));
  } catch (error) {
    console.error("Error fetching recruiter meetings:", error);
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

export const getCandidateMeetings = async (req: Request, res: Response) => {
  try {
    const candidateId = (req as any).user.id;

    const meetings = await Meeting.findAll({
      where: { candidateId },
      include: [
        { model: User, as: "recruiter", attributes: ["id", "name", "email", "role"] },
        { model: Job, as: "job", attributes: ["id", "title", "company"] }
      ],
      order: [["scheduledAt", "ASC"]]
    });

    await reconcileCompletedMeetings(meetings as any[]);

    res.status(200).json(meetings.map((meeting) => mapMeetingForResponse(meeting)));
  } catch (error) {
    console.error("Error fetching candidate meetings:", error);
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

export const getMeetingJoinUrl = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const streamCallId = String(req.params.streamCallId || "").trim();
    if (!streamCallId) {
      return res.status(400).json({ message: "Missing meeting id" });
    }

    const meeting = await Meeting.findOne({ where: { streamCallId } });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const plain = typeof (meeting as any).get === "function" ? (meeting as any).get({ plain: true }) : (meeting as any);
    const recruiterId = Number(plain.recruiterId);
    const candidateId = Number(plain.candidateId);
    const requesterId = Number(requester.id);
    if (requesterId !== recruiterId && requesterId !== candidateId && requester.role !== "admin") {
      return res.status(403).json({ message: "You do not have access to this meeting" });
    }

    const meetingUrl = extractMeetingUrlFromDescription(plain.description);
    if (!meetingUrl) {
      return res.status(404).json({ message: "Google Meet URL not set for this interview" });
    }

    return res.status(200).json({ meetingUrl });
  } catch (error) {
    console.error("Error fetching meeting join URL:", error);
    return res.status(500).json({ message: "Error fetching meeting URL", error });
  }
};

export const getStreamToken = async (req: Request, res: Response) => {
  try {
    if (!isStreamConfigured) {
      return res.status(503).json({ message: "Stream is not configured on server" });
    }
    const userId = (req as any).user.id;
    const token = generateStreamToken(userId);
    res.status(200).json({ token, apiKey: streamApiKey });
  } catch (error) {
    console.error("Error generating stream token:", error);
    res.status(500).json({ message: "Error generating token", error });
  }
};
