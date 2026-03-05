import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import CafeSettings from '../models/CafeSettings.model';

/**
 * GET /api/cafe/settings  (public)
 * Returns the current café settings, creating defaults if none exist.
 */
export const getCafeSettings = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await CafeSettings.findOne();
  if (!settings) {
    settings = await CafeSettings.create({});
  }
  res.json(settings);
});

/**
 * PUT /api/admin/cafe/settings  (admin only)
 * Full-replace of the café settings document.
 */
export const updateCafeSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await CafeSettings.findOne();
  if (!settings) {
    settings = await CafeSettings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json({ success: true, settings });
});
