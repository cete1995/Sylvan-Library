import { Request, Response, Router } from 'express';
import RegularSettings from '../models/RegularSettings.model';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { clearRegularSettingsCache } from '../utils/regularPricing';

const router = Router();

/**
 * Get Regular settings
 * GET /api/admin/regular-settings
 */
router.get('/regular-settings', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    let settings = await RegularSettings.findOne();
    
    // Create default if none exist
    if (!settings) {
      settings = await RegularSettings.create({
        priceTiers: [
          { maxPrice: 5, multiplier: 20000 },
          { maxPrice: 999999, multiplier: 15000 }
        ],
      });
    }

    res.json({
      success: true,
      settings: {
        priceTiers: settings.priceTiers,
      }
    });
    return;
  } catch (error: any) {
    console.error('Get Regular settings error:', error);
    res.status(500).json({
      error: 'Failed to get Regular settings',
      message: error.message
    });
    return;
  }
});

/**
 * Update Regular price tiers
 * PUT /api/admin/regular-settings/price-tiers
 */
router.put('/regular-settings/price-tiers', authenticate, requireAdmin, async (req: Request, res: Response) => {
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

    let settings = await RegularSettings.findOne();
    if (!settings) {
      settings = await RegularSettings.create({
        priceTiers: sortedTiers,
      });
    } else {
      settings.priceTiers = sortedTiers;
      await settings.save();
    }

    clearRegularSettingsCache();

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

export default router;
