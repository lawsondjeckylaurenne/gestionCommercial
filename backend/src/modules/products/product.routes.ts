import { Router } from 'express';
import { createProduct, getProducts, updateProduct } from './product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authenticate, requireTenant);

// Magasinier and above can manage products
router.post('/create', requireRole('MAGASINIER'), createProduct);
router.get('/list', getProducts); // All authenticated tenant users can view products
router.put('/update/:id', requireRole('MAGASINIER'), updateProduct);
router.put('/:id', requireRole('MAGASINIER'), updateProduct);

export default router;
