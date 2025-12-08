import { z } from 'zod';

const inventoryItemSchema = z.object({
  condition: z.enum(['NM', 'SP', 'MP', 'HP', 'DMG']),
  finish: z.enum(['nonfoil', 'foil', 'etched']),
  quantityOwned: z.number().min(0),
  quantityForSale: z.number().min(0),
  buyPrice: z.number().min(0),
  sellPrice: z.number().min(0),
});

export const createCardSchema = z.object({
  name: z.string().min(1, 'Card name is required').trim(),
  setCode: z.string().min(1, 'Set code is required').trim().toUpperCase(),
  setName: z.string().min(1, 'Set name is required').trim(),
  collectorNumber: z.string().min(1, 'Collector number is required').trim(),
  language: z.string().default('EN').transform((val) => val.toUpperCase()),
  imageUrl: z.string().url().optional().or(z.literal('')),
  scryfallId: z.string().optional(),
  typeLine: z.string().optional(),
  oracleText: z.string().optional(),
  colorIdentity: z
    .array(z.enum(['W', 'U', 'B', 'R', 'G']))
    .default([]),
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']).default('common'),
  manaCost: z.string().optional(),
  notes: z.string().optional(),
  inventory: z.array(inventoryItemSchema).default([]),
});

export const updateCardSchema = createCardSchema.partial();

export const searchCardsSchema = z.object({
  q: z.string().optional(),
  set: z.string().optional(),
  color: z.string().optional(), // Comma-separated colors
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']).optional(),
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('24'),
  sort: z
    .enum(['name_asc', 'name_desc', 'number_asc', 'number_desc', 'price_asc', 'price_desc', 'set_new', 'set_old'])
    .default('name_asc'),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type SearchCardsInput = z.infer<typeof searchCardsSchema>;
