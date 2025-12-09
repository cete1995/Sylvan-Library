import { Request, Response } from 'express';
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
