import UBSettings from '../models/UBSettings.model';

/**
 * Get UB settings from database (cached for performance)
 */
let cachedSettings: { ubSets: Set<string>; multiplierUnder5: number; multiplier5AndAbove: number } | null = null;

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
      multiplierUnder5: 20000,
      multiplier5AndAbove: 15000,
    });
  }
  
  cachedSettings = {
    ubSets: new Set(settings.ubSets),
    multiplierUnder5: settings.multiplierUnder5,
    multiplier5AndAbove: settings.multiplier5AndAbove,
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
 * Calculate sell price for UB set cards based on CK price
 * - If CK price < $5: multiply by multiplierUnder5
 * - If CK price >= $5: multiply by multiplier5AndAbove
 */
export const calculateUBPrice = async (ckPriceUSD: number): Promise<number> => {
  const settings = await getUBSettings();
  if (ckPriceUSD < 5) {
    return ckPriceUSD * settings.multiplierUnder5;
  } else {
    return ckPriceUSD * settings.multiplier5AndAbove;
  }
};

/**
 * Get the multiplier for a given CK price
 */
export const getUBMultiplier = async (ckPriceUSD: number): Promise<number> => {
  const settings = await getUBSettings();
  return ckPriceUSD < 5 ? settings.multiplierUnder5 : settings.multiplier5AndAbove;
};
