import api from './client';

export interface BoardGame {
  _id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  available: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardGameListResponse {
  games: BoardGame[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BoardGameFilters {
  q?: string;
  category?: string;
  difficulty?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminBoardGameFilters {
  q?: string;
  page?: number;
  limit?: number;
}

export const boardgameApi = {
  getAll: async (filters?: BoardGameFilters): Promise<BoardGameListResponse> => {
    const res = await api.get<BoardGameListResponse>('/boardgames', { params: filters });
    return res.data;
  },

  adminGetAll: async (filters?: AdminBoardGameFilters): Promise<BoardGameListResponse> => {
    const res = await api.get<BoardGameListResponse>('/admin/boardgames', { params: filters });
    return res.data;
  },

  create: async (data: Partial<BoardGame>): Promise<BoardGame> => {
    const res = await api.post<{ game: BoardGame; message: string }>('/admin/boardgames', data);
    return res.data.game;
  },

  update: async (id: string, data: Partial<BoardGame>): Promise<BoardGame> => {
    const res = await api.put<{ game: BoardGame; message: string }>(`/admin/boardgames/${id}`, data);
    return res.data.game;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/boardgames/${id}`);
  },

  permanentDelete: async (id: string): Promise<void> => {
    await api.delete(`/admin/boardgames/${id}/permanent`);
  },
};
