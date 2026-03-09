import api from './client';
import { Card } from '../types';

export const wishlistApi = {
  getWishlist: async (): Promise<Card[]> => {
    const res = await api.get('/wishlist');
    return res.data.cards;
  },

  addToWishlist: async (cardId: string): Promise<void> => {
    await api.post(`/wishlist/${cardId}`);
  },

  removeFromWishlist: async (cardId: string): Promise<void> => {
    await api.delete(`/wishlist/${cardId}`);
  },

  subscribeStockNotify: async (cardId: string): Promise<void> => {
    await api.post(`/wishlist/stock-notify/${cardId}`);
  },

  unsubscribeStockNotify: async (cardId: string): Promise<void> => {
    await api.delete(`/wishlist/stock-notify/${cardId}`);
  },

  checkStockNotify: async (cardId: string): Promise<boolean> => {
    const res = await api.get(`/wishlist/stock-notify/${cardId}`);
    return res.data.subscribed;
  },
};
