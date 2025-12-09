import { Request, Response } from 'express';
import { Card } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

interface MTGJsonCard {
  name: string;
  setCode?: string;
  number: string;
  rarity: string;
  colors?: string[];
  colorIdentity?: string[];
  manaCost?: string;
  manaValue?: number;
  type?: string;
  types?: string[];
  text?: string;
  power?: string;
  toughness?: string;
  artist?: string;
  flavorText?: string;
  borderColor?: string;
  frameEffects?: string[];
  identifiers?: {
    scryfallId?: string;
  };
}

interface SetJsonData {
  meta?: {
    date: string;
    version: string;
  };
  data: {
    baseSetSize?: number;
    code: string;
    name: string;
    cards: MTGJsonCard[];
  };
}

/**
 * Upload set JSON from MTGJson format
 * POST /api/admin/sets/upload
 */
export const uploadSetJson = asyncHandler(async (req: Request, res: Response) => {
  const setData: SetJsonData = req.body;

  if (!setData?.data?.cards || !Array.isArray(setData.data.cards)) {
    throw new AppError(400, 'Invalid set JSON format');
  }

  const cards = setData.data.cards;
  const setCode = setData.data.code.toUpperCase();
  const setName = setData.data.name;
  const createdCards = [];
  const errors = [];

  for (const cardData of cards) {
    try {
      // Map MTGJson rarity to our schema
      let rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus' = 'common';
      const rarityLower = cardData.rarity.toLowerCase();
      if (['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'].includes(rarityLower)) {
        rarity = rarityLower as any;
      }

      // Build type line from types array or type string
      let typeLine = '';
      if (cardData.types && Array.isArray(cardData.types)) {
        typeLine = cardData.types.join(' ');
      } else if (cardData.type) {
        typeLine = cardData.type;
      }

      // Check if card already exists (same name, set, and collector number)
      const existing = await Card.findOne({
        name: cardData.name,
        setCode: setCode,
        collectorNumber: cardData.number,
      });

      if (existing) {
        // Card already exists in catalog - skip
        createdCards.push(existing);
      } else {
        // Create new card in catalog with empty inventory
        const newCard = await Card.create({
          name: cardData.name,
          setCode: setCode,
          setName: setName,
          collectorNumber: cardData.number,
          rarity: rarity,
          colorIdentity: cardData.colorIdentity || [],
          manaCost: cardData.manaCost || '',
          typeLine: typeLine,
          oracleText: cardData.text || '',
          scryfallId: cardData.identifiers?.scryfallId || '',
          borderColor: cardData.borderColor || 'black',
          frameEffects: cardData.frameEffects || [],
          imageUrl: cardData.identifiers?.scryfallId 
            ? `https://cards.scryfall.io/normal/front/${cardData.identifiers.scryfallId.charAt(0)}/${cardData.identifiers.scryfallId.charAt(1)}/${cardData.identifiers.scryfallId}.jpg`
            : undefined,
          language: 'EN',
          isActive: true,
          inventory: [], // Empty inventory array
        });
        createdCards.push(newCard);
      }
    } catch (error) {
      errors.push({
        card: cardData.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.json({
    message: 'Set upload completed',
    setCode,
    totalCards: cards.length,
    imported: createdCards.length,
    errors: errors.length,
    errorDetails: errors.length > 0 ? errors : undefined,
  });
});
