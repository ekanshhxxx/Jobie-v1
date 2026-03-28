import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { Op } from "sequelize";
import User from "../models/User";
import Job from "../models/Job";
import Application from "../models/Application";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  generateStreamToken,
  isStreamConfigured,
  streamApiKey,
  streamClient,
  toStreamUserId,
} from "../services/streamService";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getChatResponse = async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Build the system prompt
    let systemPrompt = `You are Jobie AI, a friendly, straightforward, and concise assistant for the Jobie platform. You help users navigate the platform, understand features (like the AI Resume Scanner, ATS Match Scores, Pipeline Kanban, etc.), and answer general questions about hiring and careers. Keep your responses short, conversational, and completely human-like. Do not be overly verbose.`;

    if (userContext) {
      if (userContext.role === 'recruiter') {
        systemPrompt += `\n\nThe user you are talking to is a RECRUITER named ${userContext.name || 'someone'} from ${userContext.companyName || 'their company'}. Help them with sourcing candidates, parsing resumes, and managing their hiring pipeline.`;
      } else if (userContext.role === 'candidate') {
        systemPrompt += `\n\nThe user you are talking to is a CANDIDATE named ${userContext.name || 'someone'}. Help them with finding jobs, improving their resume, and understanding their match scores.`;
      }
    }

    // Format messages for Groq
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages as any,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I'm having trouble thinking right now. Please try again later!";

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Failed to fetch response." });
  }
};

const buildDisplayName = (user: any) => user?.name || `User ${user?.id}`;
const buildAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f2937&color=ffffff`;

const ensureStreamUser = async (user: any) => {
  const userId = toStreamUserId(user.id);
  const userName = buildDisplayName(user);
  await streamClient.upsertUsers([
    {
      id: userId,
      name: userName,
      role: user.role,
      image: buildAvatar(userName),
    } as any,
  ]);
};

export const getStreamChatAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!isStreamConfigured) {
      return res.status(503).json({ message: "Stream Chat is not configured on server" });
    }

    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findByPk(requester.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await ensureStreamUser(user);
    const token = generateStreamToken(requester.id);

    return res.status(200).json({
      token,
      apiKey: streamApiKey,
      streamUserId: toStreamUserId(requester.id),
    });
  } catch (error) {
    console.error("Error creating Stream chat auth:", error);
    return res.status(500).json({ message: "Failed to initialize live messaging", error });
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

    const channel = await streamClient.chat.updateChannel({
      type: "messaging",
      id: channelId,
      add_members: [memberA, memberB],
      data: {
        name: `${(job as any).title} - ${(job as any).company}`,
        jobId,
        recruiterId,
        candidateId: resolvedCandidateId,
      } as any,
      message: {
        text: `Live thread opened for ${(job as any).title}.`,
        user_id: memberA,
      } as any,
    } as any);

    return res.status(200).json({
      channelId,
      cid: channel.channel?.cid,
      name: `${(job as any).title} - ${(job as any).company}`,
      members: [memberA, memberB],
    });
  } catch (error) {
    console.error("Error creating direct channel:", error);
    return res.status(500).json({ message: "Failed to create direct channel", error });
  }
};
