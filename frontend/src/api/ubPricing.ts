import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ubPricingApi = {
  /**
   * Get UB settings
   */
  getUBSettings: async (token: string) => {
    const response = await axios.get(
      `${API_URL}/admin/ub-pricing/ub-settings`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Update UB multipliers
   */
  updateMultipliers: async (token: string, multiplierUnder5: number, multiplier5AndAbove: number) => {
    const response = await axios.put(
      `${API_URL}/admin/ub-pricing/ub-settings/multipliers`,
      { multiplierUnder5, multiplier5AndAbove },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Add UB set code
   */
  addUBSet: async (token: string, setCode: string) => {
    const response = await axios.post(
      `${API_URL}/admin/ub-pricing/ub-settings/sets`,
      { setCode },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Remove UB set code
   */
  removeUBSet: async (token: string, setCode: string) => {
    const response = await axios.delete(
      `${API_URL}/admin/ub-pricing/ub-settings/sets/${setCode}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Sync UB card prices from CardKingdom prices
   */
  syncUBPrices: async (token: string, params?: { setCode?: string; cardId?: string }) => {
    const response = await axios.post(
      `${API_URL}/admin/ub-pricing/sync-ub-prices`,
      params || {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Calculate UB price for a specific card and finish
   */
  calculateUBPrice: async (token: string, cardId: string, finish: string) => {
    const response = await axios.post(
      `${API_URL}/admin/ub-pricing/calculate-ub-price`,
      { cardId, finish },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },
};
