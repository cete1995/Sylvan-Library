import { Request, Response } from 'express';
import { Card, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCardSchema, updateCardSchema } from '../validators/card.validator';
import { parse } from 'csv-parse/sync';
import { hashPassword } from '../utils/auth.utils';

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
 * Get all unique sets from cards uploaded via JSON
 * Only returns sets where cards have imageUrl and updatedAt (JSON uploaded)
 * Sorted by release date (newest first)
 * GET /api/admin/sets
 */
export const getSets = asyncHandler(async (req: Request, res: Response) => {
  const sets = await Card.aggregate([
    {
      // Filter for cards with images (JSON uploaded) and updatedAt timestamp
      $match: {
        imageUrl: { $ne: null },
        updatedAt: { $exists: true },
      },
    },
    {
      $group: {
        _id: '$setCode',
        setCode: { $first: '$setCode' },
        setName: { $first: '$setName' },
        releaseDate: { $first: '$releaseDate' },
        cardCount: { $sum: 1 },
        lastUpdated: { $max: '$updatedAt' },
      },
    },
    {
      $sort: { releaseDate: -1 },
    },
  ]);

  res.json({ sets });
});

/**
 * Get all unique sets that have cards with missing images
 * Returns sets where at least one card has no imageUrl
 * Sorted by card count (most missing images first)
 * GET /api/admin/sets/missing-images
 */
