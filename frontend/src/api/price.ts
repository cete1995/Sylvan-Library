import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const priceApi = {
  // Import prices from MTGJson
  importPrices: async (token: string) => {
    const response = await axios.post(
      `${API_URL}/prices/import-prices`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000 // 60 seconds timeout (endpoint returns immediately, but add buffer)
      }
    );
    return response.data;
  },

  // Get import status
  getImportStatus: async (token: string) => {
    const response = await axios.get(
      `${API_URL}/prices/import-status`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Get price history for a card
  getPriceHistory: async (token: string, uuid: string, params?: { startDate?: string; endDate?: string; days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.days) queryParams.append('days', params.days.toString());

    const response = await axios.get(
      `${API_URL}/prices/card-prices/${uuid}?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  // Get latest price for a card
  getLatestPrice: async (token: string, uuid: string) => {
    const response = await axios.get(
      `${API_URL}/prices/card-price/${uuid}/latest`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },
};
