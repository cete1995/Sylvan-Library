import api from './client';

export interface BuylistItem {
  _id: string;
  cardName: string;
  setCode?: string;
  setName?: string;
  imageUrl?: string;
  condition: 'NM' | 'LP' | 'P';
  finish: 'nonfoil' | 'foil' | 'etched';
  buyPrice: number;
  isActive: boolean;
  notes?: string;
  sortOrder: number;
}

export interface BuylistResponse {
  items: BuylistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const buylistApi = {
  getPublic: async (params?: { q?: string; page?: number; limit?: number }): Promise<BuylistResponse> => {
    const response = await api.get<BuylistResponse>('/buylist', { params });
    return response.data;
  },

  getAll: async (params?: { q?: string; page?: number; limit?: number }): Promise<BuylistResponse> => {
    const response = await api.get<BuylistResponse>('/buylist/admin', { params });
    return response.data;
  },

  create: async (data: Omit<BuylistItem, '_id'>): Promise<{ item: BuylistItem }> => {
    const response = await api.post<{ item: BuylistItem }>('/buylist/admin', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<BuylistItem, '_id'>>): Promise<{ item: BuylistItem }> => {
    const response = await api.put<{ item: BuylistItem }>(`/buylist/admin/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/buylist/admin/${id}`);
    return response.data;
  },
};
