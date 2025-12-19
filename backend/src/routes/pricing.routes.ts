import { Request, Response, Router } from 'express';
import { Card } from '../models';
import CardPrice from '../models/CardPrice';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { isUBSet, calculateUBPrice } from '../utils/ubPricing';
import { calculateRegularPrice } from '../utils/regularPricing';

const router = Router();

/**
 * Sync all card prices (both UB and Regular sets)
 * POST /api/admin/pricing/sync-all
 */
router.post('/sync-all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get all active cards
    const cardsToUpdate = await Card.find({ isActive: true });

    let updatedCount = 0;
    let skippedCount = 0;
    let noInventoryCount = 0;
    const errors: string[] = [];

    for (const card of cardsToUpdate) {
      try {
        const cardIdentifier = `${card.name} (${card.setCode} #${card.collectorNumber})`;
        
        // Skip cards with no inventory (catalog-only cards)
        if (!card.inventory || card.inventory.length === 0) {
          noInventoryCount++;
          continue;
        }
        
        // Get latest CK prices for this card
        if (!card.uuid) {
          skippedCount++;
          errors.push(`${cardIdentifier}: No UUID`);
          continue;
        }

        const latestPrice = await CardPrice.findOne({ uuid: card.uuid })
          .sort({ date: -1 })
          .lean();

        if (!latestPrice || !latestPrice.prices?.cardkingdom?.retail) {
          skippedCount++;
          errors.push(`${cardIdentifier}: No CK price data`);
          continue;
        }

        const ckPrices = latestPrice.prices.cardkingdom.retail;
        let updated = false;

        // Check if this is a UB set
        const isUB = await isUBSet(card.setCode);

        // Update inventory prices based on CK prices
        for (const item of card.inventory) {
          let ckPrice: number | undefined;

          // Get CK price based on finish
          if (item.finish === 'foil') {
            ckPrice = ckPrices.foil;
          } else {
            ckPrice = ckPrices.normal;
          }

          if (ckPrice && ckPrice > 0) {
            // Calculate price based on set type (UB or Regular)
            const newSellPrice = isUB 
              ? await calculateUBPrice(ckPrice)
              : await calculateRegularPrice(ckPrice);
            
            // Always update if sellPrice is 0 or different (round to 2 decimals for comparison)
            const currentPrice = Math.round((item.sellPrice || 0) * 100) / 100;
            const calculatedPrice = Math.round(newSellPrice * 100) / 100;
            
            if (!item.sellPrice || item.sellPrice === 0 || Math.abs(currentPrice - calculatedPrice) > 0.01) {
              item.sellPrice = calculatedPrice;
              updated = true;
            }
          }
        }

        if (updated) {
          await card.save();
          updatedCount++;
        } else {
          skippedCount++;
        }

      } catch (err: any) {
        const cardIdentifier = `${card.name} (${card.setCode} #${card.collectorNumber})`;
        errors.push(`${cardIdentifier}: ${err.message}`);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: 'Price sync completed',
      updated: updatedCount,
      skipped: skippedCount,
      noInventory: noInventoryCount,
      total: cardsToUpdate.length,
      errors: errors.slice(0, 20) // Return first 20 errors
    });
    return;
  } catch (error: any) {
    console.error('Sync all prices error:', error);
    res.status(500).json({
      error: 'Failed to sync prices',
      message: error.message
    });
    return;
  }
});

export default router;
