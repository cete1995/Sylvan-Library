import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const cartApi = {
  getCart: async () => {
    const response = await axios.get(`${API_URL}/cart`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  addToCart: async (cardId: string, inventoryIndex: number, quantity: number = 1) => {
    const response = await axios.post(
      `${API_URL}/cart`,
      { cardId, inventoryIndex, quantity },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await axios.put(
      `${API_URL}/cart/${itemId}`,
      { quantity },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  removeFromCart: async (itemId: string) => {
    const response = await axios.delete(`${API_URL}/cart/${itemId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  clearCart: async () => {
    const response = await axios.delete(`${API_URL}/cart`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
