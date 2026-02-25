import api from './client';

export interface OfflineBuyItem {
  cardId: string;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  condition: string;
  finish: string;
  inventoryIndex: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  destinationSellerId: string;
  destinationSellerName: string;
}

export interface OfflineBuy {
  _id: string;
  buyNumber: string;
  memberName: string;
  memberId?: string;
  destinationSellerId: string;
  destinationSellerName: string;
  items: OfflineBuyItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'store-credit' | 'other';
  notes?: string;
  status: 'completed' | 'voided';
  createdAt: string;
  updatedAt: string;
}

export interface BuySearchedCard {
  _id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  rarity: string;
  ckBuyPrice: { normal: number; foil: number; etched: number };
}

export interface CreateOfflineBuyPayload {
  memberName: string;
  memberId?: string;
  destinationSellerId: string;
  destinationSellerName: string;
  paymentMethod: 'cash' | 'transfer' | 'store-credit' | 'other';
  notes?: string;
  items: Array<{
    cardId: string;
    condition: string;
    finish: string;
    quantity: number;
    pricePerUnit: number;
  }>;
}

export const offlineBuyApi = {
  searchCards: async (q: string): Promise<{ cards: BuySearchedCard[] }> => {
    const response = await api.get('/admin/offline-buys/search-cards', { params: { q } });
    return response.data;
  },

  listBuys: async (params?: {
    memberId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    buys: OfflineBuy[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const response = await api.get('/admin/offline-buys', { params });
    return response.data;
  },

  createBuy: async (
    payload: CreateOfflineBuyPayload
  ): Promise<{ success: boolean; buy: OfflineBuy }> => {
    const response = await api.post('/admin/offline-buys', payload);
    return response.data;
  },

  voidBuy: async (id: string): Promise<{ success: boolean; buy: OfflineBuy }> => {
    const response = await api.post(`/admin/offline-buys/${id}/void`);
    return response.data;
  },
};
