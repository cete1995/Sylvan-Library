import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import BoardGame from '../models/BoardGame.model';

// ─────────────────────────────────────────────
// Input validation constants & helper
// ─────────────────────────────────────────────

const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const ALLOWED_CATEGORIES   = ['Strategy', 'Party', 'Family', 'Co-op', 'General'] as const;
const HTTP_URL_RE = /^https?:\/\/.+/;

const LIMITS = {
  name:      200,
  shortText: 200,   // designer, publisher, age
  longText:  5_000, // description, howToPlay
  age:       20,
  gallery:   20,    // max items in gallery array
  players:   { min: 1,  max: 20 },
  duration:  { min: 1,  max: 1440 },
  sortOrder: { min: 0,  max: 9_999 },
};

/**
 * Validates boardgame create/update payload.
 * Returns an error string if invalid, null if OK.
 * Pass isUpdate=true to skip "name is required" check.
 */
function validateBoardgameInput(
  body: Record<string, unknown>,
  isUpdate = false,
): string | null {
  const {
    name, description, howToPlay, designer, publisher, age,
    category, difficulty, imageUrl, gallery,
    minPlayers, maxPlayers, durationMinutes, sortOrder,
  } = body;

  if (!isUpdate) {
    if (!name || typeof name !== 'string' || !name.trim())
      return 'Game name is required';
  }
  if (name !== undefined && String(name).trim().length > LIMITS.name)
    return `name must be ≤${LIMITS.name} characters`;
  if (description !== undefined && String(description).length > LIMITS.longText)
    return `description must be ≤${LIMITS.longText} characters`;
  if (howToPlay !== undefined && String(howToPlay).length > LIMITS.longText)
    return `howToPlay must be ≤${LIMITS.longText} characters`;
  if (designer !== undefined && String(designer).length > LIMITS.shortText)
    return `designer must be ≤${LIMITS.shortText} characters`;
  if (publisher !== undefined && String(publisher).length > LIMITS.shortText)
    return `publisher must be ≤${LIMITS.shortText} characters`;
  if (age !== undefined && String(age).length > LIMITS.age)
    return `age must be ≤${LIMITS.age} characters`;
  if (category !== undefined && !ALLOWED_CATEGORIES.includes(category as never))
    return `category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`;
  if (difficulty !== undefined && !ALLOWED_DIFFICULTIES.includes(difficulty as never))
    return `difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`;
  if (imageUrl !== undefined && imageUrl !== '' && !HTTP_URL_RE.test(String(imageUrl)))
    return 'imageUrl must be a valid http/https URL';
  if (gallery !== undefined) {
    if (!Array.isArray(gallery))
      return 'gallery must be an array';
    if ((gallery as unknown[]).length > LIMITS.gallery)
      return `gallery may contain at most ${LIMITS.gallery} images`;
    for (const u of gallery as unknown[]) {
      if (typeof u !== 'string' || (u && !HTTP_URL_RE.test(u)))
        return 'each gallery item must be a valid http/https URL';
    }
  }
  if (minPlayers !== undefined) {
    const n = Number(minPlayers);
    if (!Number.isFinite(n) || n < LIMITS.players.min || n > LIMITS.players.max)
      return `minPlayers must be between ${LIMITS.players.min} and ${LIMITS.players.max}`;
  }
  if (maxPlayers !== undefined) {
    const n = Number(maxPlayers);
    if (!Number.isFinite(n) || n < LIMITS.players.min || n > LIMITS.players.max)
      return `maxPlayers must be between ${LIMITS.players.min} and ${LIMITS.players.max}`;
  }
  if (durationMinutes !== undefined) {
    const n = Number(durationMinutes);
    if (!Number.isFinite(n) || n < LIMITS.duration.min || n > LIMITS.duration.max)
      return `durationMinutes must be between ${LIMITS.duration.min} and ${LIMITS.duration.max}`;
  }
  if (sortOrder !== undefined) {
    const n = Number(sortOrder);
    if (!Number.isFinite(n) || n < LIMITS.sortOrder.min || n > LIMITS.sortOrder.max)
      return `sortOrder must be between ${LIMITS.sortOrder.min} and ${LIMITS.sortOrder.max}`;
  }
  return null;
}

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
  if (q) {
    const qStr = String(q).trim().slice(0, 200);
    if (qStr) filter.$text = { $search: qStr };
  }
  // Only pass known-valid enum values to prevent query pollution
  if (category && ALLOWED_CATEGORIES.includes(category as never)) filter.category = category;
  if (difficulty && ALLOWED_DIFFICULTIES.includes(difficulty as never)) filter.difficulty = difficulty;
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

/**
 * GET /api/boardgames/:id
 * Returns a single available boardgame by ID (for detail page).
 */
export const getBoardgameById = asyncHandler(async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'Invalid boardgame ID');
  }
  const game = await BoardGame.findOne({ _id: req.params.id, available: true });
  if (!game) throw new AppError(404, 'Boardgame not found');
  res.json({ game });
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
          category, difficulty, imageUrl, available, featured, sortOrder,
          gallery, howToPlay, designer, publisher, age } = req.body;

  const validErr = validateBoardgameInput(req.body);
  if (validErr) throw new AppError(400, validErr);

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
    gallery: Array.isArray(gallery) ? gallery : [],
    howToPlay: howToPlay ?? '',
    designer: designer ?? '',
    publisher: publisher ?? '',
    age: age ?? '',
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

  const validErr = validateBoardgameInput(req.body, true);
  if (validErr) throw new AppError(400, validErr);

  const { name, description, minPlayers, maxPlayers, durationMinutes,
          category, difficulty, imageUrl, available, featured, sortOrder,
          gallery, howToPlay, designer, publisher, age } = req.body;

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
  if (gallery !== undefined) game.gallery = Array.isArray(gallery) ? gallery : [];
  if (howToPlay !== undefined) game.howToPlay = howToPlay;
  if (designer !== undefined) game.designer = designer;
  if (publisher !== undefined) game.publisher = publisher;
  if (age !== undefined) game.age = age;

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
