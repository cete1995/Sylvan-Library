import mongoose, { Document, Schema } from 'mongoose';

export interface ICafeHour {
  day: string;
  time: string;
  closed: boolean;
}

export interface ICafeGame {
  name: string;
  players: string;
  duration: string;
  icon: string;
}

/** One row in a day-based flat-fee pricing table */
export interface ICafeDayPrice {
  label: string;  // e.g. "Weekday (Mon–Thu)"
  price: string;  // e.g. "Rp 30.000"
}

/** PS5 / Nintendo Switch rental settings */
export interface ICafeConsole {
  enabled: boolean;
  name: string;
  icon: string;
  hourlyRate: string;       // e.g. "Rp 25.000 / jam"
  happyHourStart: string;   // "17:00" — empty = no happy hour
  happyHourRate: string;    // e.g. "Rp 15.000 / jam"
  happyHourNote: string;    // e.g. "Until closing time"
  desc: string;
}

export interface ICafeMahjong {
  tables: number;
  sessionPrice: string;       // fallback single-price string
  pricing: ICafeDayPrice[];   // day-based pricing rows
  desc: string;
}

export interface ICafeSettings extends Document {
  name: string;
  tagline: string;
  address: string;
  mapUrl: string;
  whatsapp: string;
  instagram: string;
  entranceFee: string;           // fallback single-price string
  entranceDesc: string;
  gameCount: string;
  boardgamePricing: ICafeDayPrice[];  // day-based boardgame pricing rows
  hours: ICafeHour[];
  mahjong: ICafeMahjong;
  ps5: ICafeConsole;
  nintendoSwitch: ICafeConsole;
  games: ICafeGame[];
  updatedAt: Date;
}

const cafeHourSchema = new Schema<ICafeHour>({
  day: { type: String, required: true },
  time: { type: String, default: '' },
  closed: { type: Boolean, default: false },
}, { _id: false });

const cafeGameSchema = new Schema<ICafeGame>({
  name: { type: String, required: true },
  players: { type: String, default: '' },
  duration: { type: String, default: '' },
  icon: { type: String, default: '🎲' },
}, { _id: false });

const cafeDayPriceSchema = new Schema<ICafeDayPrice>({
  label: { type: String, default: '' },
  price: { type: String, default: '' },
}, { _id: false });

const cafeConsoleSchema = new Schema<ICafeConsole>({
  enabled: { type: Boolean, default: false },
  name: { type: String, default: '' },
  icon: { type: String, default: '🎮' },
  hourlyRate: { type: String, default: '' },
  happyHourStart: { type: String, default: '' },
  happyHourRate: { type: String, default: '' },
  happyHourNote: { type: String, default: 'Until closing time' },
  desc: { type: String, default: '' },
}, { _id: false });

const cafeMahjongSchema = new Schema<ICafeMahjong>({
  tables: { type: Number, default: 4 },
  sessionPrice: { type: String, default: '' },
  pricing: { type: [cafeDayPriceSchema], default: [] },
  desc: { type: String, default: '' },
}, { _id: false });

const DEFAULT_HOURS: ICafeHour[] = [
  { day: 'Sunday', time: '10:00 – 22:00', closed: false },
  { day: 'Monday', time: '12:00 – 22:00', closed: false },
  { day: 'Tuesday', time: '12:00 – 22:00', closed: false },
  { day: 'Wednesday', time: '12:00 – 22:00', closed: false },
  { day: 'Thursday', time: '12:00 – 22:00', closed: false },
  { day: 'Friday', time: '12:00 – 23:00', closed: false },
  { day: 'Saturday', time: '10:00 – 23:00', closed: false },
];

const DEFAULT_GAMES: ICafeGame[] = [
  { name: 'Catan', players: '3–4', duration: '75 min', icon: '🏝️' },
  { name: 'Ticket to Ride', players: '2–5', duration: '60–90 min', icon: '🚂' },
  { name: 'Pandemic', players: '2–4', duration: '60 min', icon: '🦠' },
  { name: 'Codenames', players: '4–8', duration: '15–30 min', icon: '🔤' },
  { name: 'Dixit', players: '3–6', duration: '30 min', icon: '🎨' },
  { name: 'Azul', players: '2–4', duration: '45–75 min', icon: '🟦' },
  { name: 'Sushi Go!', players: '2–5', duration: '15 min', icon: '🍣' },
  { name: 'Root', players: '2–4', duration: '60–90 min', icon: '🌿' },
  { name: 'Splendor', players: '2–4', duration: '30 min', icon: '💎' },
  { name: 'Coup', players: '2–6', duration: '15 min', icon: '👑' },
  { name: 'Love Letter', players: '2–4', duration: '20 min', icon: '💌' },
  { name: '7 Wonders', players: '2–7', duration: '30 min', icon: '🏛️' },
];

const DEFAULT_PS5: ICafeConsole = {
  enabled: false, name: 'PS5', icon: '🎮',
  hourlyRate: '', happyHourStart: '', happyHourRate: '',
  happyHourNote: 'Until closing time', desc: '',
};

const DEFAULT_SWITCH: ICafeConsole = {
  enabled: false, name: 'Nintendo Switch', icon: '🕹️',
  hourlyRate: '', happyHourStart: '', happyHourRate: '',
  happyHourNote: 'Until closing time', desc: '',
};

const cafeSettingsSchema = new Schema<ICafeSettings>(
  {
    name: { type: String, default: 'Sylvan Library Boardgame Café' },
    tagline: { type: String, default: 'Play More. Stress Less.' },
    address: { type: String, default: '' },
    mapUrl: { type: String, default: 'https://maps.app.goo.gl/H4gDAqN4jY2ZfJM36' },
    whatsapp: { type: String, default: 'https://wa.me/6281333667147' },
    instagram: { type: String, default: 'https://instagram.com/sylvanlibrary' },
    entranceFee: { type: String, default: 'Rp 30.000' },
    entranceDesc: { type: String, default: 'Flat entry fee includes access to our full game library. No hourly charge.' },
    gameCount: { type: String, default: '100+' },
    boardgamePricing: { type: [cafeDayPriceSchema], default: [] },
    hours: { type: [cafeHourSchema], default: DEFAULT_HOURS },
    mahjong: {
      type: cafeMahjongSchema,
      default: {
        tables: 4,
        sessionPrice: 'Rp 20.000 / person / session',
        pricing: [],
        desc: 'Enjoy a classic game of Mahjong at our dedicated mahjong tables. Full sets provided — all tiles, dice, and trays included.',
      },
    },
    ps5: { type: cafeConsoleSchema, default: () => ({ ...DEFAULT_PS5 }) },
    nintendoSwitch: { type: cafeConsoleSchema, default: () => ({ ...DEFAULT_SWITCH }) },
    games: { type: [cafeGameSchema], default: DEFAULT_GAMES },
  },
  { timestamps: true }
);

export default mongoose.model<ICafeSettings>('CafeSettings', cafeSettingsSchema);
