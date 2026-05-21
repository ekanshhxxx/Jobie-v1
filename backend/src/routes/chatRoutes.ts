import express from "express";
import {
  createOrGetDirectChannel,
  createCopilotSession,
  getCopilotJobs,
  getCopilotSession,
  getCopilotSessions,
  getChatResponse,
  getMessagingContacts,
  getStreamChatAuth,
  sendCopilotMessage,
} from "../controllers/chatController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", getChatResponse);
router.get("/copilot/jobs", verifyToken, getCopilotJobs);
router.get("/copilot/sessions", verifyToken, getCopilotSessions);
router.post("/copilot/sessions", verifyToken, createCopilotSession);
router.get("/copilot/sessions/:sessionId", verifyToken, getCopilotSession);
router.post("/copilot/sessions/:sessionId/reply", verifyToken, sendCopilotMessage);
router.get("/stream/auth", verifyToken, getStreamChatAuth);
router.get("/stream/contacts", verifyToken, getMessagingContacts);
router.post("/stream/channel", verifyToken, createOrGetDirectChannel);

export default router;
