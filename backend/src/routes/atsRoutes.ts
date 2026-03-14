import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { evaluate } from '../controllers/atsController';

const router = Router();

// Route to evaluate a candidate's profile against a job description
router.post('/evaluate/:jobId/:userId', verifyToken, evaluate);

export default router;
