import { Router } from 'express';
import { register, login, logout, setup2FA, verify2FA, get2FAStatus, disable2FA } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimitMiddleware } from '../../middleware/rateLimit.middleware';

const router = Router();

// router.post('/register', authRateLimitMiddleware, register); // Disabled: Users are created by Superadmin (Directors) or Directors (Team)
router.post('/login', authRateLimitMiddleware, login);
router.post('/logout', logout);

router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.get('/2fa/status', authenticate, get2FAStatus);
router.post('/2fa/disable', authenticate, disable2FA);

export default router;
