import { Request, Response, Router } from 'express';
import { Card } from '../models';
import CardPrice from '../models/CardPrice';
import UBSettings from '../models/UBSettings.model';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { isUBSet, calculateUBPrice, clearUBSettingsCache } from '../utils/ubPricing';

const router = Router();

/**
 * Get UB settings
 * GET /api/admin/ub-settings
 */
router.get('/ub-settings', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    let settings = await UBSettings.findOne();
    
    // Create default if none exist
    if (!settings) {
      settings = await UBSettings.create({
        ubSets: [
          "40K", "BOT", "LTR", "LTC", "WHO", "REX", "PIP", "ACR", 
          "FIN", "FCA", "FIC", "MAR", "SPE", "SPM", "TLA", "TLE", 
          "PZA", "TMC", "TMT"
        ],
        priceTiers: [
          { maxPrice: 5, multiplier: 20000 },
          { maxPrice: 999999, multiplier: 15000 }
        ],
      });
    }

    res.json({
      success: true,
      settings: {
        ubSets: settings.ubSets,
        priceTiers: settings.priceTiers,
      }
    });
    return;
  } catch (error: any) {
    console.error('Get UB settings error:', error);
    res.status(500).json({
      error: 'Failed to get UB settings',
      message: error.message
    });
    return;
  }
});

/**
 * Update UB price tiers
 * PUT /api/admin/ub-settings/price-tiers
 */
router.put('/ub-settings/price-tiers', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { priceTiers } = req.body;

    if (!priceTiers || !Array.isArray(priceTiers)) {
      return res.status(400).json({ error: 'Price tiers array is required' });
    }

    // Validate each tier
    for (const tier of priceTiers) {
      if (!tier.maxPrice || !tier.multiplier) {
        return res.status(400).json({ error: 'Each tier must have maxPrice and multiplier' });
      }
      if (tier.maxPrice <= 0 || tier.multiplier <= 0) {
        return res.status(400).json({ error: 'maxPrice and multiplier must be positive numbers' });
      }
    }

    // Sort tiers by maxPrice ascending
    const sortedTiers = priceTiers.sort((a: any, b: any) => a.maxPrice - b.maxPrice);

    let settings = await UBSettings.findOne();
    if (!settings) {
      settings = await UBSettings.create({
        ubSets: [],
        priceTiers: sortedTiers,
      });
    } else {
      settings.priceTiers = sortedTiers;
      await settings.save();
    }

    clearUBSettingsCache();

    res.json({
      success: true,
      message: 'Price tiers updated successfully',
      settings: {
        priceTiers: settings.priceTiers,
      }
    });
    return;
  } catch (error: any) {
    console.error('Update price tiers error:', error);
    res.status(500).json({
      error: 'Failed to update price tiers',
      message: error.message
    });
    return;
  }
});

/**
 * Add UB set code
 * POST /api/admin/ub-settings/sets
 */
router.post('/ub-settings/sets', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { setCode } = req.body;

    if (!setCode || typeof setCode !== 'string') {
      return res.status(400).json({ error: 'Set code is required' });
    }

    const upperSetCode = setCode.toUpperCase().trim();
    if (!upperSetCode) {
      return res.status(400).json({ error: 'Set code cannot be empty' });
    }

    let settings = await UBSettings.findOne();
    if (!settings) {
      settings = await UBSettings.create({
        ubSets: [upperSetCode],
        priceTiers: [
          { maxPrice: 5, multiplier: 20000 },
          { maxPrice: 999999, multiplier: 15000 }
        ],
      });
    } else {
      if (settings.ubSets.includes(upperSetCode)) {
        return res.status(400).json({ error: 'Set code already exists' });
      }
      settings.ubSets.push(upperSetCode);
      await settings.save();
    }

    clearUBSettingsCache();

    res.json({
      success: true,
      message: `Set code ${upperSetCode} added successfully`,
      ubSets: settings.ubSets
    });
    return;
  } catch (error: any) {
    console.error('Add UB set error:', error);
    res.status(500).json({
      error: 'Failed to add UB set',
      message: error.message
    });
    return;
  }
});

/**
 * Remove UB set code
 * DELETE /api/admin/ub-settings/sets/:setCode
 */
