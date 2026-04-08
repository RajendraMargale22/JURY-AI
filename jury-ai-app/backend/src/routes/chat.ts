import express, { Response } from 'express';
import Chat from '../models/Chat';
import { getAIResponse } from '../utils/aiService';
import { getMergedSystemSettings } from '../utils/systemSettings';

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    const settings = await getMergedSystemSettings();
    if (settings.chatEnabled === false) {
      return res.status(403).json({ message: 'Chat feature is currently disabled by admin settings' });
    }
    return next();
  } catch (error) {
    console.error('Chat settings check failed:', error);
    return res.status(500).json({ message: 'Unable to validate chat availability' });
  }
});

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
