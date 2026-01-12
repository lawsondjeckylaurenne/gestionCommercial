import { Router } from 'express';
import { getStats } from './stats.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, getStats);

export default router;
