import api from './client';
import { Card, CardListResponse, CardSearchParams, SetInfo } from '../types';

export const cardApi = {
  getCards: async (params: CardSearchParams): Promise<CardListResponse> => {
    const response = await api.get<CardListResponse>('/cards', { params });
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
