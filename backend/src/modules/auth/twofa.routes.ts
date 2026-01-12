import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { setup2FA, verify2FASetup, disable2FA, verify2FA, get2FAStatus, initialSetup2FA, initialVerify2FASetup, reset2FA } from './twofa.controller';

const router = Router();

// Initial 2FA setup routes (no authentication required, uses userId from request body)
router.post('/initial-setup', (req, res) => initialSetup2FA(req, res));
router.post('/initial-verify', (req, res) => initialVerify2FASetup(req, res));

// All other 2FA routes require authentication
router.use(authenticate);

// Get 2FA status
router.get('/status', get2FAStatus);

// Setup 2FA (generate QR code)
router.post('/setup', setup2FA);

// Reset 2FA (generate new QR code for existing users)
router.post('/reset', reset2FA);

// Verify 2FA setup (enable 2FA)
router.post('/verify-setup', verify2FASetup);

// Verify 2FA token
router.post('/verify', verify2FA);

// Disable 2FA
router.post('/disable', disable2FA);

export default router;
