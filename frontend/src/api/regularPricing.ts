import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PriceTier {
  maxPrice: number;
  multiplier: number;
}

export interface RegularSettings {
  priceTiers: PriceTier[];
}

export const regularPricingApi = {
  /**
   * Get Regular settings
   */
  getRegularSettings: async (token: string) => {
    const response = await axios.get(
      `${API_URL}/admin/regular-pricing/regular-settings`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Update Regular price tiers
   */
  updatePriceTiers: async (token: string, priceTiers: PriceTier[]) => {
    const response = await axios.put(
      `${API_URL}/admin/regular-pricing/regular-settings/price-tiers`,
      { priceTiers },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },
};
