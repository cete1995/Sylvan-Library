import api from './client';

export const priceApi = {
  // Import prices from MTGJson
  importPrices: async (_token?: string) => {
    const response = await api.post('/prices/import-prices', {}, { timeout: 60000 });
    return response.data;
  },

  // Get import status
  getImportStatus: async (_token?: string) => {
    const response = await api.get('/prices/import-status');
    return response.data;
  },

  // Get price history for a card
  getPriceHistory: async (_token?: string, uuid?: string, params?: { startDate?: string; endDate?: string; days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.days) queryParams.append('days', params.days.toString());
    const response = await api.get(`/prices/card-prices/${uuid}?${queryParams.toString()}`);
    return response.data;
  },

  // Get latest price for a card
  getLatestPrice: async (_token?: string, uuid?: string) => {
    const response = await api.get(`/prices/card-price/${uuid}/latest`);
    return response.data;
  },
};
