import { Router, Request, Response } from 'express';
import Card from '../models/Card.model';
import User from '../models/User.model';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Search cards for debugging
router.get('/search', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, error: 'Search query required' });
      return;
    }

    const cards = await Card.find({
      name: { $regex: q, $options: 'i' }
    }).limit(20).select('_id name setCode collectorNumber');

    res.json({
      success: true,
      data: cards
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detailed card inventory information
router.get('/card/:cardId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    
    const card = await Card.findById(cardId);
    
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    // Get all unique seller IDs
    const sellerIds = [...new Set(
      card.inventory
        .filter(inv => inv.sellerId)
        .map(inv => inv.sellerId!.toString())
    )];

    // Fetch seller information
    const sellers = await User.find({ _id: { $in: sellerIds } }).select('_id email name role');
    const sellerMap = new Map(sellers.map(s => [s._id.toString(), s]));

    // Process inventory with seller details
    const inventoryDetails = card.inventory.map((inv, index) => {
      const sellerId = inv.sellerId?.toString();
      const seller = sellerId ? sellerMap.get(sellerId) : null;
      
      const detail = {
        inventoryIndex: index,
        condition: inv.condition,
        finish: inv.finish,
        quantityOwned: inv.quantityOwned,
        quantityForSale: inv.quantityForSale,
        quantityOwned_type: typeof inv.quantityOwned,
        quantityForSale_type: typeof inv.quantityForSale,
        quantityOwned_isNaN: isNaN(inv.quantityOwned as any),
        quantityForSale_isNaN: isNaN(inv.quantityForSale as any),
        buyPrice: inv.buyPrice,
        sellPrice: inv.sellPrice,
        sellerSku: inv.sellerSku,
        sellerId: sellerId || null,
        sellerName: inv.sellerName || null,
        sellerEmail: seller?.email || null,
        sellerActualName: seller?.name || null,
        sellerRole: seller?.role || null,
        tiktokProductId: inv.tiktokProductId,
        tiktokSkuId: inv.tiktokSkuId
      };

      return detail;
    });

    res.json({
      success: true,
      data: {
        card: {
          _id: card._id,
          name: card.name,
          setCode: card.setCode,
          setName: card.setName,
          collectorNumber: card.collectorNumber,
          rarity: card.rarity,
          language: card.language,
          imageUrl: card.imageUrl
        },
        totalInventoryItems: card.inventory.length,
        inventory: inventoryDetails,
        sellers: sellers.map(s => ({
          id: s._id,
          email: s.email,
          name: s.name,
          role: s.role
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
