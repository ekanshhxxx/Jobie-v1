import { Request, Response } from "express";
import { analyseGitHubProfile, deepScanGitHubProfile, resolveGitHubIdentity } from "../services/githubService";
import { getProfileWithFallback, getUserWithFallback, saveProfileDual } from "../services/dbFallbackService";
import { AuthRequest } from "../middleware/authMiddleware";

// ─── GET /api/github/analyse/:username ────────────────────────────────────────
// Public: quick analysis (no AI narrative, no deep bio) — no auth required
export const analyseUser = async (req: Request, res: Response) => {
  try {
    const username = req.params.username as string;
    if (!username) return res.status(400).json({ message: "GitHub username is required" });

    const analysis = await analyseGitHubProfile(username);
    res.status(200).json(analysis);
  } catch (error: any) {
    if (error.response?.status === 404)
      return res.status(404).json({ message: `GitHub user "${req.params.username}" not found` });
    if (error.response?.status === 403)
      return res.status(429).json({ message: "GitHub API rate limit exceeded. Try again later." });
    res.status(500).json({ message: "Error analysing GitHub profile", error: error.message });
  }
};

// ─── POST /api/github/verify/:userId ─────────────────────────────────────────
// Protected: deep scan the linked GitHub, save all data + AI narrative to profile
export const verifyAndSave = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const userId = Number(req.params.userId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "You can only verify your own GitHub profile." });
    }

    const { data: user } = await getUserWithFallback(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { data: profile } = await getProfileWithFallback(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const normalizeUsername = (v: unknown) =>
      typeof v === "string" ? v.trim().replace(/^@+/, "") : "";

    const requestedUsername = normalizeUsername((req.body as any)?.githubUsername);
    const storedUsername = normalizeUsername((profile as any).githubUsername);
    const githubUsername = requestedUsername || storedUsername;

    // If the client explicitly requested a new username, persist it first and
    // clear stale scan artifacts before generating a new scan.
    if (requestedUsername && requestedUsername !== storedUsername) {
      await saveProfileDual(userId, {
        githubUsername: requestedUsername,
        githubVerifiedSkills: [],
        githubDeepScan: null,
      });
    }

    if (!githubUsername) {
      return res.status(400).json({ message: "No GitHub username set on this profile. Update profile first." });
    }

    const linkedGithubUid = typeof (user as any).githubUid === "string"
      ? String((user as any).githubUid)
      : "";
    if (!linkedGithubUid) {
      return res.status(403).json({
        message: "For security, connect this account with GitHub login first before running Deep Scan.",
        code: "GITHUB_ACCOUNT_NOT_LINKED",
      });
    }

    const identity = await resolveGitHubIdentity(githubUsername);
    if (identity.id !== linkedGithubUid) {
      return res.status(403).json({
        message: "This username does not match your connected GitHub account.",
        code: "GITHUB_USERNAME_MISMATCH",
        expectedGithubUid: linkedGithubUid,
        scannedGithubUid: identity.id,
        scannedUsername: identity.login,
      });
    }

    // Full deep scan (skills + bio + pinned repos + lang breakdown + commits + AI narrative)
    const scan = await deepScanGitHubProfile(githubUsername);

    // Replace only previously GitHub-derived skills, keep manual profile skills intact.
    const verifiedSkillNames = scan.verifiedSkills.map(s => s.skill);
    const currentSkills: string[] = (profile as any).skills || [];
    const previousVerified: string[] = ((profile as any).githubVerifiedSkills || [])
      .map((s: any) => (typeof s === "string" ? s : s?.skill))
      .filter((s: any): s is string => typeof s === "string");
    const normalize = (s: string) => s.toLowerCase().trim();
    const previousVerifiedNorm = previousVerified.map(normalize);
    const manualSkills = currentSkills.filter((s) => !previousVerifiedNorm.includes(normalize(s)));
    const manualNorm = manualSkills.map(normalize);
    const newSkills = [
      ...manualSkills,
      ...verifiedSkillNames.filter(s => !manualNorm.includes(normalize(s))),
    ];

    const updateData = {
      githubUsername,
      githubVerifiedSkills: scan.verifiedSkills,
      githubDeepScan: scan,
      skills: newSkills,
    };

    const { mysqlResult, mongoResult } = await saveProfileDual(userId, updateData);
    const finalProfile = mysqlResult || mongoResult;

    res.status(200).json({
      message: "GitHub deep scan complete and saved",
      username: githubUsername,
      verifiedSkills: scan.verifiedSkills,
      updatedSkills: newSkills,
      profileCompleteness: (finalProfile as any).profileCompleteness,
      topLanguages: scan.topLanguages,
      activityScore: scan.activityScore,
      totalStars: scan.totalStars,
      publicRepos: scan.publicRepos,
      recentCommits: scan.recentCommits,
      pinnedReposCount: scan.pinnedRepos.length,
      aiNarrative: scan.aiNarrative,
    });
  } catch (error: any) {
    if (error.response?.status === 404)
      return res.status(404).json({ message: "GitHub user not found" });
    if (error.response?.status === 403)
      return res.status(429).json({ message: "GitHub API rate limit exceeded. Try again later." });
    res.status(500).json({ message: "Error during GitHub deep scan", error: error.message });
  }
};

// ─── GET /api/github/deep/:userId ─────────────────────────────────────────────
// Protected: return the stored githubDeepScan from DB (no live API call)
export const getDeepScan = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const userId = Number(req.params.userId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { data: profile } = await getProfileWithFallback(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const scan = (profile as any).githubDeepScan;
    if (!scan) {
      return res.status(404).json({ message: "No GitHub scan found. Click 'Scan GitHub' first." });
    }
    res.status(200).json({ userId, githubDeepScan: scan });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching GitHub scan", error: error.message });
  }
};

// ─── GET /api/github/compare/:userId/:jobId ──────────────────────────────────
// Protected: compare GitHub-verified skills against a job's requirements
export const compareWithJob = async (req: Request, res: Response) => {
  try {
    const requester = (req as AuthRequest).user;
    const userId = Number(req.params.userId);
    const jobId = Number(req.params.jobId);
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { data: profile } = await getProfileWithFallback(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const Job = (await import("../models/Job")).default;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const verifiedSkills: any[] = (profile as any).githubVerifiedSkills || [];
    const requiredSkills: string[] = (job as any).requiredSkills || [];
    const techStack: string[] = (job as any).techStack || [];

    const normalize = (s: string) => s.toLowerCase().trim();
    const verifiedNorm = verifiedSkills.map((v: any) => normalize(typeof v === "string" ? v : v.skill));

    const verifiedMatch = requiredSkills.filter(s => verifiedNorm.includes(normalize(s)));
    const verifiedMissing = requiredSkills.filter(s => !verifiedNorm.includes(normalize(s)));
    const techMatch = techStack.filter(s => verifiedNorm.includes(normalize(s)));
    const techMissing = techStack.filter(s => !verifiedNorm.includes(normalize(s)));

    const credibilityScore = requiredSkills.length > 0
      ? Math.round((verifiedMatch.length / requiredSkills.length) * 100)
      : 100;

    res.status(200).json({
      userId, jobId, jobTitle: (job as any).title,
      credibilityScore, verifiedMatch, verifiedMissing, techMatch, techMissing,
      totalVerifiedSkills: verifiedSkills.length,
      message: credibilityScore >= 80
        ? "Strong GitHub-verified match!"
        : credibilityScore >= 50
          ? "Moderate match — some skills need proof."
          : "Low verified match — consider building projects for missing skills.",
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error comparing skills", error: error.message });
  }
};