export const getSetsWithMissingImages = asyncHandler(async (req: Request, res: Response) => {
  const sets = await Card.aggregate([
    {
      // Filter for cards WITHOUT images
      $match: {
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' }
        ],
      },
    },
    {
      $group: {
        _id: '$setCode',
        setCode: { $first: '$setCode' },
        setName: { $first: '$setName' },
        releaseDate: { $first: '$releaseDate' },
        cardCount: { $sum: 1 },
        lastUpdated: { $max: '$updatedAt' },
      },
    },
    {
      $sort: { cardCount: -1, releaseDate: -1 },
    },
  ]);

  res.json({ sets });
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
    missingImages,
    page = '1',
    limit = '50',
  } = req.query;

  const filter: any = {};

  // Include inactive cards if requested
  if (includeInactive !== 'true') {
    filter.isActive = true;
  }

  // Filter by missing images
  if (missingImages === 'true') {
    filter.$or = [
      { imageUrl: { $exists: false } },
      { imageUrl: null },
      { imageUrl: '' }
    ];
  }

  // Search by name (combine with existing $or if missingImages filter exists)
  if (q) {
    const nameFilter = [
      { name: { $regex: q, $options: 'i' } },
      { setName: { $regex: q, $options: 'i' } },
    ];
    
    if (filter.$or) {
      // If missingImages filter exists, combine with $and
      filter.$and = [
        { $or: filter.$or },
        { $or: nameFilter }
      ];
      delete filter.$or;
    } else {
      filter.$or = nameFilter;
    }
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
  // Get all active cards
  const cards = await Card.find({ isActive: true }).lean();
  
  // Calculate stats manually to avoid aggregation issues
  const uniqueCards = new Set<string>();
  let totalQuantity = 0;
  let totalInventoryValue = 0;
  let totalListingValue = 0;
  
  for (const card of cards) {
    uniqueCards.add(card._id.toString());
    
    if (card.inventory && Array.isArray(card.inventory)) {
      for (const item of card.inventory) {
        // Add to totals
        totalQuantity += item.quantityOwned || 0;
        totalInventoryValue += (item.quantityOwned || 0) * (item.buyPrice || 0);
        totalListingValue += (item.quantityForSale || 0) * (item.sellPrice || 0);
      }
    }
  }

  res.json({
    totalCards: uniqueCards.size,
    totalQuantity: totalQuantity,
    totalInventoryValue: totalInventoryValue.toFixed(2),
    totalListingValue: totalListingValue.toFixed(2),
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
 * Clear entire database (cards, non-admin users, carts, orders, featured items, carousel, UB settings, Regular settings, price data)
 * POST /api/admin/clear-database
 */
export const clearDatabase = asyncHandler(async (req: Request, res: Response) => {
  // Import models
  const { User, Cart, Carousel } = require('../models');
  const { default: CardPrice } = require('../models/CardPrice');
  const { default: Order } = require('../models/Order.model');
  const { default: FeaturedProduct } = require('../models/FeaturedProduct.model');
  const { default: FeaturedBanner } = require('../models/FeaturedBanner.model');
  const { default: UBSettings } = require('../models/UBSettings.model');
  const { default: RegularSettings } = require('../models/RegularSettings.model');

  // Delete all cards
  const deletedCards = await Card.deleteMany({});
  
  // Delete all non-admin users (keep admin and seller accounts)
  const deletedUsers = await User.deleteMany({ role: { $nin: ['admin', 'seller'] } });
  
  // Delete all carts
  const deletedCarts = await Cart.deleteMany({});

  // Delete all orders
  const deletedOrders = await Order.deleteMany({});

  // Delete all carousel images
  const deletedCarousel = await Carousel.deleteMany({});

  // Delete all featured products
  const deletedFeaturedProducts = await FeaturedProduct.deleteMany({});

  // Delete all featured banners
  const deletedFeaturedBanners = await FeaturedBanner.deleteMany({});

  // Keep UB pricing settings
  // Keep Regular pricing settings
  // Keep price data (CardPrice)

  res.json({
    message: 'Database cleared successfully (pricing settings and price data preserved)',
    deletedCounts: {
      cards: deletedCards.deletedCount,
      users: deletedUsers.deletedCount,
      carts: deletedCarts.deletedCount,
      orders: deletedOrders.deletedCount,
      carousel: deletedCarousel.deletedCount,
      featuredProducts: deletedFeaturedProducts.deletedCount,
      featuredBanners: deletedFeaturedBanners.deletedCount,
    },
  });
});

/**
 * Fix seller names in all inventory items
 * POST /api/admin/fix-seller-names
 */
export const fixSellerNames = asyncHandler(async (req: Request, res: Response) => {
  let updatedCards = 0;
  let updatedItems = 0;

  // Get all sellers
  const sellers = await User.find({ role: 'seller' }).lean();
  const sellerMap = new Map<string, string>(
    sellers.map(s => [s._id.toString(), s.name || s.email.split('@')[0]])
  );

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } });

  for (const card of cards) {
    let cardUpdated = false;

    for (const item of card.inventory) {
      if (item.sellerId) {
        const correctName = sellerMap.get(item.sellerId.toString());
        if (correctName && item.sellerName !== correctName) {
          item.sellerName = correctName;
          cardUpdated = true;
          updatedItems++;
        }
      }
    }

    if (cardUpdated) {
      await card.save();
      updatedCards++;
    }
  }

  res.json({
    success: true,
    message: 'Seller names updated successfully',
    updatedCards,
    updatedItems,
    sellers: sellers.map(s => ({ id: s._id.toString(), name: s.name, email: s.email }))
  });
});

/**
 * Regenerate seller SKUs for all cards
 * Format: SetCode-CollectorNumber-FoilType-LanguageCode-Rarity
 * Example: OTJ-0142-N-EN-Uncommon
 */
export const regenerateSellerSKUs = asyncHandler(async (req: Request, res: Response) => {
  let updatedCards = 0;
  let updatedItems = 0;

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } });

  for (const card of cards) {
    let cardUpdated = false;

    for (const item of card.inventory) {
      // Generate SKU for each inventory item
      const formattedNumber = card.collectorNumber.padStart(4, '0');
      
      const foilTypeMap: Record<string, string> = {
        'nonfoil': 'N',
        'foil': 'F',
        'etched': 'E'
      };
      const foilType = foilTypeMap[item.finish] || 'N';
      
      const langCode = card.language?.toUpperCase() || 'EN';
      const formattedRarity = card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1);
      
      const newSKU = `${card.setCode}-${formattedNumber}-${foilType}-${langCode}-${formattedRarity}`;
      
      if (item.sellerSku !== newSKU) {
        item.sellerSku = newSKU;
        cardUpdated = true;
        updatedItems++;
      }
    }

    if (cardUpdated) {
      await card.save();
      updatedCards++;
    }
  }

  res.json({
    success: true,
    message: 'Seller SKUs regenerated successfully',
    updatedCards,
    updatedItems
  });
});

