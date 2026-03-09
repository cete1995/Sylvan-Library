import api from './client';

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
  getRegularSettings: async (_token?: string) => {
    const response = await api.get('/admin/regular-pricing/regular-settings');
    return response.data;
  },

  /**
   * Update Regular price tiers
   */
  updatePriceTiers: async (_token?: string, priceTiers?: PriceTier[]) => {
    const response = await api.put('/admin/regular-pricing/regular-settings/price-tiers', { priceTiers });
    return response.data;
  },
};
