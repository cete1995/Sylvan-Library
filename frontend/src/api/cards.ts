import api from './client';
import { Card, CardListResponse, CardSearchParams, SetInfo } from '../types';

export interface CardGroup {
  _id: string;
  name: string;
  imageUrl?: string;
  printingCount: number;
  minSellPrice: number | null;
  totalStock: number;
  hasFoil: boolean;
  cardIds: string[];
}

export interface GroupedCardsResponse {
  groups: CardGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const cardApi = {
  getCards: async (params: CardSearchParams): Promise<CardListResponse> => {
    const response = await api.get<CardListResponse>('/cards', { params });
    return response.data;
  },

  getGroupedCards: async (params: { q?: string; instock?: string; page?: number; limit?: number }): Promise<GroupedCardsResponse> => {
    const response = await api.get<GroupedCardsResponse>('/cards/grouped', { params });
    return response.data;
  },

  getCardById: async (id: string): Promise<{ card: Card; calculatedPrices?: any }> => {
    const response = await api.get<{ card: Card }>(`/cards/${id}`);
    return response.data;
  },

  getSets: async (): Promise<{ sets: SetInfo[] }> => {
    const response = await api.get<{ sets: SetInfo[] }>('/cards/sets/list');
    return response.data;
  },

  addInventory: async (
    cardId: string,
    data: {
      condition: 'NM' | 'LP' | 'P';
      finish: 'nonfoil' | 'foil';
      quantity: number;
      quantityForSale: number;
    }
  ): Promise<{ message: string; card: Card }> => {
    const response = await api.post<{ message: string; card: Card }>(
      `/cards/${cardId}/inventory`,
      data
    );
    return response.data;
  },
};
