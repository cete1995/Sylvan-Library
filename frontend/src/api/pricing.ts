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
};
