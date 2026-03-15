import { Request, Response } from 'express';
import { analyseTextWithAts, analyseWithAts } from '../services/atsService';
import Profile from '../models/Profile';
import AtsCheck from '../models/AtsCheck';
import Job from '../models/Job';

export async function evaluate(req: Request, res: Response) {
  try {
    const { jobId, userId } = req.params;
    const requester = (req as any).user;

    // Basic validation
    if (!jobId || !userId) {
      return res.status(400).json({ message: 'Job ID and User ID are required.' });
    }

    // Security check: ensure the requester is the user themselves or a recruiter/admin
    if (requester.id !== Number(userId) && requester.role === 'candidate') {
      return res.status(403).json({ message: 'You can only evaluate your own profile.' });
    }

    const result = await analyseWithAts(Number(jobId), Number(userId));
    const job = await Job.findByPk(Number(jobId));
    const jobDescription = job ? ((job as any).description || '') : '';
    const matchedCount = result.matchedKeywords?.length ?? 0;
    const missingCount = result.missingKeywords?.length ?? 0;
    const totalKeywords = matchedCount + missingCount;
    const coverage = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : result.matchScore;
    const stats = { 
      matchedCount, missingCount, totalKeywords, coverage,
      diagnostics: result.diagnostics,
      telemetryLogs: result.telemetryLogs,
      detailedAnalysis: result.detailedAnalysis
    };

    await AtsCheck.create({
      userId: Number(userId),
      jobId: Number(jobId),
      jobDescription,
      resumeText: null,
      source: "profile",
      matchScore: result.matchScore,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      summary: result.summary,
      stats
    });

    res.status(200).json({ ...result, stats });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'An error occurred during ATS evaluation.' });
  }
}

export async function evaluateText(req: Request, res: Response) {
  try {
    const { jobDescription, resumeText } = req.body;

    if (!jobDescription || !resumeText) {
      return res.status(400).json({ message: 'Job Description and Resume Text are required.' });
    }

    const result = await analyseTextWithAts(jobDescription, resumeText);
    const matchedCount = result.matchedKeywords?.length ?? 0;
    const missingCount = result.missingKeywords?.length ?? 0;
    const totalKeywords = matchedCount + missingCount;
    const coverage = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : result.matchScore;
    const stats = { 
      matchedCount, missingCount, totalKeywords, coverage,
      diagnostics: result.diagnostics,
      telemetryLogs: result.telemetryLogs,
      detailedAnalysis: result.detailedAnalysis
    };

    res.status(200).json({ ...result, stats });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'An error occurred during ATS evaluation.' });
  }
}

export async function evaluateTextForUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { jobDescription, resumeText } = req.body;
    const requester = (req as any).user;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job Description is required.' });
    }

    if (requester.id !== Number(userId) && requester.role === 'candidate') {
      return res.status(403).json({ message: 'You can only evaluate your own profile.' });
    }

    let candidateText = resumeText;
    let source: "profile" | "resume" = "resume";

    if (!candidateText) {
      const profile = await Profile.findOne({ where: { userId: Number(userId) } });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found.' });
      }

      const skills = Array.isArray((profile as any).skills) ? (profile as any).skills : [];
      const experience = Array.isArray((profile as any).experience) ? (profile as any).experience : [];
      const education = Array.isArray((profile as any).education) ? (profile as any).education : [];
      const projects = Array.isArray((profile as any).projects) ? (profile as any).projects : [];

      candidateText = `
        Skills: ${skills.join(', ')}
        Experience: ${experience.map((e: any) => `${e.title || ''} at ${e.company || ''}`).join('; ')}
        Education: ${education.map((e: any) => `${e.degree || ''} ${e.school || ''}`).join('; ')}
        Projects: ${projects.map((p: any) => `${p.title || ''}`).join('; ')}
        Bio: ${(profile as any).bio || ''}
      `;
      source = "profile";
    }

    const result = await analyseTextWithAts(jobDescription, candidateText);
    const matchedCount = result.matchedKeywords?.length ?? 0;
    const missingCount = result.missingKeywords?.length ?? 0;
    const totalKeywords = matchedCount + missingCount;
    const coverage = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : result.matchScore;
    const stats = { 
      matchedCount, missingCount, totalKeywords, coverage,
      diagnostics: result.diagnostics,
      telemetryLogs: result.telemetryLogs,
      detailedAnalysis: result.detailedAnalysis
    };

    const saved = await AtsCheck.create({
      userId: Number(userId),
      jobId: null,
      jobDescription,
      resumeText: source === "resume" ? candidateText : null,
      source,
      matchScore: result.matchScore,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      summary: result.summary,
      stats
    });

    res.status(200).json({
      ...result,
      stats,
      historyItem: {
        id: (saved as any).id,
        createdAt: (saved as any).createdAt,
        matchScore: result.matchScore,
        summary: result.summary,
        stats,
        source,
        jobDescriptionSnippet: jobDescription.slice(0, 220)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'An error occurred during ATS evaluation.' });
  }
}

export async function getAtsHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const requester = (req as any).user;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    if (requester.id !== Number(userId) && requester.role === 'candidate') {
      return res.status(403).json({ message: 'You can only view your own history.' });
    }

    const checks = await (AtsCheck as any).findAll({
      where: { userId: Number(userId) },
      order: [['createdAt', 'DESC']],
      limit
    });

    const history = checks.map((c: any) => ({
      id: c.id,
      createdAt: c.createdAt,
      matchScore: c.matchScore,
      summary: c.summary,
      stats: c.stats,
      source: c.source,
      jobDescriptionSnippet: (c.jobDescription || '').slice(0, 220)
    }));

    res.status(200).json({ history });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to load ATS history.' });
  }
}

