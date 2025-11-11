import express, { Response } from 'express';
import Chat from '../models/Chat';
import { getAIResponse } from '../utils/aiService';

const router = express.Router();

// Get chat history (no auth, returns empty for demo)
router.get('/history', async (req, res: Response) => {
  res.json([]);
});

// Create new chat (no auth, demo AI response)
router.post('/', async (req, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    // Call AI service for demo
    const aiReply = await getAIResponse(message);
    res.json({
      aiMessage: {
        _id: 'demo-ai-id',
        sender: 'ai',
        message: aiReply,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
