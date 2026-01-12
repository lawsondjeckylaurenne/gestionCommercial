import { Router } from 'express';
import { createUser, getUsers, deleteUser } from './user.controller';
import { getProfile, updateProfile, uploadProfileImage, changePassword } from './profile.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, requireTenant);

// Profile routes (all authenticated users can access their own profile)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/image', uploadProfileImage);
router.post('/profile/change-password', changePassword);

// Only Director and Gerant can manage users (Gerant might have limited scope, but for now let's say Director)
router.post('/create', requireRole('DIRECTEUR'), createUser);
router.get('/list', requireRole('DIRECTEUR'), getUsers);
router.delete('/delete/:id', requireRole('DIRECTEUR'), deleteUser);

export default router;
