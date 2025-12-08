import { Request, Response } from 'express';
import { User } from '../models';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { registerSchema, loginSchema } from '../validators/auth.validator';

/**
 * Register a new customer user
 * POST /api/auth/register/customer
 */
export const registerCustomer = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw new AppError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(validatedData.password);

  // Create customer user
  const user = await User.create({
    email: validatedData.email,
    passwordHash,
    name: validatedData.name,
    role: 'customer',
  });

  // Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

/**
 * Register a new admin user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw new AppError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(validatedData.password);

  // Create user
  const user = await User.create({
    email: validatedData.email,
    passwordHash,
    role: 'admin',
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = loginSchema.parse(req.body);

  // Find user (include password hash)
  const user = await User.findOne({ email: validatedData.email }).select('+passwordHash');
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Check password
  const isPasswordValid = await comparePassword(validatedData.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (!reqUser) {
    throw new AppError(401, 'Not authenticated');
  }

  const user = await User.findById(reqUser.id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  });
});
