import { Request, Response } from "express";
import Profile from "../models/Profile";

const computeCompleteness = (data: any): number => {
  let score = 0;
  if (data.bio) score += 10;
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
    const userId = Number(req.params.userId);
    const profile = await Profile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const existing = await Profile.findOne({ where: { userId } });

    if (existing) {
      return res.status(409).json({ message: "Profile already exists. Use PUT to update." });
    }

    const { bio, skills, experience, education, projects, githubUsername } = req.body;
    const profileData = { userId, bio, skills, experience, education, projects, githubUsername };
    const profileCompleteness = computeCompleteness(profileData);

    const profile = await Profile.create({ ...profileData, profileCompleteness });
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error creating profile", error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const profile = await Profile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const updated = { ...(profile as any).dataValues, ...req.body };
    const profileCompleteness = computeCompleteness(updated);

    await profile.update({ ...req.body, profileCompleteness });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};
