import api from './client';
import { Card, CardFormData, CardListResponse, Stats } from '../types';

export const adminApi = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/admin/stats');
    return response.data;
  },

  getSets: async (): Promise<{ sets: Array<{ setCode: string; setName: string; cardCount: number }> }> => {
    const response = await api.get('/admin/sets');
    return response.data;
  },

  getAdminCards: async (params: {
    q?: string;
    set?: string;
    includeInactive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<CardListResponse> => {
    const response = await api.get<CardListResponse>('/admin/cards', {
      params: {
        ...params,
        includeInactive: params.includeInactive ? 'true' : 'false',
      },
    });
    return response.data;
  },

  createCard: async (data: CardFormData): Promise<{ card: Card; message: string }> => {
    const response = await api.post<{ card: Card; message: string }>('/admin/cards', data);
    return response.data;
  },

  updateCard: async (id: string, data: Partial<CardFormData>): Promise<{ card: Card; message: string }> => {
    const response = await api.put<{ card: Card; message: string }>(`/admin/cards/${id}`, data);
    return response.data;
  },

  deleteCard: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/admin/cards/${id}`);
    return response.data;
  },

  bulkUpload: async (file: File): Promise<{ imported: number; failed: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ imported: number; failed: number; errors: string[] }>(
      '/admin/cards/bulk-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  uploadSet: async (setData: any): Promise<{
    message: string;
    setCode: string;
    totalCards: number;
    imported: number;
    errors: number;
    errorDetails?: any[];
  }> => {
    const response = await api.post('/admin/sets/upload', setData);
    return response.data;
  },

  clearDatabase: async (): Promise<{ message: string; deletedCounts: { cards: number; users: number; carts: number; carousel: number; prices: number } }> => {
    const response = await api.post<{ message: string; deletedCounts: { cards: number; users: number; carts: number; carousel: number; prices: number } }>(
      '/admin/clear-database'
    );
    return response.data;
  },
};
