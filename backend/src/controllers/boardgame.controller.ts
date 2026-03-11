import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import BoardGame from '../models/BoardGame.model';

// ─────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────

/**
 * GET /api/boardgames
 * Returns available boardgames, supports text search, category & difficulty filters.
 */
export const getBoardgames = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, difficulty, featured, page = '1', limit = '50' } = req.query;

  const filter: Record<string, unknown> = { available: true };
  if (q) filter.$text = { $search: q as string };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (featured === 'true') filter.featured = true;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [games, total] = await Promise.all([
    BoardGame.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limitNum),
    BoardGame.countDocuments(filter),
  ]);

  res.json({
    games,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────

/**
 * GET /api/admin/boardgames
 * Returns all boardgames (including unavailable) for admin management.
 */
export const adminGetBoardgames = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = '1', limit = '100' } = req.query;

  const filter: Record<string, unknown> = {};
  if (q) filter.$text = { $search: q as string };

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [games, total] = await Promise.all([
    BoardGame.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limitNum),
    BoardGame.countDocuments(filter),
  ]);

  res.json({
    games,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/**
 * POST /api/admin/boardgames
 */
export const createBoardgame = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, minPlayers, maxPlayers, durationMinutes,
          category, difficulty, imageUrl, available, featured, sortOrder } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'Game name is required');
  }

  const game = await BoardGame.create({
    name: name.trim(),
    description: description ?? '',
    minPlayers: minPlayers ?? 2,
    maxPlayers: maxPlayers ?? 4,
    durationMinutes: durationMinutes ?? 60,
    category: category ?? 'General',
    difficulty: difficulty ?? 'Medium',
    imageUrl: imageUrl ?? '',
    available: available !== false,
    featured: featured === true,
    sortOrder: sortOrder ?? 0,
  });

  res.status(201).json({ message: 'Boardgame created', game });
});

/**
 * PUT /api/admin/boardgames/:id
 */
export const updateBoardgame = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'Invalid boardgame ID format');
  }
  const game = await BoardGame.findById(req.params.id);
  if (!game) throw new AppError(404, 'Boardgame not found');

  const { name, description, minPlayers, maxPlayers, durationMinutes,
          category, difficulty, imageUrl, available, featured, sortOrder } = req.body;

  if (name !== undefined) game.name = String(name).trim() || game.name;
  if (description !== undefined) game.description = description;
  if (minPlayers !== undefined) game.minPlayers = Number(minPlayers);
  if (maxPlayers !== undefined) game.maxPlayers = Number(maxPlayers);
  if (durationMinutes !== undefined) game.durationMinutes = Number(durationMinutes);
  if (category !== undefined) game.category = category;
  if (difficulty !== undefined) game.difficulty = difficulty;
  if (imageUrl !== undefined) game.imageUrl = imageUrl;
  if (available !== undefined) game.available = Boolean(available);
  if (featured !== undefined) game.featured = Boolean(featured);
  if (sortOrder !== undefined) game.sortOrder = Number(sortOrder);

  await game.save();
  res.json({ message: 'Boardgame updated', game });
});

/**
 * DELETE /api/admin/boardgames/:id
 * Soft-delete: marks as unavailable instead of removing from DB.
 */
export const deleteBoardgame = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'Invalid boardgame ID format');
  }
  const game = await BoardGame.findById(req.params.id);
  if (!game) throw new AppError(404, 'Boardgame not found');

  game.available = false;
  await game.save();
  res.json({ message: 'Boardgame removed from catalogue' });
});

/**
 * DELETE /api/admin/boardgames/:id/permanent
 * Hard-delete: permanently removes the document.
 */
export const permanentDeleteBoardgame = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'Invalid boardgame ID format');
  }
  const game = await BoardGame.findByIdAndDelete(req.params.id);
  if (!game) throw new AppError(404, 'Boardgame not found');
  res.json({ message: 'Boardgame permanently deleted' });
});
