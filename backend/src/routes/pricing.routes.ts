import { Request, Response, Router } from 'express';
import { Card } from '../models';
import CardPrice from '../models/CardPrice';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { isUBSet, calculateUBPrice, calculateUBMarketplacePrice } from '../utils/ubPricing';
import { calculateRegularPrice, calculateRegularMarketplacePrice, clearRegularSettingsCache } from '../utils/regularPricing';

const router = Router();

/**
 * Sync all card prices (both UB and Regular sets)
 * POST /api/admin/pricing/sync-all
 */
router.post('/sync-all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Clear cached settings to ensure we use latest pricing tiers
    clearRegularSettingsCache();
    console.log('🔄 Cleared pricing settings cache - will use fresh settings');
    
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
        
        // Check if any inventory has stock
        const hasStock = card.inventory.some(item => item.quantityOwned && item.quantityOwned > 0);
        if (!hasStock) {
          noInventoryCount++;
          continue;
        }
        
        // Try to get latest CK prices for this card (if UUID exists)
        let ckPrices: any = null;
        if (card.uuid) {
          const latestPrice = await CardPrice.findOne({ uuid: card.uuid })
            .sort({ date: -1 })
            .lean();

          if (latestPrice && latestPrice.prices?.cardkingdom?.retail) {
            ckPrices = latestPrice.prices.cardkingdom.retail;
          }
        }

        // Process card even if no CK prices - will keep existing prices for items without CK data
        let updated = false;

        // Check if this is a UB set
        const isUB = await isUBSet(card.setCode);
        console.log(`\n=== Processing ${cardIdentifier} ===`);
        console.log(`UUID: ${card.uuid || 'N/A'}`);
        console.log(`Is UB Set: ${isUB}`);
        console.log(`CK Prices:`, ckPrices || 'No CK data available (will keep existing prices)');

        // Update inventory prices based on CK prices
        for (const item of card.inventory) {
          // Skip inventory items with no stock
          if (!item.quantityOwned || item.quantityOwned === 0) {
            console.log(`  - ${item.condition}/${item.finish}: no stock (quantityOwned=${item.quantityOwned})`);
            continue;
          }
          
          // Skip if no CK price data available for this card
          if (!ckPrices) {
            console.log(`  - ${item.condition}/${item.finish}: No CK price data available, keeping existing price`);
            continue;
          }
          
          let ckPrice: number | undefined;

          // Get CK price based on finish
          if (item.finish === 'foil') {
            ckPrice = ckPrices.foil;
          } else {
            ckPrice = ckPrices.normal;
          }

          if (ckPrice && ckPrice > 0) {
            // Calculate both web and marketplace prices based on set type (UB or Regular)
            const newSellPrice = isUB 
              ? await calculateUBPrice(ckPrice)
              : await calculateRegularPrice(ckPrice);
              
            const newMarketplacePrice = isUB
              ? await calculateUBMarketplacePrice(ckPrice)
              : await calculateRegularMarketplacePrice(ckPrice);
            
            // Round to 2 decimals for comparison
            const currentPrice = Math.round((item.sellPrice || 0) * 100) / 100;
            const calculatedPrice = Math.round(newSellPrice * 100) / 100;
            const currentMarketplacePrice = Math.round((item.marketplacePrice || 0) * 100) / 100;
            const calculatedMarketplacePrice = Math.round(newMarketplacePrice * 100) / 100;
            
            console.log(`  - ${item.condition}/${item.finish}: CK=$${ckPrice.toFixed(2)} USD → web: Rp ${currentPrice} vs ${calculatedPrice}, marketplace: Rp ${currentMarketplacePrice} vs ${calculatedMarketplacePrice}`);
            console.log(`  - ${item.condition}/${item.finish}: CK=$${ckPrice.toFixed(2)} USD → web: Rp ${currentPrice} vs ${calculatedPrice}, marketplace: Rp ${currentMarketplacePrice} vs ${calculatedMarketplacePrice}`);
            
            // Update if either price is different
            const webPriceChanged = !item.sellPrice || item.sellPrice === 0 || Math.abs(currentPrice - calculatedPrice) > 0.01;
            const marketplacePriceChanged = !item.marketplacePrice || item.marketplacePrice === 0 || Math.abs(currentMarketplacePrice - calculatedMarketplacePrice) > 0.01;
            
            if (webPriceChanged || marketplacePriceChanged) {
              item.sellPrice = calculatedPrice;
              item.marketplacePrice = calculatedMarketplacePrice;
              updated = true;
              console.log(`    ✅ UPDATING - Web: Rp ${calculatedPrice}, Marketplace: Rp ${calculatedMarketplacePrice}`);
            } else {
              console.log(`    ⏭️  Already correct, no change`);
            }
          } else {
            console.log(`  - ${item.condition}/${item.finish}: No CK price for this finish`);
          }
        }

        if (updated) {
          await card.save();
          updatedCount++;
          console.log(`✅ Updated ${cardIdentifier}`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped ${cardIdentifier} - no changes needed`);
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
