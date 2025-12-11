import { Request, Response } from 'express';
import { Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCardSchema, updateCardSchema } from '../validators/card.validator';
import { parse } from 'csv-parse/sync';

/**
 * Create a new card
 * POST /api/admin/cards
 */
export const createCard = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createCardSchema.parse(req.body);

  const card = await Card.create(validatedData);

  res.status(201).json({
    message: 'Card created successfully',
    card,
  });
});

/**
 * Update a card
 * PUT /api/admin/cards/:id
 */
export const updateCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateCardSchema.parse(req.body);

  const card = await Card.findById(id);
  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  Object.assign(card, validatedData);
  await card.save();

  res.json({
    message: 'Card updated successfully',
    card,
  });
});

/**
 * Delete a card (soft delete)
 * DELETE /api/admin/cards/:id
 */
export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const card = await Card.findById(id);
  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  // Soft delete
  card.isActive = false;
  await card.save();

  res.json({
    message: 'Card deleted successfully',
  });
});

/**
 * Get all cards (including inactive) with admin filters
 * GET /api/admin/cards
 */
export const getAdminCards = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    set,
    includeInactive,
    page = '1',
    limit = '50',
  } = req.query;

  const filter: any = {};

  // Include inactive cards if requested
  if (includeInactive !== 'true') {
    filter.isActive = true;
  }

  // Search by name
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { setName: { $regex: q, $options: 'i' } },
    ];
  }

  // Filter by set
  if (set) {
    filter.setCode = String(set).toUpperCase();
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const [cards, total] = await Promise.all([
    Card.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Card.countDocuments(filter),
  ]);

  res.json({
    cards,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await Card.aggregate([
    { $match: { isActive: true } },
    { $unwind: { path: '$inventory', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalCards: { $addToSet: '$_id' },
        totalQuantity: { $sum: { $ifNull: ['$inventory.quantityOwned', 0] } },
        totalInventoryValue: {
          $sum: { 
            $multiply: [
              { $ifNull: ['$inventory.quantityOwned', 0] }, 
              { $ifNull: ['$inventory.buyPrice', 0] }
            ] 
          },
        },
        totalListingValue: {
          $sum: { 
            $multiply: [
              { $ifNull: ['$inventory.quantityForSale', 0] }, 
              { $ifNull: ['$inventory.sellPrice', 0] }
            ] 
          },
        },
      },
    },
    {
      $project: {
        totalCards: { $size: '$totalCards' },
        totalQuantity: 1,
        totalInventoryValue: 1,
        totalListingValue: 1,
      }
    }
  ]);

  const result = stats[0] || {
    totalCards: 0,
    totalQuantity: 0,
    totalInventoryValue: 0,
    totalListingValue: 0,
  };

  res.json({
    totalCards: result.totalCards,
    totalQuantity: result.totalQuantity,
    totalInventoryValue: result.totalInventoryValue.toFixed(2),
    totalListingValue: result.totalListingValue.toFixed(2),
  });
});

/**
 * Bulk upload cards from CSV
 * POST /api/admin/cards/bulk-upload
 */
export const bulkUploadCards = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');

  // Parse CSV
  let records: any[];
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    throw new AppError(400, 'Invalid CSV format');
  }

  const errors: string[] = [];
  const imported: any[] = [];

  // Process each record
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2; // +2 because: 1-indexed and header row

    try {
      // Map CSV columns to card data
      const cardData = {
        name: record.name,
        setCode: record.setCode,
        setName: record.setName,
        collectorNumber: record.collectorNumber,
        language: record.language || 'EN',
        condition: record.condition || 'NM',
        finish: record.finish || 'nonfoil',
        quantityOwned: parseInt(record.quantityOwned || '0', 10),
        quantityForSale: parseInt(record.quantityForSale || '0', 10),
        buyPrice: parseFloat(record.buyPrice || '0'),
        sellPrice: parseFloat(record.sellPrice || '0'),
        rarity: record.rarity || 'common',
        colorIdentity: record.colorIdentity
          ? record.colorIdentity.split(',').map((c: string) => c.trim())
          : [],
        imageUrl: record.imageUrl || undefined,
        scryfallId: record.scryfallId || undefined,
        typeLine: record.typeLine || undefined,
        oracleText: record.oracleText || undefined,
        manaCost: record.manaCost || undefined,
        notes: record.notes || undefined,
      };

      // Validate using schema
      const validatedData = createCardSchema.parse(cardData);

      // Create card
      const card = await Card.create(validatedData);
      imported.push(card);
    } catch (error: any) {
      errors.push(`Row ${rowNum}: ${error.message}`);
    }
  }

  res.json({
    message: `Bulk upload completed`,
    imported: imported.length,
    failed: errors.length,
    errors: errors.slice(0, 10), // Return first 10 errors
    totalRows: records.length,
  });
});

/**
 * Clear entire database (cards, non-admin users, carts, price data)
 * POST /api/admin/clear-database
 */
export const clearDatabase = asyncHandler(async (req: Request, res: Response) => {
  // Import models
  const { User, Cart, Carousel } = require('../models');
  const { default: CardPrice } = require('../models/CardPrice');

  // Delete all cards
  const deletedCards = await Card.deleteMany({});
  
  // Delete all non-admin users
  const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
  
  // Delete all carts
  const deletedCarts = await Cart.deleteMany({});

  // Delete all carousel images
  const deletedCarousel = await Carousel.deleteMany({});

  // Delete all price data
  const deletedPrices = await CardPrice.deleteMany({});

  res.json({
    message: 'Database cleared successfully',
    deletedCounts: {
      cards: deletedCards.deletedCount,
      users: deletedUsers.deletedCount,
      carts: deletedCarts.deletedCount,
      carousel: deletedCarousel.deletedCount,
      prices: deletedPrices.deletedCount,
    },
  });
});
