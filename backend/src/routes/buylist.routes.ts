import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import BuylistItem from '../models/Buylist.model';

const router = Router();

// ── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/buylist — all active buylist items
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = (req.query.q as string) || '';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const filter: any = { isActive: true };
  if (q) {
    filter.cardName = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  const [items, total] = await Promise.all([
    BuylistItem.find(filter).sort({ sortOrder: 1, cardName: 1 }).skip(skip).limit(limit).lean(),
    BuylistItem.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    items,
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
}));

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/admin/buylist — all items (including inactive)
router.get('/admin', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = (req.query.q as string) || '';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (q) {
    filter.cardName = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  const [items, total] = await Promise.all([
    BuylistItem.find(filter).sort({ sortOrder: 1, cardName: 1 }).skip(skip).limit(limit).lean(),
    BuylistItem.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    items,
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
}));

// POST /api/admin/buylist — create item
router.post('/admin', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cardName, setCode, setName, imageUrl, condition, finish, buyPrice, notes, sortOrder, isActive } = req.body;

  if (!cardName || !condition || !finish || buyPrice == null) {
    res.status(400).json({ error: 'cardName, condition, finish, and buyPrice are required' });
    return;
  }

  const item = await BuylistItem.create({
    cardName: cardName.trim(),
    setCode: setCode?.trim(),
    setName: setName?.trim(),
    imageUrl,
    condition,
    finish,
    buyPrice: Number(buyPrice),
    notes,
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive !== false,
  });

  res.status(201).json({ item });
}));

// PUT /api/admin/buylist/:id — update item
router.put('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: 'Invalid ID format' }); return;
  }
  const { cardName, setCode, setName, imageUrl, condition, finish, buyPrice, notes, sortOrder, isActive } = req.body;

  const item = await BuylistItem.findByIdAndUpdate(
    req.params.id,
    {
      ...(cardName !== undefined && { cardName: cardName.trim() }),
      ...(setCode !== undefined && { setCode: setCode.trim() }),
      ...(setName !== undefined && { setName: setName.trim() }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(condition !== undefined && { condition }),
      ...(finish !== undefined && { finish }),
      ...(buyPrice !== undefined && { buyPrice: Number(buyPrice) }),
      ...(notes !== undefined && { notes }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true, runValidators: true }
  );

  if (!item) { res.status(404).json({ error: 'Buylist item not found' }); return; }
  res.json({ item });
}));

// DELETE /api/admin/buylist/:id — delete item
router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: 'Invalid ID format' }); return;
  }
  const item = await BuylistItem.findByIdAndDelete(req.params.id);
  if (!item) { res.status(404).json({ error: 'Buylist item not found' }); return; }
  res.json({ message: 'Deleted' });
}));

export default router;
