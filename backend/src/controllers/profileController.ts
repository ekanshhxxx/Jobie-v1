import { Request, Response } from "express";
import Profile from "../models/Profile";
import User from "../models/User";
import { getProfileWithFallback, getUserWithFallback, saveProfileDual } from "../services/dbFallbackService";

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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const userId = Number(req.params.userId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { data: profile } = await getProfileWithFallback(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};

export const getProfileView = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const userId = Number(req.params.userId);

    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: user } = await getUserWithFallback(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { data: profile } = await getProfileWithFallback(userId);

    res.status(200).json({
      user: {
        id: (user as any).id || (user as any).sqlId,
        name: (user as any).name,
        email: (user as any).email,
        role: (user as any).role
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { data: existing } = await getProfileWithFallback(userId);

    if (existing) {
      return res.status(409).json({ message: "Profile already exists. Use PUT to update." });
    }

    const { bio, headline, location, phone, website, linkedin, birthday, gender, avatarUrl, resumeUrl, skills, experience, education, projects, githubUsername } = req.body;
    const profileData = { bio, headline, location, phone, website, linkedin, birthday, gender, avatarUrl, resumeUrl, skills, experience, education, projects, githubUsername };
    
    const { mysqlResult, mongoResult } = await saveProfileDual(userId, profileData);
    const finalProfile = mysqlResult || mongoResult;

    res.status(201).json(finalProfile);
  } catch (error) {
    res.status(500).json({ message: "Error creating profile", error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { data: profile } = await getProfileWithFallback(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const normalizeUsername = (v: unknown) =>
      typeof v === "string" ? v.trim().replace(/^@+/, "") : "";
    const previousUsername = normalizeUsername((profile as any).githubUsername);
    const incomingUsername = normalizeUsername((req.body as any)?.githubUsername);

    const payload = { ...req.body } as any;
    if (incomingUsername) payload.githubUsername = incomingUsername;

    // Username changed: drop old scan data and old GitHub-derived skills so stale
    // identity/skills are not displayed.
    if (incomingUsername && incomingUsername !== previousUsername) {
      const currentSkills: string[] = Array.isArray((profile as any).skills) ? (profile as any).skills : [];
      const previousVerified: string[] = ((profile as any).githubVerifiedSkills || [])
        .map((s: any) => (typeof s === "string" ? s : s?.skill))
        .filter((s: any): s is string => typeof s === "string");
      const normalize = (s: string) => s.toLowerCase().trim();
      const previousVerifiedNorm = previousVerified.map(normalize);

      payload.githubVerifiedSkills = [];
      payload.githubDeepScan = null;
      if (!Array.isArray(payload.skills)) {
        payload.skills = currentSkills.filter((s) => !previousVerifiedNorm.includes(normalize(s)));
      }
    }

    const { mysqlResult, mongoResult } = await saveProfileDual(userId, payload);
    const finalProfile = mysqlResult || mongoResult;

    res.status(200).json(finalProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};
