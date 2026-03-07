import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/change-password', changePassword);

export default router;
