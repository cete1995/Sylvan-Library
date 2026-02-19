import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import Card from '../models/Card.model';
import User from '../models/User.model';
import OfflineSale from '../models/OfflineSale.model';
import CardPrice from '../models/CardPrice';
import { isUBSet, calculateUBPrice } from '../utils/ubPricing';
import { calculateRegularPrice } from '../utils/regularPricing';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/offline-sales/search-cards
 * Search cards that belong to a specific seller (by name query)
 * Query params: sellerId, q (search string)
 */
/**
 * GET /api/admin/offline-sales/search-cards
 * Search cards across ALL sellers (no sellerId required)
 * Returns cards with all seller inventory slots that have stock > 0
 * Query params: q (search string)
 */
router.get('/search-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q: string };

    // Build match filter
    const matchStage: Record<string, any> = {
      'inventory.0': { $exists: true }, // has at least one inventory entry
      isActive: true,
    };

    if (q && q.trim().length > 0) {
      matchStage.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { setCode: { $regex: q.trim(), $options: 'i' } },
        { setName: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const cards = await Card.find(matchStage)
      .select('_id name setCode setName collectorNumber imageUrl inventory uuid rarity')
      .limit(40)
      .lean();

    // Batch-fetch CK prices
    const uuids = cards.map((c: any) => c.uuid).filter(Boolean);
    const priceRecords = await CardPrice.find({ uuid: { $in: uuids } })
      .sort({ date: -1 })
      .lean();
    const priceMap = new Map<string, any>();
    for (const rec of priceRecords) {
      if (!priceMap.has(rec.uuid)) priceMap.set(rec.uuid, rec);
    }

    // Batch UB status
    const uniqueSetCodes = [...new Set(cards.map((c: any) => c.setCode))];
    const ubStatusMap = new Map<string, boolean>();
    for (const sc of uniqueSetCodes) {
      ubStatusMap.set(sc, await isUBSet(sc));
    }

    // Build results with computed sell prices
    const results = await Promise.all(
      cards.map(async (card: any) => {
        const priceRec = card.uuid ? priceMap.get(card.uuid) : undefined;
        const ckRetail = priceRec?.prices?.cardkingdom?.retail;
        const isUB = ubStatusMap.get(card.setCode) || false;

        // All inventory slots that have quantityForSale > 0 AND have a sellerId
        const inventoryWithSellers = await Promise.all(
          card.inventory
            .map((inv: any, idx: number) => ({ ...inv, inventoryIndex: idx }))
            .filter((inv: any) => inv.sellerId && inv.quantityForSale > 0)
            .map(async (inv: any) => {
              let computedSellPrice = inv.sellPrice || 0;
              if (ckRetail) {
                const ckPrice = inv.finish === 'etched'
                  ? (ckRetail.etched || ckRetail.foil || ckRetail.normal)
                  : inv.finish === 'foil'
                    ? (ckRetail.foil || ckRetail.normal)
                    : ckRetail.normal;
                if (ckPrice && ckPrice > 0) {
                  computedSellPrice = isUB
                    ? await calculateUBPrice(ckPrice)
                    : await calculateRegularPrice(ckPrice);
                }
              }
              return { ...inv, sellPrice: computedSellPrice };
            })
        );

        return {
          _id: card._id,
          name: card.name,
          setCode: card.setCode,
          setName: card.setName,
          collectorNumber: card.collectorNumber,
          imageUrl: card.imageUrl,
          inventory: inventoryWithSellers,
        };
      })
    );

    const filtered = results.filter((card) => card.inventory.length > 0);
    res.json({ success: true, cards: filtered });
  } catch (error: any) {
    console.error('Offline sale search-cards error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/offline-sales
 * List all offline sales with optional filters
 * Query: sellerId, status, page, limit
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sellerId,
      status,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};
    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      OfflineSale.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      OfflineSale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      sales,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('List offline sales error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/offline-sales/:id
 * Get a single offline sale by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await OfflineSale.findById(req.params.id).lean();
    if (!sale) {
      res.status(404).json({ success: false, error: 'Sale not found' });
      return;
    }
    res.json({ success: true, sale });
  } catch (error: any) {
    console.error('Get offline sale error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/offline-sales
 * Create a new offline sale and decrement inventory
 *
 * Body:
 *  sellerId: string
 *  customerName?: string
 *  paymentMethod: 'cash' | 'transfer' | 'other'
 *  notes?: string
 *  items: Array<{
 *    cardId: string
 *    inventoryIndex: number
 *    quantity: number
 *    pricePerUnit: number  // admin can override price
 *  }>
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerName, paymentMethod, notes, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'items are required' });
      return;
    }

    // Validate + resolve all items against actual inventory
    const resolvedItems: any[] = [];
    const cardUpdates: Array<{ card: any; idx: number; qty: number }> = [];

    for (const item of items) {
      const { cardId, inventoryIndex, quantity, pricePerUnit } = item;
      if (!cardId || inventoryIndex === undefined || !quantity || quantity < 1) {
        res.status(400).json({ success: false, error: `Invalid item data for card ${cardId}` });
        return;
      }

      const card = await Card.findById(cardId);
      if (!card) {
        res.status(404).json({ success: false, error: `Card not found: ${cardId}` });
        return;
      }

      const inv = card.inventory[inventoryIndex];
      if (!inv) {
        res.status(400).json({ success: false, error: `Inventory slot ${inventoryIndex} not found on card ${card.name}` });
        return;
      }
      if (!inv.sellerId) {
        res.status(400).json({ success: false, error: `Inventory slot has no seller for card ${card.name}` });
        return;
      }
      if (inv.quantityForSale < quantity) {
        res.status(400).json({
          success: false,
          error: `Not enough stock for ${card.name} (${inv.condition} ${inv.finish}). Available: ${inv.quantityForSale}, requested: ${quantity}`,
        });
        return;
      }

      // Determine unit price: use provided price, fall back to live calculated price
      let unitPrice: number = typeof pricePerUnit === 'number' && pricePerUnit > 0 ? pricePerUnit : 0;
      if (unitPrice === 0) {
        // Compute live sell price from CK data
        const priceRec = card.uuid
          ? await CardPrice.findOne({ uuid: card.uuid }).sort({ date: -1 }).lean()
          : null;
        const ckRetail = priceRec?.prices?.cardkingdom?.retail;
        if (ckRetail) {
          const ckPrice = inv.finish === 'etched'
            ? (ckRetail.etched || ckRetail.foil || ckRetail.normal)
            : inv.finish === 'foil'
              ? (ckRetail.foil || ckRetail.normal)
              : ckRetail.normal;
          if (ckPrice && ckPrice > 0) {
            const isUB = await isUBSet(card.setCode);
            unitPrice = isUB
              ? await calculateUBPrice(ckPrice)
              : await calculateRegularPrice(ckPrice);
          }
        }
        // Final fallback to stored sellPrice
        if (unitPrice === 0) unitPrice = inv.sellPrice || 0;
      }

      resolvedItems.push({
        cardId: card._id,
        cardName: card.name,
        setCode: card.setCode,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        imageUrl: card.imageUrl || '',
        condition: inv.condition,
        finish: inv.finish,
        inventoryIndex,
        quantity,
        pricePerUnit: unitPrice,
        subtotal: unitPrice * quantity,
        sellerId: inv.sellerId,
        sellerName: inv.sellerName || inv.sellerId,
      });

      cardUpdates.push({ card, idx: inventoryIndex, qty: quantity });
    }

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Derive root seller info from items
    const uniqueSellerIds = [...new Set(resolvedItems.map(i => i.sellerId))];
    const primarySellerId = uniqueSellerIds[0] || '';
    const primarySellerName = resolvedItems.find(i => i.sellerId === primarySellerId)?.sellerName || '';
    const sellerSummary = [...new Set(resolvedItems.map(i => i.sellerName))].join(', ');

    // Decrement inventory
    for (const { card, idx, qty } of cardUpdates) {
      card.inventory[idx].quantityForSale -= qty;
      card.inventory[idx].quantityOwned -= qty;
      await card.save();
    }

    // Create the sale record
    const sale = new OfflineSale({
      sellerId: uniqueSellerIds.length === 1 ? primarySellerId : 'multiple',
      sellerName: uniqueSellerIds.length === 1 ? primarySellerName : 'Multiple Sellers',
      sellerSummary,
      customerName: customerName || undefined,
      items: resolvedItems,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || undefined,
      status: 'completed',
    });

    await sale.save();

    res.status(201).json({ success: true, sale });
  } catch (error: any) {
    console.error('Create offline sale error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/offline-sales/:id/void
 * Void a completed sale and restore inventory
 */
router.post('/:id/void', async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await OfflineSale.findById(req.params.id);
    if (!sale) {
      res.status(404).json({ success: false, error: 'Sale not found' });
      return;
    }
    if (sale.status === 'voided') {
      res.status(400).json({ success: false, error: 'Sale is already voided' });
      return;
    }

    // Restore inventory for each item
    for (const item of sale.items) {
      const card = await Card.findById(item.cardId);
      if (card) {
        const inv = card.inventory[item.inventoryIndex];
        if (inv) {
          inv.quantityForSale += item.quantity;
          inv.quantityOwned += item.quantity;
          await card.save();
        }
      }
    }

    sale.status = 'voided';
    await sale.save();

    res.json({ success: true, message: 'Sale voided and inventory restored', sale });
  } catch (error: any) {
    console.error('Void offline sale error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
