import { Router } from 'express';
import { register, login, logout, setup2FA, verify2FA } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimitMiddleware, register);
router.post('/login', authRateLimitMiddleware, login);
router.post('/logout', logout);

router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);

export default router;
