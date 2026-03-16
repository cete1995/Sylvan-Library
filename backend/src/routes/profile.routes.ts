import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller';

const router = Router();

// Rate limiter for password change: max 5 attempts per 15 minutes per IP
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password change attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/change-password', passwordChangeLimiter, changePassword);

export default router;
