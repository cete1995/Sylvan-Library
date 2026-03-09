import api from './client';

export interface Seller {
  _id: string;
  email: string;
  name?: string;
  role: 'seller';
  createdAt: string;
  updatedAt: string;
}

export const sellerApi = {
  // Get all sellers
  getSellers: async (): Promise<{ sellers: Seller[] }> => {
    const response = await api.get('/admin/sellers');
    return response.data;
  },

  // Create a new seller
  createSeller: async (data: { email: string; password: string; name?: string }): Promise<{ seller: Seller }> => {
    const response = await api.post('/admin/sellers', data);
    return response.data;
  },

  // Delete a seller
  deleteSeller: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/sellers/${id}`);
    return response.data;
  },

  // Update seller info
  updateSeller: async (id: string, data: { email?: string; name?: string }): Promise<{ seller: Seller; message: string }> => {
    const response = await api.put(`/admin/sellers/${id}`, data);
    return response.data;
  },

  // Update seller password
  updateSellerPassword: async (id: string, password: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/sellers/${id}/password`, { password });
    return response.data;
  },

  // Delete all stock for a seller
  deleteSellerStock: async (id: string): Promise<{ message: string; totalRemoved: number; cardsUpdated: number }> => {
    const response = await api.delete(`/admin/sellers/${id}/stock`);
    return response.data;
  },
};
