import { Router } from 'express';
import { createTenant, getTenants } from './tenant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

// Explicit routes
router.post('/create', authenticate, requireRole('SUPERADMIN'), createTenant);
router.get('/list', authenticate, requireRole('SUPERADMIN'), getTenants);

export default router;
