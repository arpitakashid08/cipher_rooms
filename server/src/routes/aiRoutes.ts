import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth/middleware';
import { summarizeChat, extractTasks, askSmartAssistant } from '../ai/ciphermind';
import Message from '../models/Message';

const router = Router();

router.post('/summarize/:roomId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(50);
    const textList = messages.reverse().map(m => m.text);
    
    const summary = await summarizeChat(textList);
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/tasks/:roomId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(50);
    const textList = messages.reverse().map(m => m.text);
    
    const tasks = await extractTasks(textList);
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/ask', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { question } = req.body;
    const answer = await askSmartAssistant(question);
    res.status(200).json({ answer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
