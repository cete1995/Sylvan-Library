import api from './client';

export interface CafeHour {
  day: string;
  time: string;
  closed: boolean;
}

export interface CafeGame {
  name: string;
  players: string;
  duration: string;
  icon: string;
}

export interface CafeMahjong {
  tables: number;
  sessionPrice: string;
  desc: string;
}

export interface CafeSettings {
  _id?: string;
  name: string;
  tagline: string;
  address: string;
  mapUrl: string;
  whatsapp: string;
  instagram: string;
  entranceFee: string;
  entranceDesc: string;
  gameCount: string;
  hours: CafeHour[];
  mahjong: CafeMahjong;
  games: CafeGame[];
}

export const cafeApi = {
  getSettings: async (): Promise<CafeSettings> => {
    const res = await api.get('/cafe/settings');
    return res.data;
  },

  updateSettings: async (settings: Partial<CafeSettings>): Promise<{ success: boolean; settings: CafeSettings }> => {
    const res = await api.put('/admin/cafe/settings', settings);
    return res.data;
  },
};
