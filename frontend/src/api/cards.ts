import api from './client';
import { Card, CardListResponse, CardSearchParams, SetInfo } from '../types';

export const cardApi = {
  getCards: async (params: CardSearchParams): Promise<CardListResponse> => {
    const response = await api.get<CardListResponse>('/cards', { params });
    return response.data;
  },

  getCardById: async (id: string): Promise<{ card: Card }> => {
    const response = await api.get<{ card: Card }>(`/cards/${id}`);
    return response.data;
  },

  getSets: async (): Promise<{ sets: SetInfo[] }> => {
    const response = await api.get<{ sets: SetInfo[] }>('/cards/sets/list');
    return response.data;
  },
};
