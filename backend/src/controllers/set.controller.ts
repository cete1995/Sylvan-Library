import { Request, Response } from 'express';
import axios from 'axios';
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
  uuid?: string;
  availability?: string[];
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
    releaseDate?: string;
    cards: MTGJsonCard[];
  };
}

/**
 * Upload set JSON from MTGJson format
 * POST /api/admin/sets/upload
 */
export const uploadSetJson = asyncHandler(async (req: Request, res: Response) => {
  const setData: SetJsonData = req.body;
  const result = await processSetData(setData);
  res.json(result);
});

/**
 * Fetch set JSON from MTGJson CDN and import it
 * POST /api/admin/sets/import-from-mtgjson
 */
export const importSetFromMTGJson = asyncHandler(async (req: Request, res: Response) => {
  const { setCode } = req.body;
  if (!setCode) throw new AppError(400, 'setCode is required');

  const url = `https://mtgjson.com/api/v5/${setCode.toUpperCase()}.json`;
  let setData: SetJsonData;
  try {
    const response = await axios.get(url, { timeout: 30000 });
    setData = response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new AppError(404, `Set "${setCode.toUpperCase()}" not found on MTGJson. Check the set code.`);
    }
    throw new AppError(502, `Failed to fetch from MTGJson: ${err.message}`);
  }

  const result = await processSetData(setData);
  res.json(result);
});

// ─── Shared processing logic ───────────────────────────────────────────────

async function processSetData(setData: SetJsonData) {
  if (!setData?.data?.cards || !Array.isArray(setData.data.cards)) {
    throw new AppError(400, 'Invalid set JSON format');
  }

  const cards = setData.data.cards;
  const setCode = setData.data.code.toUpperCase();
  const setName = setData.data.name;
  const releaseDate = setData.data.releaseDate;
  const createdCards: any[] = [];
  const updatedCards: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  for (const cardData of cards) {
    try {
      // Skip cards that are only available on Arena (digital only)
      if (cardData.availability && 
          cardData.availability.length === 1 && 
          cardData.availability[0] === 'arena') {
        skipped.push({
          name: cardData.name,
          reason: 'Arena-only card (digital only)',
        });
        continue;
      }

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
        existing.setName = setName;
        existing.releaseDate = releaseDate;
        existing.rarity = rarity;
        existing.colorIdentity = cardData.colorIdentity || [];
        existing.manaCost = cardData.manaCost || '';
        existing.typeLine = typeLine;
        existing.oracleText = cardData.text || '';
        existing.scryfallId = cardData.identifiers?.scryfallId || '';
        existing.uuid = cardData.uuid || '';
        existing.borderColor = cardData.borderColor || 'black';
        existing.frameEffects = cardData.frameEffects || [];
        if (cardData.identifiers?.scryfallId) {
          existing.imageUrl = `https://cards.scryfall.io/normal/front/${cardData.identifiers.scryfallId.charAt(0)}/${cardData.identifiers.scryfallId.charAt(1)}/${cardData.identifiers.scryfallId}.jpg`;
        }
        await existing.save();
        updatedCards.push(existing);
      } else {
        const newCard = await Card.create({
          name: cardData.name,
          setCode: setCode,
          setName: setName,
          releaseDate: releaseDate,
          collectorNumber: cardData.number,
          rarity: rarity,
          colorIdentity: cardData.colorIdentity || [],
          manaCost: cardData.manaCost || '',
          typeLine: typeLine,
          oracleText: cardData.text || '',
          scryfallId: cardData.identifiers?.scryfallId || '',
          uuid: cardData.uuid || '',
          borderColor: cardData.borderColor || 'black',
          frameEffects: cardData.frameEffects || [],
          imageUrl: cardData.identifiers?.scryfallId 
            ? `https://cards.scryfall.io/normal/front/${cardData.identifiers.scryfallId.charAt(0)}/${cardData.identifiers.scryfallId.charAt(1)}/${cardData.identifiers.scryfallId}.jpg`
            : undefined,
          language: 'EN',
          isActive: true,
          inventory: [
            { condition: 'NM', finish: 'nonfoil', quantityOwned: 0, quantityForSale: 0, buyPrice: 0, sellPrice: 0, sellerId: undefined, sellerName: undefined },
            { condition: 'NM', finish: 'foil',    quantityOwned: 0, quantityForSale: 0, buyPrice: 0, sellPrice: 0, sellerId: undefined, sellerName: undefined },
          ],
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

  return {
    message: 'Set upload completed',
    setCode,
    setName,
    totalCards: cards.length,
    imported: createdCards.length + updatedCards.length,
    created: createdCards.length,
    updated: updatedCards.length,
    skipped: skipped.length,
    errors: errors.length,
    skippedDetails: skipped.length > 0 ? skipped : undefined,
    errorDetails: errors.length > 0 ? errors : undefined,
  };
}