export const fixInventoryQuantities = asyncHandler(async (req: Request, res: Response) => {
  let updatedCards = 0;
  let updatedItems = 0;
  let errors: any[] = [];
  let totalInventoryItems = 0;

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } });
  console.log(`Scanning ${cards.length} cards for inventory quantity issues...`);

  for (const card of cards) {
    let cardUpdated = false;

    for (const item of card.inventory) {
      totalInventoryItems++;
      
      const qtyForSale = item.quantityForSale;
      const qtyOwned = item.quantityOwned;
      
      // Debug logging to see actual values
      const qtyForSaleType = typeof qtyForSale;
      const qtyForSaleIsNaN = isNaN(qtyForSale as any);
      
      if (totalInventoryItems <= 5) { // Log first 5 items for debugging
        console.log(`Item ${totalInventoryItems}: ${card.name}`, {
          quantityForSale: qtyForSale,
          type: qtyForSaleType,
          isNaN: qtyForSaleIsNaN,
          quantityOwned: qtyOwned,
          sellerId: item.sellerId ? 'exists' : 'none'
        });
      }
      
      // Check if quantityForSale is NaN, null, undefined, or invalid
      if (
        item.quantityForSale === null ||
        item.quantityForSale === undefined ||
        isNaN(item.quantityForSale as any) ||
        typeof item.quantityForSale !== 'number'
      ) {
        // For sellers, all stock is for sale
        if (item.sellerId) {
          item.quantityForSale = item.quantityOwned || 0;
          console.log(`Fixed ${card.name} - Set quantityForSale to ${item.quantityForSale}`);
        } else {
          // For non-seller items, set to 0
          item.quantityForSale = 0;
        }
        cardUpdated = true;
        updatedItems++;
      }

      // Also ensure quantityOwned is valid
      if (
        item.quantityOwned === null ||
        item.quantityOwned === undefined ||
        isNaN(item.quantityOwned as any) ||
        typeof item.quantityOwned !== 'number'
      ) {
        item.quantityOwned = 0;
        cardUpdated = true;
        updatedItems++;
      }
    }

    if (cardUpdated) {
      try {
        await card.save();
        updatedCards++;
      } catch (error: any) {
        errors.push({
          cardId: card._id,
          cardName: card.name,
          error: error.message
        });
      }
    }
  }

  console.log(`Scan complete: ${totalInventoryItems} total inventory items checked`);

  res.json({
    success: true,
    message: 'Inventory quantities fixed successfully',
    totalInventoryItems,
    updatedCards,
    updatedItems,
    errors: errors.length > 0 ? errors : undefined
  });
});

/**
 * Clean up cards whose name contains " // " (old DFC/meld imports done before the faceName fix).
 * - If a card with just the face name already exists → copy imageUrl/scryfallId to it, delete the combined-name duplicate.
 * - If no face-name card exists → rename the combined-name card to use the face part only.
 */
/**
 * GET /api/admin/members
 * List all members (customers + admins) with their WPN/phone data
 */
