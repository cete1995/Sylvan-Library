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
 * Calculate sell price for UB set cards based on CK price using tiered multipliers
 * Finds the appropriate tier based on price thresholds and applies the multiplier
 */
export const calculateUBPrice = async (ckPriceUSD: number): Promise<number> => {
  const multiplier = await getUBMultiplier(ckPriceUSD);
  return ckPriceUSD * multiplier;
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
