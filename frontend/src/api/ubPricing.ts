import api from './client';

export interface PriceTier {
  maxPrice: number;
  multiplier: number;
}

export interface UBSettings {
  ubSets: string[];
  priceTiers: PriceTier[];
}

export const ubPricingApi = {
  getUBSettings: async (_token?: string) => {
    const response = await api.get('/admin/ub-pricing/ub-settings');
    return response.data;
  },

  updatePriceTiers: async (_token?: string, priceTiers?: PriceTier[]) => {
    const response = await api.put('/admin/ub-pricing/ub-settings/price-tiers', { priceTiers });
    return response.data;
  },

  addUBSet: async (_token?: string, setCode?: string) => {
    const response = await api.post('/admin/ub-pricing/ub-settings/sets', { setCode });
    return response.data;
  },

  removeUBSet: async (_token?: string, setCode?: string) => {
    const response = await api.delete(`/admin/ub-pricing/ub-settings/sets/${setCode}`);
    return response.data;
  },

  syncUBPrices: async (_token?: string, params?: { setCode?: string; cardId?: string }) => {
    const response = await api.post('/admin/ub-pricing/sync-ub-prices', params || {});
    return response.data;
  },

  calculateUBPrice: async (_token?: string, cardId?: string, finish?: string) => {
    const response = await api.post('/admin/ub-pricing/calculate-ub-price', { cardId, finish });
    return response.data;
  },
};
