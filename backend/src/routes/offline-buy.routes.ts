import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import Card from '../models/Card.model';
import User from '../models/User.model';
import OfflineBuy from '../models/OfflineBuy.model';
import CardPrice from '../models/CardPrice';
import { isUBSet } from '../utils/ubPricing';

const router = Router();
router.use(authenticate, requireAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/offline-buys/search-cards?q=xxx
// Search all cards in the catalog (no inventory filter – we're buying new stock)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q: string };

    const matchFilter: Record<string, any> = { isActive: true };
    if (q && q.trim().length > 0) {
      matchFilter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { setCode: { $regex: q.trim(), $options: 'i' } },
        { setName: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const cards = await Card.find(matchFilter)
      .select('_id name setCode setName collectorNumber imageUrl uuid rarity')
      .limit(40)
      .lean();

    // Fetch latest CK buy prices
    const uuids = cards.map((c: any) => c.uuid).filter(Boolean);
    const priceRecords = await CardPrice.find({ uuid: { $in: uuids } })
      .sort({ date: -1 })
      .lean();
    const priceMap = new Map<string, any>();
    for (const rec of priceRecords) {
      if (!priceMap.has(rec.uuid)) priceMap.set(rec.uuid, rec);
    }

    const results = cards.map((card: any) => {
      const priceRec = card.uuid ? priceMap.get(card.uuid) : undefined;
      const ckBuy = priceRec?.prices?.cardkingdom?.buylist;
      return {
        _id: card._id,
        name: card.name,
        setCode: card.setCode,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        ckBuyPrice: {
          normal: ckBuy?.normal || 0,
          foil: ckBuy?.foil || 0,
          etched: ckBuy?.etched || 0,
        },
      };
    });

    res.json({ success: true, cards: results });
  } catch (error: any) {
    console.error('Buy search-cards error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/offline-buys
// List buy records with optional filters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (memberId) filter.memberId = memberId;
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [buys, total] = await Promise.all([
      OfflineBuy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      OfflineBuy.countDocuments(filter),
    ]);

    res.json({
      success: true,
      buys,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error('List offline buys error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/offline-buys
// Record a purchase from a member and increment destination seller inventory
// Body: {
//   memberName: string,
//   memberId?: string,
//   destinationSellerId: string,
//   destinationSellerName: string,
//   paymentMethod: 'cash' | 'transfer' | 'store-credit' | 'other',
//   notes?: string,
//   items: [{ cardId, condition, finish, quantity, pricePerUnit }]
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      memberName,
      memberId,
      destinationSellerId,
      destinationSellerName,
      paymentMethod,
      notes,
      items,
    } = req.body;

    if (!memberName?.trim()) {
      res.status(400).json({ success: false, error: 'memberName is required' });
      return;
    }
    if (!destinationSellerId) {
      res.status(400).json({ success: false, error: 'destinationSellerId is required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'items are required' });
      return;
    }

    const resolvedItems: any[] = [];
    const cardUpdates: Array<{ card: any; inventoryIndex: number; qty: number }> = [];

    for (const item of items) {
      const { cardId, condition, finish, quantity, pricePerUnit } = item;

      if (!cardId || !condition || !finish || !quantity || quantity < 1) {
        res.status(400).json({ success: false, error: `Invalid item data: ${JSON.stringify(item)}` });
        return;
      }

      const card = await Card.findById(cardId);
      if (!card) {
        res.status(404).json({ success: false, error: `Card not found: ${cardId}` });
        return;
      }

      // Find existing inventory slot for this seller + condition + finish
      let invIdx = card.inventory.findIndex(
        (inv: any) => inv.sellerId === destinationSellerId && inv.condition === condition && inv.finish === finish
      );

      if (invIdx === -1) {
        // Add a new inventory slot
        const newSlot = {
          condition,
          finish,
          quantityOwned: 0,
          quantityForSale: 0,
          buyPrice: pricePerUnit || 0,
          sellPrice: 0,
          marketplacePrice: 0,
          sellerId: destinationSellerId,
          sellerName: destinationSellerName,
        };
        card.inventory.push(newSlot as any);
        invIdx = card.inventory.length - 1;
      }

      resolvedItems.push({
        cardId: card._id,
        cardName: card.name,
        setCode: card.setCode,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        imageUrl: card.imageUrl || '',
        condition,
        finish,
        inventoryIndex: invIdx,
        quantity,
        pricePerUnit: pricePerUnit || 0,
        subtotal: (pricePerUnit || 0) * quantity,
        destinationSellerId,
        destinationSellerName,
      });

      cardUpdates.push({ card, inventoryIndex: invIdx, qty: quantity });
    }

    // Increment inventory
    for (const { card, inventoryIndex, qty } of cardUpdates) {
      card.inventory[inventoryIndex].quantityOwned += qty;
      card.inventory[inventoryIndex].quantityForSale += qty;
      if (card.inventory[inventoryIndex].buyPrice === 0) {
        const resolvedItem = resolvedItems.find(
          (ri) => ri.cardId.toString() === card._id.toString() && ri.inventoryIndex === inventoryIndex
        );
        if (resolvedItem) card.inventory[inventoryIndex].buyPrice = resolvedItem.pricePerUnit;
      }
      await card.save();
    }

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // If paying with store-credit, deduct from member's balance
    if (paymentMethod === 'store-credit' && memberId) {
      await User.findByIdAndUpdate(memberId, {
        $inc: { storeCredit: -totalAmount },
      });
    }

    const buy = new OfflineBuy({
      memberName: memberName.trim(),
      memberId: memberId || undefined,
      destinationSellerId,
      destinationSellerName,
      items: resolvedItems,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || undefined,
      status: 'completed',
    });

    await buy.save();
    res.status(201).json({ success: true, buy });
  } catch (error: any) {
    console.error('Create offline buy error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/offline-buys/:id/void
// Void a buy and decrement the inventory that was added
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/void', async (req: Request, res: Response): Promise<void> => {
  try {
    const buy = await OfflineBuy.findById(req.params.id);
    if (!buy) {
      res.status(404).json({ success: false, error: 'Buy record not found' });
      return;
    }
    if (buy.status === 'voided') {
      res.status(400).json({ success: false, error: 'Already voided' });
      return;
    }

    // Reverse inventory increments
    for (const item of buy.items) {
      const card = await Card.findById(item.cardId);
      if (card) {
        const inv = card.inventory[item.inventoryIndex];
        if (inv) {
          inv.quantityOwned = Math.max(0, inv.quantityOwned - item.quantity);
          inv.quantityForSale = Math.max(0, inv.quantityForSale - item.quantity);
          await card.save();
        }
      }
    }

    // If had been paid with store-credit, restore member's credit
    if (buy.paymentMethod === 'store-credit' && buy.memberId) {
      await User.findByIdAndUpdate(buy.memberId, {
        $inc: { storeCredit: buy.totalAmount },
      });
    }

    buy.status = 'voided';
    await buy.save();

    res.json({ success: true, message: 'Buy voided and inventory reversed', buy });
  } catch (error: any) {
    console.error('Void offline buy error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
