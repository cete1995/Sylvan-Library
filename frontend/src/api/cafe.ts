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

export interface CafeDayPrice {
  label: string;  // e.g. "Weekday (Mon–Thu)"
  price: string;  // e.g. "Rp 30.000"
}

export interface CafeConsole {
  enabled: boolean;
  name: string;
  icon: string;
  hourlyRate: string;
  happyHourStart: string;  // "17:00" — empty = no happy hour
  happyHourRate: string;
  happyHourNote: string;
  desc: string;
}

export interface CafeMahjong {
  tables: number;
  sessionPrice: string;
  pricing: CafeDayPrice[];
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
  boardgamePricing: CafeDayPrice[];
  hours: CafeHour[];
  mahjong: CafeMahjong;
  ps5: CafeConsole;
  nintendoSwitch: CafeConsole;
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
