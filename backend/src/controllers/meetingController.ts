import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Meeting from "../models/Meeting";
import User from "../models/User";
import Job from "../models/Job";
import { generateStreamToken, isStreamConfigured, streamApiKey } from "../services/streamService";

export const scheduleMeeting = async (req: Request, res: Response) => {
  try {
    const { jobId, candidateId, title, description, scheduledAt, duration } = req.body;
    const recruiterId = (req as any).user.id;

    if (!jobId || !candidateId || !title || !scheduledAt) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const streamCallId = uuidv4();

    const meeting = await Meeting.create({
      jobId,
      recruiterId,
      candidateId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      streamCallId,
    });

    res.status(201).json({ message: "Meeting scheduled successfully", meeting });
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

    res.status(200).json(meetings);
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

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching candidate meetings:", error);
    res.status(500).json({ message: "Error fetching meetings", error });
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