router.delete('/ub-settings/sets/:setCode', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { setCode } = req.params;
    const upperSetCode = setCode.toUpperCase().trim();

    let settings = await UBSettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'UB settings not found' });
    }

    const initialLength = settings.ubSets.length;
    settings.ubSets = settings.ubSets.filter(code => code !== upperSetCode);

    if (settings.ubSets.length === initialLength) {
      return res.status(404).json({ error: 'Set code not found' });
    }

    await settings.save();
    clearUBSettingsCache();

    res.json({
      success: true,
      message: `Set code ${upperSetCode} removed successfully`,
      ubSets: settings.ubSets
    });
    return;
  } catch (error: any) {
    console.error('Remove UB set error:', error);
    res.status(500).json({
      error: 'Failed to remove UB set',
      message: error.message
    });
    return;
  }
});

/**
 * Sync UB card prices from CardKingdom prices
 * POST /api/admin/sync-ub-prices
 */
router.post('/sync-ub-prices', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { setCode, cardId } = req.body;

    let cardsToUpdate: any[] = [];

    // If specific card ID provided
    if (cardId) {
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      cardsToUpdate = [card];
    }
    // If specific set provided
    else if (setCode) {
      const upperSetCode = setCode.toUpperCase();
      if (!(await isUBSet(upperSetCode))) {
        return res.status(400).json({ error: `${upperSetCode} is not a UB set` });
      }
      cardsToUpdate = await Card.find({ setCode: upperSetCode, isActive: true });
    }
    // Otherwise sync all UB sets
    else {
      const settings = await UBSettings.findOne();
      const ubSetCodes = settings?.ubSets || [];
      cardsToUpdate = await Card.find({ 
        setCode: { $in: ubSetCodes },
        isActive: true 
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const card of cardsToUpdate) {
      try {
        const cardIdentifier = `${card.name} (${card.setCode} #${card.collectorNumber})`;
        
        // Skip if not a UB set (shouldn't happen but safety check)
        if (!(await isUBSet(card.setCode))) {
          skippedCount++;
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

        // Update inventory prices based on CK prices
        for (const item of card.inventory) {
          let ckPrice: number | undefined;

          // Get CK price based on finish (etched uses foil price, falls back to normal)
          if (item.finish === 'foil' || item.finish === 'etched') {
            ckPrice = ckPrices.foil || ckPrices.normal;
          } else {
            ckPrice = ckPrices.normal;
          }

          if (ckPrice && ckPrice > 0) {
            // Calculate UB price
            const newSellPrice = await calculateUBPrice(ckPrice);
            
            // Always update if sellPrice is 0 or different (round to 2 decimals for comparison)
            const currentPrice = Math.round(item.sellPrice * 100) / 100;
            const calculatedPrice = Math.round(newSellPrice * 100) / 100;
            
            if (item.sellPrice === 0 || Math.abs(currentPrice - calculatedPrice) > 0.01) {
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
      message: `UB price sync completed`,
      stats: {
        total: cardsToUpdate.length,
        updated: updatedCount,
        skipped: skippedCount,
      },
      errors: errors.slice(0, 20), // Return first 20 errors
    });
    return;

  } catch (error: any) {
    console.error('UB price sync error:', error);
    res.status(500).json({
      error: 'Failed to sync UB prices',
      message: error.message
    });
    return;
  }
});

/**
 * Calculate UB price for a card based on CK price
 * POST /api/admin/calculate-ub-price
 */
router.post('/calculate-ub-price', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { cardId, finish } = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (!(await isUBSet(card.setCode))) {
      return res.status(400).json({ 
        error: `${card.setCode} is not a UB set`,
        isUBSet: false 
      });
    }

    if (!card.uuid) {
      return res.status(400).json({ error: 'Card has no UUID' });
    }

    const latestPrice = await CardPrice.findOne({ uuid: card.uuid })
      .sort({ date: -1 })
      .lean();

    if (!latestPrice || !latestPrice.prices?.cardkingdom?.retail) {
      return res.status(404).json({ error: 'No CK price data available' });
    }

    const ckPrices = latestPrice.prices.cardkingdom.retail;
    const ckPrice = finish === 'foil' || finish === 'etched'
      ? (ckPrices.foil || ckPrices.normal)
      : ckPrices.normal;

    if (!ckPrice) {
      return res.status(404).json({ error: `No CK ${finish} price available` });
    }

    const ubPrice = await calculateUBPrice(ckPrice);
    const settings = await UBSettings.findOne();
    const multiplier = ckPrice < 5 ? (settings?.multiplierUnder5 || 20000) : (settings?.multiplier5AndAbove || 15000);

    res.json({
      success: true,
      isUBSet: true,
      ckPrice,
      ubPrice,
      multiplier,
      finish
    });
    return;

  } catch (error: any) {
    console.error('Calculate UB price error:', error);
    res.status(500).json({
      error: 'Failed to calculate UB price',
      message: error.message
    });
    return;
  }
});

export default router;

