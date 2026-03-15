import { Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { evaluate, evaluateText, evaluateTextForUser, getAtsHistory } from '../controllers/atsController';

const router = Router();

// Route to evaluate a candidate's profile against a job description
router.post('/evaluate/:jobId/:userId', verifyToken, evaluate);

// Route to evaluate raw text (resume vs job description)
router.post('/evaluate-text', evaluateText);

// Route to evaluate JD text against a user's profile
router.post('/evaluate-text/:userId', verifyToken, evaluateTextForUser);

// Route to fetch ATS history for a user
router.get('/history/:userId', verifyToken, getAtsHistory);

export default router;
