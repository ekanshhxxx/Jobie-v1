import { Request, Response } from 'express';
import { analyseWithAts } from '../services/atsService';

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

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'An error occurred during ATS evaluation.' });
  }
}
