import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { upload, uploadImage } from '../controllers/upload.controller';

const router = Router();

// Require authentication and admin role for uploads
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   POST /api/upload/image
 * @desc    Upload an image file
 * @access  Private (Admin)
 */
router.post('/image', upload.single('image'), uploadImage);

export default router;
