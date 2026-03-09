import { Request, Response } from 'express';
import { User } from '../models';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../utils/auth.utils';
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

  // Generate JWT tokens
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await user.save();

  res.status(201).json({
    message: 'Registration successful',
    token,
    refreshToken,
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
    name: validatedData.name,
    role: validatedData.role ?? 'admin',
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
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

  // Generate JWT tokens
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await user.save();

  res.json({
    message: 'Login successful',
    token,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
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
      name: user.name,
      role: user.role,
    },
  });
});

/**
 * Logout user and invalidate refresh token
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser?.id) {
    await User.findByIdAndUpdate(reqUser.id, {
      $unset: { refreshToken: 1, refreshTokenExpiry: 1 },
    });
  }
  res.json({ message: 'Logged out successfully' });
});

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token is required');
  }

  // Verify refresh token with dedicated refresh secret
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  // Find user and check if refresh token matches
  const user = await User.findById(decoded.id).select('+refreshToken +refreshTokenExpiry');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError(401, 'Invalid refresh token');
  }

  // Check if refresh token is expired
  if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
    throw new AppError(401, 'Refresh token has expired');
  }

  // Generate new access token
  const newAccessToken = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Optionally rotate refresh token (generate new one)
  const newRefreshToken = generateRefreshToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  user.refreshToken = newRefreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await user.save();

  res.json({
    message: 'Token refreshed successfully',
    token: newAccessToken,
    refreshToken: newRefreshToken,
  });
});
