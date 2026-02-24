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
    clearRegularSettingsCache();
    console.log('🔄 Cleared pricing settings cache - will use fresh settings');

    const cardsToUpdate = await Card.find({ isActive: true });

    // ── Bulk-fetch latest CK prices for every UUID in one aggregation ──────────
    const allUuids = cardsToUpdate.map(c => c.uuid).filter((u): u is string => Boolean(u));
    const latestPriceDocs = await CardPrice.aggregate<{ _id: string; prices: any }>([
      { $match: { uuid: { $in: allUuids } } },
      { $sort: { date: -1 } },
      { $group: { _id: '$uuid', prices: { $first: '$prices' } } },
    ]);
    const priceMap = new Map<string, any>();
    for (const p of latestPriceDocs) {
      if (p.prices?.cardkingdom?.retail) priceMap.set(p._id, p.prices.cardkingdom.retail);
    }
    console.log(`📦 Loaded prices for ${priceMap.size} / ${allUuids.length} UUIDs`);

    let updatedCount = 0;
    let skippedCount = 0;
    let noInventoryCount = 0;
    const errors: string[] = [];
    const bulkOps: any[] = [];

    for (const card of cardsToUpdate) {
      try {
        const cardIdentifier = `${card.name} (${card.setCode} #${card.collectorNumber})`;

        if (!card.inventory || card.inventory.length === 0) { noInventoryCount++; continue; }
        const hasStock = card.inventory.some(item => item.quantityOwned && item.quantityOwned > 0);
        if (!hasStock) { noInventoryCount++; continue; }

        const ckPrices = card.uuid ? (priceMap.get(card.uuid) ?? null) : null;
        const isUB = await isUBSet(card.setCode);
        console.log(`\n=== Processing ${cardIdentifier} ===`);
        console.log(`UUID: ${card.uuid || 'N/A'} | UB: ${isUB} | CK:`, ckPrices || 'no data');

        let updated = false;
        for (const item of card.inventory) {
          if (!item.quantityOwned || item.quantityOwned === 0) {
            console.log(`  - ${item.condition}/${item.finish}: no stock`);
            continue;
          }
          if (!ckPrices) {
            console.log(`  - ${item.condition}/${item.finish}: no CK data, keeping existing price`);
            continue;
          }

          const ckPrice: number | undefined =
            item.finish === 'etched' ? (ckPrices.etched || ckPrices.foil || ckPrices.normal)
            : item.finish === 'foil'  ? (ckPrices.foil || ckPrices.normal)
            : ckPrices.normal;

          if (ckPrice && ckPrice > 0) {
            const newSellPrice        = isUB ? await calculateUBPrice(ckPrice)            : await calculateRegularPrice(ckPrice);
            const newMarketplacePrice = isUB ? await calculateUBMarketplacePrice(ckPrice) : await calculateRegularMarketplacePrice(ckPrice);

            const cur  = Math.round((item.sellPrice        || 0) * 100) / 100;
            const calc = Math.round(newSellPrice            * 100) / 100;
            const curM = Math.round((item.marketplacePrice || 0) * 100) / 100;
            const calM = Math.round(newMarketplacePrice     * 100) / 100;

            console.log(`  - ${item.condition}/${item.finish}: CK=$${ckPrice.toFixed(2)} → web: ${cur}→${calc}, mkt: ${curM}→${calM}`);

            if (!item.sellPrice || item.sellPrice === 0 || Math.abs(cur - calc) > 0.01 ||
                !item.marketplacePrice || item.marketplacePrice === 0 || Math.abs(curM - calM) > 0.01) {
              item.sellPrice = calc;
              item.marketplacePrice = calM;
              updated = true;
              console.log(`    ✅ UPDATED`);
            } else {
              console.log(`    ⏭️  No change`);
            }
          } else {
            console.log(`  - ${item.condition}/${item.finish}: no CK price for this finish`);
          }
        }

        if (updated) {
          bulkOps.push({ updateOne: { filter: { _id: card._id }, update: { $set: { inventory: card.inventory } } } });
          updatedCount++;
          console.log(`✅ Queued update for ${cardIdentifier}`);
        } else {
          skippedCount++;
        }
      } catch (err: any) {
        errors.push(`${card.name} (${card.setCode}): ${err.message}`);
        skippedCount++;
      }
    }

    // ── Flush all writes in one bulkWrite call ────────────────────────────────
    if (bulkOps.length > 0) {
      await Card.bulkWrite(bulkOps);
      console.log(`💾 bulkWrite flushed ${bulkOps.length} card updates`);
    }

    res.json({
      success: true,
      message: 'Price sync completed',
      updated: updatedCount,
      skipped: skippedCount,
      noInventory: noInventoryCount,
      total: cardsToUpdate.length,
      errors: errors.slice(0, 20),
    });
    return;
  } catch (error: any) {
    console.error('Sync all prices error:', error);
    res.status(500).json({ error: 'Failed to sync prices', message: error.message });
    return;
  }
});

