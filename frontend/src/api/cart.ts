import api from './client';

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (cardId: string, inventoryIndex: number, quantity: number = 1) => {
    const response = await api.post('/cart', { cardId, inventoryIndex, quantity });
    return response.data;
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await api.put(`/cart/${itemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId: string) => {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};
