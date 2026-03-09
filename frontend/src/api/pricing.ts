import api from './client';

export const pricingApi = {
  /**
   * Sync all card prices (UB and Regular sets)
   */
  syncAllPrices: async (_token?: string) => {
    const response = await api.post('/admin/pricing/sync-all', {});
    return response.data;
  },

  /**
   * Force resync ALL prices — ignores stock level, overwrites every card that has CK data.
   * Use when a new set was imported with zero stock and prices never got calculated.
   */
  forceResyncAllPrices: async (_token?: string) => {
    const response = await api.post('/admin/pricing/force-resync-all', {}, { timeout: 300000 });
    return response.data;
  },
};
