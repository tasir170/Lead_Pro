import { Router, Request, Response } from 'express';
import { chatbotService } from '../services/chatbot/chatbotService.js';
import { ChatbotRequest } from '../services/chatbot/types.js';

export const chatbotRouter = Router();

/**
 * POST /api/chatbot/message
 * Conversational sales assistant endpoint
 */
chatbotRouter.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, history, confirmedAction }: ChatbotRequest = req.body;

    if (!message && !confirmedAction) {
      return res.status(400).json({ success: false, error: 'Message or confirmedAction is required' });
    }

    const response = await chatbotService.processMessage({
      message: message || '',
      sessionId,
      history,
      confirmedAction,
    });

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Chatbot service error' });
  }
});

/**
 * GET /api/chatbot/stats
 * Quick pipeline stats snapshot
 */
chatbotRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = chatbotService.calculateLeadStatistics();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
