import UBSettings from '../models/UBSettings.model';
import { IPriceTier } from '../models/UBSettings.model';

/**
 * Get UB settings from database (cached for performance)
 */
let cachedSettings: { ubSets: Set<string>; priceTiers: IPriceTier[] } | null = null;

const getUBSettings = async () => {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  let settings = await UBSettings.findOne();
  
  // Create default settings if none exist
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
  
  // Sort price tiers by maxPrice ascending for correct matching
  const sortedTiers = [...settings.priceTiers].sort((a, b) => a.maxPrice - b.maxPrice);
  
  cachedSettings = {
    ubSets: new Set(settings.ubSets),
    priceTiers: sortedTiers,
  };
  
  return cachedSettings;
};

/**
 * Clear cached settings (call this when settings are updated)
 */
export const clearUBSettingsCache = () => {
  cachedSettings = null;
};

/**
 * Universe Beyond (UB) Sets
 * Cards from these sets have special pricing rules
 * @deprecated Use getUBSettings() instead for dynamic settings
 */
export const UB_SETS = new Set([
  "40K", "BOT", "LTR", "LTC", "WHO", "REX", "PIP", "ACR", 
  "FIN", "FCA", "FIC", "MAR", "SPE", "SPM", "TLA", "TLE", 
  "PZA", "TMC", "TMT"
]);

/**
 * Check if a set code is a Universe Beyond set
 */
export const isUBSet = async (setCode: string): Promise<boolean> => {
  const settings = await getUBSettings();
  return settings.ubSets.has(setCode.toUpperCase());
};

/**
 * Round price up to nearest 500
 * Always rounds UP unless already at a multiple of 500
 * Example: 7595 -> 8000, 7500 -> 7500
 */
const roundToNearest500 = (price: number): number => {
  const remainder = price % 500;
  if (remainder === 0) {
    return price; // Already a multiple of 500
  }
  return Math.ceil(price / 500) * 500;
};

/**
 * Calculate sell price for UB set cards based on CK price using tiered multipliers
 * Finds the appropriate tier based on price thresholds and applies the multiplier
 * Result is rounded up to nearest 500
 */
export const calculateUBPrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getUBMultiplier(ckPriceUSD);
  const rawPrice = ckPriceUSD * multiplier;
  return roundToNearest500(rawPrice);
};

/**
 * Calculate marketplace price for UB cards (TikTok/Tokopedia) with 19% fee included
 * Formula: (CK price × multiplier) / 0.8403 → round to 500
 */
export const calculateUBMarketplacePrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getUBMultiplier(ckPriceUSD);
  const rawPrice = ckPriceUSD * multiplier;
  const marketplaceRaw = rawPrice / 0.8403; // Add 19% fee
  return roundToNearest500(marketplaceRaw);
};

/**
 * Get the multiplier for a given CK price based on price tiers
 * Returns the multiplier from the first tier where ckPriceUSD <= maxPrice
 */
export const getUBMultiplier = async (ckPriceUSD: number): Promise<number> => {
  const settings = await getUBSettings();
  
  // Find the first tier where price is <= maxPrice (tiers are sorted ascending)
  for (const tier of settings.priceTiers) {
    if (ckPriceUSD <= tier.maxPrice) {
      return tier.multiplier;
    }
  }
  
  // Fallback to last tier if no match (shouldn't happen with proper setup)
  return settings.priceTiers[settings.priceTiers.length - 1]?.multiplier || 15000;
};
