import { Router } from 'express';
import { createSale, getSales } from './sale.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

// Vendeur and above can make sales
router.post('/create', requireRole('VENDEUR'), createSale);
router.get('/list', requireRole('VENDEUR'), getSales);

export default router;
