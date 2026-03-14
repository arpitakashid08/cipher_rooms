import { Router } from 'express';
import { authenticateToken } from '../auth/middleware';
import { getUsers } from '../controllers/userController';

const router = Router();

router.get('/', authenticateToken, getUsers);

export default router;
