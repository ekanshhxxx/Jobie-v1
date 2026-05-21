import { Request, Response } from 'express';
import { generateRoadmap } from '../services/roadmapService';
import AtsRoadmap from '../models/AtsRoadmap';

// POST /api/roadmap/generate
export const generateRoadmapHandler = async (req: Request, res: Response) => {
  try {
    const { jobDescription, missingSkills, matchScore, userId } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'jobDescription is required.' });
    }

    const roadmap = await generateRoadmap(
      jobDescription,
      missingSkills || [],
      matchScore || 0
    );

    // Save to DB if user is logged in
    if (userId) {
      await AtsRoadmap.create({
        userId,
        jobRole: roadmap.jobRole,
        matchScore: matchScore || 0,
        missingSkills: missingSkills || [],
        roadmapData: roadmap,
      });
    }

    res.status(200).json({ roadmap });
  } catch (err: unknown) {
    console.error('Roadmap generation error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Roadmap generation failed.' });
  }
};

// GET /api/roadmap/saved/:userId
export const getSavedRoadmaps = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const roadmaps = await AtsRoadmap.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.status(200).json({ roadmaps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved roadmaps.' });
  }
};
