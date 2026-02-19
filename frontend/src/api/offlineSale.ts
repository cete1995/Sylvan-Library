import api from './client';

export interface OfflineSaleItem {
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
  sellerId: string;
  sellerName: string;
}

export interface OfflineSale {
  _id: string;
  saleNumber: string;
  sellerId: string;
  sellerName: string;
  sellerSummary: string;
  customerName?: string;
  items: OfflineSaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'other';
  notes?: string;
  status: 'completed' | 'voided';
  createdAt: string;
  updatedAt: string;
}

export interface SearchedCard {
  _id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  inventory: Array<{
    condition: string;
    finish: string;
    quantityForSale: number;
    quantityOwned: number;
    sellPrice: number;
    inventoryIndex: number;
    sellerId: string;
    sellerName: string;
  }>;
}

export interface CreateOfflineSalePayload {
  customerName?: string;
  paymentMethod: 'cash' | 'transfer' | 'other';
  notes?: string;
  items: Array<{
    cardId: string;
    inventoryIndex: number;
    quantity: number;
    pricePerUnit: number;
  }>;
}

export const offlineSaleApi = {
  searchCards: async (q: string): Promise<{ cards: SearchedCard[] }> => {
    const response = await api.get('/admin/offline-sales/search-cards', {
      params: { q },
    });
    return response.data;
  },

  listSales: async (params?: {
    sellerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    sales: OfflineSale[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const response = await api.get('/admin/offline-sales', { params });
    return response.data;
  },

  getSale: async (id: string): Promise<{ sale: OfflineSale }> => {
    const response = await api.get(`/admin/offline-sales/${id}`);
    return response.data;
  },

  createSale: async (
    payload: CreateOfflineSalePayload
  ): Promise<{ success: boolean; sale: OfflineSale }> => {
    const response = await api.post('/admin/offline-sales', payload);
    return response.data;
  },

  voidSale: async (id: string): Promise<{ success: boolean; sale: OfflineSale }> => {
    const response = await api.post(`/admin/offline-sales/${id}/void`);
    return response.data;
  },
};
