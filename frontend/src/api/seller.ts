import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/sellers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Create a new seller
  createSeller: async (data: { email: string; password: string; name?: string }): Promise<{ seller: Seller }> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/admin/sellers`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Delete a seller
  deleteSeller: async (id: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/admin/sellers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update seller info
  updateSeller: async (id: string, data: { email?: string; name?: string }): Promise<{ seller: Seller; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/admin/sellers/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Update seller password
  updateSellerPassword: async (id: string, password: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/admin/sellers/${id}/password`,
      { password },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
