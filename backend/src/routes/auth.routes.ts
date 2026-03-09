import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, registerCustomer, login, logout, getCurrentUser, refreshToken } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Rate limiter: max 10 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin/seller user
 * @access  Private - Admin only
 */
router.post('/register', authenticate, requireAdmin, register);

/**
 * @route   POST /api/auth/register/customer
 * @desc    Register a new customer user
 * @access  Public
 */
router.post('/register/customer', authLimiter, registerCustomer);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
