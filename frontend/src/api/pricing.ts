import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const pricingApi = {
  /**
   * Sync all card prices (UB and Regular sets)
   */
  syncAllPrices: async (token: string) => {
    const response = await axios.post(
      `${API_URL}/admin/pricing/sync-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Force resync ALL prices — ignores stock level, overwrites every card that has CK data.
   * Use when a new set was imported with zero stock and prices never got calculated.
   */
  forceResyncAllPrices: async (token: string) => {
    const response = await axios.post(
      `${API_URL}/admin/pricing/force-resync-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 300000, // 5 min timeout for large catalogs
      }
    );
    return response.data;
  },
};
