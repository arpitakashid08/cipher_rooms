import { Router } from 'express';
import { register, login, getMe } from '../auth/controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;
