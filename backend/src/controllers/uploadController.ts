import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Profile from "../models/Profile";

const uploadRoot = path.resolve(__dirname, "../../uploads");
const avatarDir = path.join(uploadRoot, "avatars");
const resumeDir = path.join(uploadRoot, "resumes");

fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(resumeDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: avatarDir,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const resumeStorage = multer.diskStorage({
  destination: resumeDir,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  }
});

const computeCompleteness = (data: any): number => {
  let score = 0;
  if (data.bio) score += 10;
  if (data.headline) score += 5;
  if (data.location) score += 5;
  if (data.phone) score += 5;
  if (data.website) score += 5;
  if (data.linkedin) score += 5;
  if (data.avatarUrl) score += 5;
  if (data.resumeUrl) score += 5;
  if (data.skills?.length > 0) score += 20;
  if (data.experience?.length > 0) score += 20;
  if (data.education?.length > 0) score += 15;
  if (data.projects?.length > 0) score += 20;
  if (data.githubUsername) score += 10;
  if (data.githubVerifiedSkills?.length > 0) score += 5;
  return score;
};

const canEdit = (req: Request, userId: number) => {
  const requester = (req as any).user;
  if (!requester) return false;
  return requester.id === userId || requester.role === "admin";
};

export const uploadAvatarMiddleware = avatarUpload.single("avatar");
export const uploadResumeMiddleware = resumeUpload.single("resume");

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (!canEdit(req, userId)) return res.status(403).json({ message: "Forbidden" });
    if (!req.file) return res.status(400).json({ message: "No avatar uploaded" });

    const url = `/uploads/avatars/${req.file.filename}`;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      const completeness = computeCompleteness({ avatarUrl: url });
      const created = await Profile.create({ userId, avatarUrl: url, profileCompleteness: completeness });
      return res.status(200).json({ url, profile: created });
    }

    const updated = { ...(profile as any).dataValues, avatarUrl: url };
    const completeness = computeCompleteness(updated);
    await profile.update({ avatarUrl: url, profileCompleteness: completeness });
    return res.status(200).json({ url, profile });
  } catch (error: any) {
    res.status(500).json({ message: "Error uploading avatar", error: error.message });
  }
};

export const uploadResume = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (!canEdit(req, userId)) return res.status(403).json({ message: "Forbidden" });
    if (!req.file) return res.status(400).json({ message: "No resume uploaded" });

    const url = `/uploads/resumes/${req.file.filename}`;
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      const completeness = computeCompleteness({ resumeUrl: url });
      const created = await Profile.create({ userId, resumeUrl: url, profileCompleteness: completeness });
      return res.status(200).json({ url, profile: created });
    }

    const updated = { ...(profile as any).dataValues, resumeUrl: url };
    const completeness = computeCompleteness(updated);
    await profile.update({ resumeUrl: url, profileCompleteness: completeness });
    return res.status(200).json({ url, profile });
  } catch (error: any) {
    res.status(500).json({ message: "Error uploading resume", error: error.message });
  }
};