export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const query: any = {};
  if (search) {
    query.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
      { wpnEmail:  { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }
  const members = await User.find(query)
    .select('name email wpnEmail phoneNumber role storeCredit createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, members });
});

/**
 * POST /api/admin/members
 * Admin creates a new member account
 */
export const createMember = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, wpnEmail, phoneNumber } = req.body;
  if (!name || !email) throw new AppError(400, 'Name and email are required');

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new AppError(409, 'A user with this email already exists');

  const tempPassword = 'Sylvan' + Math.floor(1000 + Math.random() * 9000);
  const passwordHash = await hashPassword(tempPassword);

  const member = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    wpnEmail: wpnEmail?.trim() || undefined,
    phoneNumber: phoneNumber?.trim() || undefined,
    role: 'customer',
  });

  res.status(201).json({
    success: true,
    message: 'Member created successfully',
    member: { _id: member._id, name: member.name, email: member.email, wpnEmail: member.wpnEmail, phoneNumber: member.phoneNumber, role: member.role, createdAt: member.createdAt },
    tempPassword,
  });
});

/**
 * PUT /api/admin/members/:id
 * Update member name, wpnEmail, phoneNumber
 */
export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, wpnEmail, phoneNumber } = req.body;

  const member = await User.findByIdAndUpdate(
    id,
    { $set: { name, wpnEmail: wpnEmail || undefined, phoneNumber: phoneNumber || undefined } },
    { new: true, runValidators: true }
  ).select('name email wpnEmail phoneNumber role storeCredit createdAt');

  if (!member) throw new AppError(404, 'Member not found');
  res.json({ success: true, member });
});

/**
 * DELETE /api/admin/members/:id
 */
export const deleteMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const member = await User.findById(id);
  if (!member) throw new AppError(404, 'Member not found');
  if (member.role === 'admin') throw new AppError(403, 'Cannot delete an admin account');
  await User.deleteOne({ _id: id });
  res.json({ success: true, message: 'Member deleted' });
});

/**
 * POST /api/admin/members/:id/store-credit
 * Add or subtract store credit for a user
 * body: { amount: number (positive = add, negative = subtract), note?: string }
 */
export const adjustStoreCredit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new AppError(400, 'amount must be a number');
  }

  const member = await User.findById(id).select('name email storeCredit role');
  if (!member) throw new AppError(404, 'Member not found');

  const newCredit = Math.max(0, (member.storeCredit || 0) + amount);
  member.storeCredit = newCredit;
  await member.save();

  res.json({
    success: true,
    message: `Store credit ${amount >= 0 ? 'added' : 'deducted'} successfully`,
    storeCredit: newCredit,
    member: { _id: member._id, name: member.name, email: member.email, storeCredit: newCredit },
  });
});

export const fixDfcImageUrls = asyncHandler(async (req: Request, res: Response) => {
  // Replace /back/ with /front/ in all Scryfall imageUrls that point to the back face
  const result = await Card.updateMany(
    { imageUrl: /\/back\// },
    [{ $set: { imageUrl: { $replaceAll: { input: '$imageUrl', find: '/back/', replacement: '/front/' } } } }]
  );

  res.json({
    success: true,
    message: `DFC image URLs fixed: ${result.modifiedCount} card(s) updated to front-face URL`,
    modifiedCount: result.modifiedCount,
  });
});

export const cleanupCombinedNames = asyncHandler(async (req: Request, res: Response) => {
  const combinedCards = await Card.find({ name: / \/\/ / });

  let merged = 0;
  let renamed = 0;

  for (const card of combinedCards) {
    const facePart = card.name.split(' // ')[0].trim();

    const faceCard = await Card.findOne({
      name: facePart,
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      _id: { $ne: card._id },
    });

    if (faceCard) {
      // Prefer the image from whichever card has it; update face card then delete duplicate
      if (!faceCard.imageUrl && card.imageUrl) faceCard.imageUrl = card.imageUrl;
      if (!faceCard.scryfallId && card.scryfallId) faceCard.scryfallId = card.scryfallId;
      await faceCard.save();
      await Card.deleteOne({ _id: card._id });
      merged++;
    } else {
      // No duplicate — just rename to the clean face name
      card.name = facePart;
      await card.save();
      renamed++;
    }
  }

  res.json({
    success: true,
    message: `Cleanup complete: ${merged} duplicate(s) merged & deleted, ${renamed} card(s) renamed`,
    total: combinedCards.length,
    merged,
    renamed,
  });
});
