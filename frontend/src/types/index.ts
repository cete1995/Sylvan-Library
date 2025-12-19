export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface InventoryItem {
  condition: 'NM' | 'LP' | 'P';
  finish: 'nonfoil' | 'foil' | 'etched';
  quantityOwned: number;
  quantityForSale: number;
  buyPrice: number;
  sellPrice: number;
  sellerId?: string;
  sellerName?: string;
}

export interface Card {
  _id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  language: string;
  imageUrl?: string;
  scryfallId?: string;
  uuid?: string;
  typeLine?: string;
  oracleText?: string;
  colorIdentity: string[];
  rarity: string;
  manaCost?: string;
  borderColor?: string;
  frameEffects?: string[];
  tags?: string[];
  notes?: string;
  isActive: boolean;
  inventory: InventoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CardFormData {
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  language: string;
  imageUrl?: string;
  scryfallId?: string;
  uuid?: string;
  typeLine?: string;
  oracleText?: string;
  colorIdentity: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  manaCost?: string;
  notes?: string;
  inventory: InventoryItem[];
}

export interface CardSearchParams {
  q?: string;
  set?: string;
  color?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'name_asc' | 'name_desc' | 'number_asc' | 'number_desc' | 'price_asc' | 'price_desc' | 'set_new' | 'set_old';
}

export interface CardListResponse {
  cards: Card[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SetInfo {
  code: string;
  name: string;
  count: number;
}

export interface Stats {
  totalCards: number;
  totalQuantity: number;
  totalInventoryValue: string;
  totalListingValue: string;
}

export interface CartItem {
  _id: string;
  card: Card;
  inventoryIndex: number;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
