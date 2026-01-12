import { Router } from 'express';
import { uploadImage, serveImage } from './upload.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Upload image (requires authentication)
router.post('/image', authenticate, uploadImage);

// Serve images (public access for displaying images)
router.get('/images/:filename', serveImage);

export default router;
