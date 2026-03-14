import { Router } from 'express';
import { authenticateToken } from '../auth/middleware';
import { createRoom, getRooms, joinRoomRequest, getRoomById } from '../controllers/roomController';

const router = Router();

router.post('/', authenticateToken, createRoom);
router.get('/', authenticateToken, getRooms);
router.post('/join', authenticateToken, joinRoomRequest);
router.get('/:id', authenticateToken, getRoomById);

export default router;
