import { Router } from 'express';
import {
  getChatResponse,
  getStreamChatAuth,
  createOrGetDirectChannel,
  getMessagingContacts,
} from '../controllers/chatController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', getChatResponse);
router.get('/stream/auth', verifyToken, getStreamChatAuth);
router.get('/stream/contacts', verifyToken, getMessagingContacts);
router.post('/stream/channel', verifyToken, createOrGetDirectChannel);

export default router;