/**
 * Force resync ALL card prices — no stock check, no skip.
 * Updates every active card that has a uuid and at least one inventory slot.
 * POST /api/admin/pricing/force-resync-all
 */
router.post('/force-resync-all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    clearRegularSettingsCache();

    const cardsToUpdate = await Card.find({ isActive: true, uuid: { $exists: true, $ne: '' } });

    // ── Bulk-fetch latest CK prices for every UUID in one aggregation ──────────
    const allUuids = cardsToUpdate.map(c => c.uuid).filter((u): u is string => Boolean(u));
    const latestPriceDocs = await CardPrice.aggregate<{ _id: string; prices: any }>([
      { $match: { uuid: { $in: allUuids } } },
      { $sort: { date: -1 } },
      { $group: { _id: '$uuid', prices: { $first: '$prices' } } },
    ]);
    const priceMap = new Map<string, any>();
    for (const p of latestPriceDocs) {
      if (p.prices?.cardkingdom?.retail) priceMap.set(p._id, p.prices.cardkingdom.retail);
    }
    console.log(`📦 [force-resync] Loaded prices for ${priceMap.size} / ${allUuids.length} UUIDs`);

    let updatedCount = 0;
    let skippedCount = 0;
    let noPriceCount = 0;
    const errors: string[] = [];
    const bulkOps: any[] = [];

    for (const card of cardsToUpdate) {
      try {
        if (!card.inventory || card.inventory.length === 0) {
          skippedCount++;
          continue;
        }

        const ckPrices = card.uuid ? (priceMap.get(card.uuid) ?? null) : null;
        if (!ckPrices) {
          noPriceCount++;
          continue;
        }

        const isUB = await isUBSet(card.setCode);
        let updated = false;

        for (const item of card.inventory) {
          const ckPrice = item.finish === 'etched'
            ? (ckPrices.etched || ckPrices.foil || ckPrices.normal)
            : item.finish === 'foil'
              ? (ckPrices.foil || ckPrices.normal)
              : ckPrices.normal;
          if (!ckPrice || ckPrice <= 0) continue;

          const newSellPrice = isUB
            ? await calculateUBPrice(ckPrice)
            : await calculateRegularPrice(ckPrice);

          const newMarketplacePrice = isUB
            ? await calculateUBMarketplacePrice(ckPrice)
            : await calculateRegularMarketplacePrice(ckPrice);

          item.sellPrice = Math.round(newSellPrice * 100) / 100;
          item.marketplacePrice = Math.round(newMarketplacePrice * 100) / 100;
          updated = true;
        }

        if (updated) {
          bulkOps.push({ updateOne: { filter: { _id: card._id }, update: { $set: { inventory: card.inventory } } } });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (err: any) {
        errors.push(`${card.name} (${card.setCode}): ${err.message}`);
        skippedCount++;
      }
    }

    // ── Flush all writes in one bulkWrite call ────────────────────────────────
    if (bulkOps.length > 0) {
      await Card.bulkWrite(bulkOps);
      console.log(`💾 [force-resync] bulkWrite flushed ${bulkOps.length} card updates`);
    }

    res.json({
      success: true,
      message: 'Force resync completed — all cards with CK data updated regardless of stock',
      updated: updatedCount,
      skipped: skippedCount,
      noPrice: noPriceCount,
      total: cardsToUpdate.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Force resync error:', error);
    res.status(500).json({ error: 'Failed to force resync prices', message: error.message });
  }
});

export default router;
