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
 * Calculate sell price for regular (non-UB) cards based on CK price using tiered multipliers
 * Finds the appropriate tier based on price thresholds and applies the multiplier
 */
export const calculateRegularPrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getRegularMultiplier(ckPriceUSD);
  return ckPriceUSD * multiplier;
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
