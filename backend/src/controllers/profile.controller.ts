import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get current user profile
 * GET /api/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  const user = await User.findById(userId).select('-passwordHash');
  
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({ user });
});

/**
 * Update user profile
 * PUT /api/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const { name, address, phoneNumber, courierNotes, profilePhoto } = req.body;

  // V10 — enforce field length limits to prevent DB bloat
  if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
    throw new AppError(400, 'Name must be a string up to 100 characters');
  }
  if (address !== undefined && (typeof address !== 'string' || address.length > 300)) {
    throw new AppError(400, 'Address must be a string up to 300 characters');
  }
  if (phoneNumber !== undefined && (typeof phoneNumber !== 'string' || phoneNumber.length > 30)) {
    throw new AppError(400, 'Phone number must be a string up to 30 characters');
  }
  if (courierNotes !== undefined && (typeof courierNotes !== 'string' || courierNotes.length > 500)) {
    throw new AppError(400, 'Courier notes must be a string up to 500 characters');
  }
  // V6 — profilePhoto must be a valid http/https URL or empty string
  if (profilePhoto !== undefined && profilePhoto !== '') {
    if (typeof profilePhoto !== 'string' || !/^https?:\/\/.+/.test(profilePhoto) || profilePhoto.length > 500) {
      throw new AppError(400, 'Profile photo must be a valid http/https URL');
    }
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Update fields if provided
  if (name !== undefined) user.name = name;
  if (address !== undefined) user.address = address;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (courierNotes !== undefined) user.courierNotes = courierNotes;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

  await user.save();

  // Return user without password hash
  const updatedUser = await User.findById(userId).select('-passwordHash');

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

/**
 * Change password
 * POST /api/profile/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError(400, 'Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new AppError(400, 'New password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new AppError(400, 'New password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new AppError(400, 'New password must contain at least one number');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // Invalidate all existing sessions so stolen tokens can't be reused
  user.refreshToken = undefined;
  user.refreshTokenExpiry = undefined;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});
