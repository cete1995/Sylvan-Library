import { Router, Request, Response } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import Card from '../models/Card.model';
import User from '../models/User.model';
import { authenticate, requireAdminOrSeller } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// USD to IDR conversion rate (approximate)
const USD_TO_IDR = 15500;

// Map Manabox condition to our system
const mapCondition = (manaboxCondition: string): 'NM' | 'LP' | 'P' => {
  const conditionMap: { [key: string]: 'NM' | 'LP' | 'P' } = {
    'near_mint': 'NM',
    'light_played': 'LP',
    'lightly_played': 'LP',
    'moderately_played': 'P',
    'heavily_played': 'P',
    'damaged': 'P'
  };
  return conditionMap[manaboxCondition.toLowerCase()] || 'NM';
};

// Map Manabox foil to our finish
const mapFinish = (manaboxFoil: string): 'nonfoil' | 'foil' | 'etched' => {
  const finishMap: { [key: string]: 'nonfoil' | 'foil' | 'etched' } = {
    'normal': 'nonfoil',
    'foil': 'foil',
    'etched': 'etched'
  };
  return finishMap[manaboxFoil.toLowerCase()] || 'nonfoil';
};

// Map Manabox rarity to our system
const mapRarity = (manaboxRarity: string): 'common' | 'uncommon' | 'rare' | 'mythic' => {
  const rarityMap: { [key: string]: 'common' | 'uncommon' | 'rare' | 'mythic' } = {
    'common': 'common',
    'uncommon': 'uncommon',
    'rare': 'rare',
    'mythic': 'mythic',
    'special': 'rare' // Treat special as rare
  };
  return rarityMap[manaboxRarity.toLowerCase()] || 'common';
};

// Parse Manabox CSV and upload to seller's inventory
router.post('/upload', authenticate, requireAdminOrSeller, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const sellerId = req.user.id;
    // Look up the seller's display name from the database — the JWT only carries id/email/role
    const sellerUser = await User.findById(sellerId).select('name email').lean();
    const sellerName = sellerUser?.name || (sellerUser?.email || req.user.email).split('@')[0];

    const results: any[] = [];
    const errors: any[] = [];
    let processed = 0;
    let added = 0;
    let updated = 0;

    // Parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row: any) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each row
    for (const row of results) {
      try {
        processed++;

        // Skip if quantity is 0 or missing
        const quantity = parseInt(row.Quantity || '0');
        if (quantity === 0) continue;

        // Extract data from Manabox CSV
        const cardData = {
          name: row.Name?.trim(),
          setCode: row['Set code']?.trim().toUpperCase(),
          setName: row['Set name']?.trim(),
          collectorNumber: row['Collector number']?.trim(),
          condition: mapCondition(row.Condition || 'near_mint'),
          finish: mapFinish(row.Foil || 'normal'),
          rarity: mapRarity(row.Rarity || 'common'),
          language: (row.Language || 'EN').toUpperCase(),
          scryfallId: row['Scryfall ID']?.trim(),
          quantityOwned: quantity,
          // For sellers, all stock is for sale by default
          quantityForSale: quantity,
          buyPrice: parseFloat(row['Purchase price'] || '0') * USD_TO_IDR,
          sellPrice: 0 // Will be calculated by pricing tiers
        };

        // Validate required fields
        if (!cardData.name || !cardData.setCode) {
          errors.push({
            row: processed,
            name: row.Name,
            error: 'Missing required fields (Name or Set code)'
          });
          continue;
        }

        // Find existing card
        const existingCard = await Card.findOne({
          name: cardData.name,
          setCode: cardData.setCode,
          collectorNumber: cardData.collectorNumber
        });

        if (existingCard) {
          // Check if seller already has inventory for this card
          const existingInventory = existingCard.inventory.find(
            inv => inv.sellerId?.toString() === sellerId && 
                   inv.condition === cardData.condition && 
                   inv.finish === cardData.finish
          );

          if (existingInventory) {
            // Update existing inventory - for sellers, all stock is for sale
            existingInventory.quantityOwned += cardData.quantityOwned;
            existingInventory.quantityForSale += cardData.quantityOwned; // Add same amount to quantityForSale
            existingInventory.buyPrice = cardData.buyPrice;
          } else {
            // Add new inventory item for this seller - all stock is for sale
            existingCard.inventory.push({
              condition: cardData.condition,
              finish: cardData.finish,
              quantityOwned: cardData.quantityOwned,
              quantityForSale: cardData.quantityOwned, // All owned stock is for sale
              buyPrice: cardData.buyPrice,
              sellPrice: 0,
              sellerId: sellerId,
              sellerName: sellerName
            });
          }

          await existingCard.save();
          updated++;
        } else {
          // Create new card with seller inventory - all stock is for sale
          const newCard = new Card({
            name: cardData.name,
            setCode: cardData.setCode,
            setName: cardData.setName,
            collectorNumber: cardData.collectorNumber,
            rarity: cardData.rarity,
            language: cardData.language,
            scryfallId: cardData.scryfallId,
            isActive: true,
            inventory: [{
              condition: cardData.condition,
              finish: cardData.finish,
              quantityOwned: cardData.quantityOwned,
              quantityForSale: cardData.quantityOwned, // All owned stock is for sale
              buyPrice: cardData.buyPrice,
              sellPrice: 0,
              sellerId: sellerId,
              sellerName: sellerName
            }]
          });

          await newCard.save();
          added++;
        }

      } catch (error: any) {
        errors.push({
          row: processed,
          name: row.Name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Manabox collection uploaded successfully',
      stats: {
        totalRows: results.length,
        processed,
        added,
        updated,
        errors: errors.length
      },
      errors: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error: any) {
    console.error('Manabox upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Manabox CSV',
      details: error.message
    });
  }
});

export default router;
