/**
 * Universe Beyond (UB) Sets
 * Cards from these sets have special pricing rules
 */
export const UB_SETS = new Set([
  "40K", "BOT", "LTR", "LTC", "WHO", "REX", "PIP", "ACR", 
  "FIN", "FCA", "FIC", "MAR", "SPE", "SPM", "TLA", "TLE", 
  "PZA", "TMC", "TMT"
]);

/**
 * Check if a set code is a Universe Beyond set
 */
export const isUBSet = (setCode: string): boolean => {
  return UB_SETS.has(setCode.toUpperCase());
};

/**
 * Calculate sell price for UB set cards based on CK price
 * - If CK price < $5: multiply by 20000
 * - If CK price >= $5: multiply by 15000
 */
export const calculateUBPrice = (ckPriceUSD: number): number => {
  if (ckPriceUSD < 5) {
    return ckPriceUSD * 20000;
  } else {
    return ckPriceUSD * 15000;
  }
};

/**
 * Get the multiplier for a given CK price
 */
export const getUBMultiplier = (ckPriceUSD: number): number => {
  return ckPriceUSD < 5 ? 20000 : 15000;
};
