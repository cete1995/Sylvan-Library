import { Router } from 'express';
import { register, registerCustomer, login, getCurrentUser, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin user
 * @access  Public (but should be restricted in production)
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/register/customer
 * @desc    Register a new customer user
 * @access  Public
 */
router.post('/register/customer', registerCustomer);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', login);

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

export default router;
