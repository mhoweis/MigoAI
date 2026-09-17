// src/api/chat/routes.ts
import { Router } from 'express';
import { chatController } from './controller';

const router = Router();

// Get all chat sessions for user
router.get('/sessions', chatController.getChatSessions);

// Create new chat session
router.post('/sessions', chatController.createChatSession);

// Get messages for a session
router.get('/sessions/:sessionId/messages', chatController.getMessages);

// Send message in session
router.post('/sessions/:sessionId/messages', chatController.sendMessage);

// Delete chat session
router.delete('/sessions/:sessionId', chatController.deleteChatSession);

// AI chat endpoint
router.post('/ai/ask', chatController.askAI);

// Get AI conversation history
router.get('/ai/history', chatController.getAIHistory);

export default router;