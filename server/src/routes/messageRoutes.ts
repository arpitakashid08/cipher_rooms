import { Router } from 'express';
import { authenticateToken } from '../auth/middleware';
import { getMessagesByRoom, createMessage } from '../controllers/messageController';

const router = Router();

router.get('/:roomId', authenticateToken, getMessagesByRoom);
router.post('/', authenticateToken, createMessage);

export default router;
