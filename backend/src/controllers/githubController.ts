import { Request, Response } from "express";
import { analyseGitHubProfile } from "../services/githubService";
import Profile from "../models/Profile";

// ─── GET /api/github/analyse/:username ────────────────────────────────────────
// Standalone: analyse any GitHub user (no login required for public data)
export const analyseUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.username as string;
    if (!username) return res.status(400).json({ message: "GitHub username is required" });

    const analysis = await analyseGitHubProfile(username);
    res.status(200).json(analysis);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: `GitHub user "${req.params.username}" not found` });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({ message: "GitHub API rate limit exceeded. Try again later." });
    }
    res.status(500).json({ message: "Error analysing GitHub profile", error: error.message });
  }
};

// ─── POST /api/github/verify/:userId ─────────────────────────────────────────
// Analyse the GitHub user linked to a profile, then save verified skills back.
// Needs auth (handled at route level).
export const verifyAndSave = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const githubUsername = (profile as any).githubUsername;
    if (!githubUsername) {
      return res.status(400).json({ message: "No GitHub username set on this profile. Update profile first." });
    }

    const analysis = await analyseGitHubProfile(githubUsername);

    // Merge verified skill names into profile
    const verifiedSkillNames = analysis.verifiedSkills.map((s) => s.skill);

    // Also merge into main skills (union, no duplicates)
    const currentSkills: string[] = (profile as any).skills || [];
    const normalize = (s: string) => s.toLowerCase().trim();
    const currentNorm = currentSkills.map(normalize);
    const newSkills = [
      ...currentSkills,
      ...verifiedSkillNames.filter((s) => !currentNorm.includes(normalize(s)))
    ];

    // Recompute completeness
    const updated = { ...(profile as any).dataValues, skills: newSkills, githubVerifiedSkills: analysis.verifiedSkills };
    let completeness = 0;
    if (updated.bio) completeness += 10;
    if (updated.skills?.length > 0) completeness += 20;
    if (updated.experience?.length > 0) completeness += 20;
    if (updated.education?.length > 0) completeness += 15;
    if (updated.projects?.length > 0) completeness += 20;
    if (updated.githubUsername) completeness += 10;
    if (updated.githubVerifiedSkills?.length > 0) completeness += 5;

    await profile.update({
      githubVerifiedSkills: analysis.verifiedSkills,
      skills: newSkills,
      profileCompleteness: completeness
    });

    res.status(200).json({
      message: "GitHub skills verified and saved",
      username: githubUsername,
      verifiedSkills: analysis.verifiedSkills,
      updatedSkills: newSkills,
      profileCompleteness: completeness,
      topLanguages: analysis.topLanguages,
      activityScore: analysis.activityScore,
      totalStars: analysis.totalStars,
      publicRepos: analysis.publicRepos,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "GitHub user not found" });
    }
    if (error.response?.status === 403) {
      return res.status(429).json({ message: "GitHub API rate limit exceeded. Try again later." });
    }
    res.status(500).json({ message: "Error verifying GitHub skills", error: error.message });
  }
};

// ─── GET /api/github/compare/:userId/:jobId ──────────────────────────────────
// Compare GitHub-verified skills against a job's requirements
export const compareWithJob = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const jobId = Number(req.params.jobId);

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const Job = (await import("../models/Job")).default;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const verifiedSkills: any[] = (profile as any).githubVerifiedSkills || [];
    const requiredSkills: string[] = (job as any).requiredSkills || [];
    const techStack: string[] = (job as any).techStack || [];

    const normalize = (s: string) => s.toLowerCase().trim();
    const verifiedNorm = verifiedSkills.map((v: any) => normalize(typeof v === "string" ? v : v.skill));

    const verifiedMatch = requiredSkills.filter((s) => verifiedNorm.includes(normalize(s)));
    const verifiedMissing = requiredSkills.filter((s) => !verifiedNorm.includes(normalize(s)));
    const techMatch = techStack.filter((s) => verifiedNorm.includes(normalize(s)));
    const techMissing = techStack.filter((s) => !verifiedNorm.includes(normalize(s)));

    const credibilityScore = requiredSkills.length > 0
      ? Math.round((verifiedMatch.length / requiredSkills.length) * 100)
      : 100;

    res.status(200).json({
      userId,
      jobId,
      jobTitle: (job as any).title,
      credibilityScore,
      verifiedMatch,
      verifiedMissing,
      techMatch,
      techMissing,
      totalVerifiedSkills: verifiedSkills.length,
      message: credibilityScore >= 80
        ? "Strong GitHub-verified match!"
        : credibilityScore >= 50
          ? "Moderate match — some skills need proof."
          : "Low verified match — consider building projects for missing skills."
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error comparing skills", error: error.message });
  }
};
