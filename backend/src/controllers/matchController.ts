import { Request, Response } from "express";
import Profile from "../models/Profile";
import Job from "../models/Job";
import { calculateMatchScore } from "../services/matchService";
import roadmaps from "../data/roadmaps";

export const getMatchScore = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const jobId = Number(req.params.jobId);

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const candidateSkills: string[] = (profile as any).skills || [];
    const requiredSkills: string[] = (job as any).requiredSkills || [];
    const techStack: string[] = (job as any).techStack || [];
    const projects: any[] = (profile as any).projects || [];
    const experience: any[] = (profile as any).experience || [];

    const matchResult = calculateMatchScore(candidateSkills, requiredSkills, techStack);

    // Hiring prediction score
    const projectScore = Math.min(projects.length / 5, 1) * 100;
    const experienceScore = Math.min(experience.length / 3, 1) * 100;
    const skillDemand = matchResult.score;

    const hiringProbability = Math.round(
      0.4 * matchResult.score +
      0.2 * projectScore +
      0.2 * experienceScore +
      0.2 * skillDemand
    );

    res.status(200).json({
      userId,
      jobId,
      matchScore: matchResult.score,
      matchedSkills: matchResult.matched,
      missingSkills: matchResult.missing,
      matchedTech: matchResult.techMatched,
      missingTech: matchResult.techMissing,
      hiringProbability
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating match score", error });
  }
};

export const getSkillGap = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const jobId = Number(req.params.jobId);

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const candidateSkills: string[] = (profile as any).skills || [];
    const requiredSkills: string[] = (job as any).requiredSkills || [];
    const techStack: string[] = (job as any).techStack || [];

    const matchResult = calculateMatchScore(candidateSkills, requiredSkills, techStack);

    res.status(200).json({
      userId,
      jobId,
      jobTitle: (job as any).title,
      yourSkills: candidateSkills,
      missingSkills: matchResult.missing,
      missingTech: matchResult.techMissing,
      matchScore: matchResult.score,
      message: matchResult.missing.length === 0
        ? "You meet all requirements for this job!"
        : `You are missing ${matchResult.missing.length + matchResult.techMissing.length} skills for this job.`
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating skill gap", error });
  }
};

export const getCareerRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const targetRole = (Array.isArray(req.params.targetRole) ? req.params.targetRole[0] : req.params.targetRole).toLowerCase();

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const roadmap = roadmaps[targetRole];
    if (!roadmap) {
      return res.status(400).json({
        message: "Role not found",
        availableRoles: Object.keys(roadmaps)
      });
    }

    const candidateSkills: string[] = (profile as any).skills || [];
    const normalize = (s: string) => s.toLowerCase().trim();
    const candNorm = candidateSkills.map(normalize);

    const acquiredSkills = roadmap.requiredSkills.filter((s) => candNorm.includes(normalize(s)));
    const missingSkills = roadmap.requiredSkills.filter((s) => !candNorm.includes(normalize(s)));
    const readiness = Math.round((acquiredSkills.length / roadmap.requiredSkills.length) * 100);

    res.status(200).json({
      userId,
      targetRole: roadmap.role,
      readiness: `${readiness}%`,
      acquiredSkills,
      missingSkills,
      learningPath: roadmap.learningPath,
      recommendedProjects: roadmap.recommendedProjects
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating roadmap", error });
  }
};
