import RegularSettings from '../models/RegularSettings.model';
import { IPriceTier } from '../models/RegularSettings.model';

/**
 * Get Regular settings from database (cached for performance)
 */
let cachedSettings: { priceTiers: IPriceTier[] } | null = null;

const getRegularSettings = async () => {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  let settings = await RegularSettings.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    settings = await RegularSettings.create({
      priceTiers: [
        { maxPrice: 5, multiplier: 20000 },
        { maxPrice: 999999, multiplier: 15000 }
      ],
    });
  }
  
  // Sort price tiers by maxPrice ascending for correct matching
  const sortedTiers = [...settings.priceTiers].sort((a, b) => a.maxPrice - b.maxPrice);
  
  cachedSettings = {
    priceTiers: sortedTiers,
  };
  
  return cachedSettings;
};

/**
 * Clear cached settings (call this when settings are updated)
 */
export const clearRegularSettingsCache = () => {
  cachedSettings = null;
};

/**
 * Round price up to nearest 500
 * Always rounds UP unless already at a multiple of 500
 * Example: 7595 -> 8000, 7500 -> 7500
 */
const roundToNearest500 = (price: number): number => {
  const remainder = price % 500;
  if (remainder === 0) {
    console.log(`[PRICING] roundToNearest500(${price}) = ${price} (already multiple of 500)`);
    return price; // Already a multiple of 500
  }
  const rounded = Math.ceil(price / 500) * 500;
  console.log(`[PRICING] roundToNearest500(${price}) = ${rounded} (remainder: ${remainder})`);
  return rounded;
};

/**
 * Calculate sell price for regular (non-UB) cards based on CK price using tiered multipliers
 * Finds the appropriate tier based on price thresholds and applies the multiplier
 * Result is rounded up to nearest 500
 */
export const calculateRegularPrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getRegularMultiplier(ckPriceUSD);
  const rawPrice = ckPriceUSD * multiplier;
  const roundedPrice = roundToNearest500(rawPrice);
  console.log(`[PRICING] calculateRegularPrice: CK=${ckPriceUSD} USD, multiplier=${multiplier}, raw=${rawPrice}, rounded=${roundedPrice}`);
  return roundedPrice;
};

/**
 * Calculate marketplace price (TikTok/Tokopedia) with 19% fee included
 * Formula: (CK price × multiplier) / 0.8403 → round to 500
 */
export const calculateRegularMarketplacePrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getRegularMultiplier(ckPriceUSD);
  const rawPrice = ckPriceUSD * multiplier;
  const marketplaceRaw = rawPrice / 0.8403; // Add 19% fee
  const roundedPrice = roundToNearest500(marketplaceRaw);
  console.log(`[PRICING] calculateRegularMarketplacePrice: CK=${ckPriceUSD} USD, multiplier=${multiplier}, raw=${rawPrice}, marketplace_raw=${marketplaceRaw}, rounded=${roundedPrice}`);
  return roundedPrice;
};

/**
 * Get the multiplier for a given CK price based on price tiers
 * Returns the multiplier from the first tier where ckPriceUSD <= maxPrice
 */
export const getRegularMultiplier = async (ckPriceUSD: number): Promise<number> => {
  const settings = await getRegularSettings();
  
  // Find the first tier where price is <= maxPrice (tiers are sorted ascending)
  for (const tier of settings.priceTiers) {
    if (ckPriceUSD <= tier.maxPrice) {
      return tier.multiplier;
    }
  }
  
  // Fallback to last tier if no match (shouldn't happen with proper setup)
  return settings.priceTiers[settings.priceTiers.length - 1]?.multiplier || 15000;
};
