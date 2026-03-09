import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import Wishlist from '../models/Wishlist.model';
import StockNotification from '../models/StockNotification.model';

const router = Router();

// All wishlist routes require auth
router.use(authenticate);

// ── Stock-notify routes first (prevent /:cardId from capturing 'stock-notify') ──

// GET /api/wishlist/stock-notify/:cardId – check subscription status
router.get(
  '/stock-notify/:cardId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!mongoose.isValidObjectId(cardId)) throw new AppError(400, 'Invalid card ID');
    const notif = await StockNotification.findOne({
      user: req.user!.id,
      card: new mongoose.Types.ObjectId(cardId),
    });
    res.json({ subscribed: !!notif });
  })
);

// POST /api/wishlist/stock-notify/:cardId – subscribe
router.post(
  '/stock-notify/:cardId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!mongoose.isValidObjectId(cardId)) throw new AppError(400, 'Invalid card ID');
    await StockNotification.findOneAndUpdate(
      { user: req.user!.id, card: new mongoose.Types.ObjectId(cardId) },
      { user: req.user!.id, card: new mongoose.Types.ObjectId(cardId) },
      { upsert: true }
    );
    res.json({ message: "You'll be notified when this card is back in stock." });
  })
);

// DELETE /api/wishlist/stock-notify/:cardId – unsubscribe
router.delete(
  '/stock-notify/:cardId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!mongoose.isValidObjectId(cardId)) throw new AppError(400, 'Invalid card ID');
    await StockNotification.deleteOne({
      user: req.user!.id,
      card: new mongoose.Types.ObjectId(cardId),
    });
    res.json({ message: 'Notification removed.' });
  })
);

// ── Core wishlist routes ──

// GET /api/wishlist – get authenticated user's wishlist
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const wishlist = await Wishlist.findOne({ user: req.user!.id }).populate(
      'cards',
      'name setCode setName collectorNumber imageUrl rarity inventory layout borderColor frameEffects isActive'
    );
    res.json({ cards: wishlist?.cards || [] });
  })
);

// POST /api/wishlist/:cardId – add card to wishlist
router.post(
  '/:cardId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!mongoose.isValidObjectId(cardId)) throw new AppError(400, 'Invalid card ID');
    await Wishlist.findOneAndUpdate(
      { user: req.user!.id },
      { $addToSet: { cards: new mongoose.Types.ObjectId(cardId) } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Added to wishlist' });
  })
);

// DELETE /api/wishlist/:cardId – remove card from wishlist
router.delete(
  '/:cardId',
  asyncHandler(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    if (!mongoose.isValidObjectId(cardId)) throw new AppError(400, 'Invalid card ID');
    await Wishlist.findOneAndUpdate(
      { user: req.user!.id },
      { $pull: { cards: new mongoose.Types.ObjectId(cardId) } }
    );
    res.json({ message: 'Removed from wishlist' });
  })
);

export default router;
