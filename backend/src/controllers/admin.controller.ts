import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Card, User, Cart, Carousel, Order, FeaturedProduct, FeaturedBanner, CardPrice, TikTokOrder } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCardSchema, updateCardSchema } from '../validators/card.validator';
import { parse } from 'csv-parse/sync';
import { hashPassword } from '../utils/auth.utils';

/** Escape special regex characters to prevent ReDoS from user-supplied strings */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    const safeQ = escapeRegex(String(q));
    const nameFilter = [
      { name: { $regex: safeQ, $options: 'i' } },
      { setName: { $regex: safeQ, $options: 'i' } },
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
  const [result, totalCards, orderAggregate, lowStockCards] = await Promise.all([
    Card.aggregate([
      { $match: { isActive: true } },
      { $unwind: { path: '$inventory', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalQuantity:       { $sum: '$inventory.quantityOwned' },
          totalInventoryValue: { $sum: { $multiply: ['$inventory.quantityOwned', '$inventory.buyPrice'] } },
          totalListingValue:   { $sum: { $multiply: ['$inventory.quantityForSale', '$inventory.sellPrice'] } },
        },
      },
    ]),
    Card.countDocuments({ isActive: true }),
    Order.aggregate([
      {
        $group: {
          _id: null,
          total:   { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          unpaid:  { $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, 1, 0] } },
        },
      },
    ]),
    Card.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$inventory' },
      { $match: { 'inventory.quantityForSale': { $gte: 1, $lte: 2 } } },
      {
        $group: {
          _id:    '$_id',
          name:   { $first: '$name' },
          setCode: { $first: '$setCode' },
          minQty: { $min: '$inventory.quantityForSale' },
        },
      },
      { $sort: { minQty: 1 } },
      { $limit: 8 },
    ]),
  ]);

  const stats = result[0] ?? { totalQuantity: 0, totalInventoryValue: 0, totalListingValue: 0 };
  const orders = orderAggregate[0] ?? { total: 0, revenue: 0, pending: 0, unpaid: 0 };

  res.json({
    totalCards,
    totalQuantity:      stats.totalQuantity,
    totalInventoryValue: (stats.totalInventoryValue as number).toFixed(2),
    totalListingValue:   (stats.totalListingValue as number).toFixed(2),
    totalOrders:        orders.total,
    totalRevenue:       (orders.revenue as number).toFixed(2),
    pendingOrders:      orders.pending,
    unpaidOrders:       orders.unpaid,
    lowStockCards,
  });
});

/**
 * Get paginated orders for admin management
 * GET /api/admin/orders
 */
export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const { status, paymentStatus } = req.query;

  const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

  const filter: Record<string, unknown> = {};
  if (status && typeof status === 'string' && status !== 'all') {
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(400, `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    filter.status = status;
  }
  if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new AppError(400, `Invalid payment status filter. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`);
    }
    filter.paymentStatus = paymentStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * Bulk update order status
 * POST /api/admin/orders/bulk-status
 */
export const bulkUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderIds, status } = req.body as { orderIds?: unknown; status?: unknown };

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new AppError(400, 'orderIds must be a non-empty array');
  }
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (typeof status !== 'string' || !validStatuses.includes(status)) {
    throw new AppError(400, `status must be one of: ${validStatuses.join(', ')}`);
  }
  if (orderIds.length > 100) {
    throw new AppError(400, 'Cannot update more than 100 orders at once');
  }
  if (!(orderIds as unknown[]).every((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))) {
    throw new AppError(400, 'All orderIds must be valid MongoDB ObjectIds');
  }

  const result = await Order.updateMany(
    { _id: { $in: orderIds } },
    { $set: { status } }
  );

  res.json({ message: `Updated ${result.modifiedCount} order(s)`, modifiedCount: result.modifiedCount });
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
  const validRecords: any[] = [];

  // Validate each record; collect valid ones for batch insert
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2; // +2 because: 1-indexed and header row

    try {
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

      const validatedData = createCardSchema.parse(cardData);
      validRecords.push(validatedData);
    } catch (error: any) {
      errors.push(`Row ${rowNum}: ${error.message}`);
    }
  }

  // Batch insert all valid records at once
  let imported = 0;
  if (validRecords.length > 0) {
    const inserted = await Card.insertMany(validRecords, { ordered: false });
    imported = inserted.length;
  }

  res.json({
    message: `Bulk upload completed`,
    imported,
    failed: errors.length,
    errors: errors.slice(0, 10), // Return first 10 errors
    totalRows: records.length,
  });
});

/**
 * Clear entire database (cards, non-admin users, carts, orders, featured items, carousel, UB settings, Regular settings, price data)
 * POST /api/admin/clear-database
 */
export const clearUsers = asyncHandler(async (req: Request, res: Response) => {
  const deletedUsers = await User.deleteMany({ role: 'customer' });
  const deletedCarts = await Cart.deleteMany({});
  res.json({
    success: true,
    message: 'All customer accounts and carts deleted. Admin/seller accounts and API keys preserved.',
    deletedCounts: { users: deletedUsers.deletedCount, carts: deletedCarts.deletedCount },
  });
});

export const clearCards = asyncHandler(async (req: Request, res: Response) => {
  const deletedCards = await Card.deleteMany({});
  const deletedPrices = await CardPrice.deleteMany({});
  const deletedCarousel = await Carousel.deleteMany({});
  const deletedFeaturedProducts = await FeaturedProduct.deleteMany({});
  const deletedFeaturedBanners = await FeaturedBanner.deleteMany({});
  res.json({
    success: true,
    message: 'All cards, prices, carousel images, and featured content deleted.',
    deletedCounts: {
      cards: deletedCards.deletedCount,
      prices: deletedPrices.deletedCount,
      carousel: deletedCarousel.deletedCount,
      featuredProducts: deletedFeaturedProducts.deletedCount,
      featuredBanners: deletedFeaturedBanners.deletedCount,
    },
  });
});

export const clearOrders = asyncHandler(async (req: Request, res: Response) => {
  const deletedOrders = await Order.deleteMany({});
  const deletedCarts = await Cart.deleteMany({});
  const deletedTikTokOrders = await TikTokOrder.deleteMany({});
  res.json({
    success: true,
    message: 'All orders, carts, and TikTok orders deleted.',
    deletedCounts: {
      orders: deletedOrders.deletedCount,
      carts: deletedCarts.deletedCount,
      tikTokOrders: deletedTikTokOrders.deletedCount,
    },
  });
});

export const clearDatabase = asyncHandler(async (req: Request, res: Response) => {
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
  // Get all sellers
  const sellers = await User.find({ role: 'seller' }).lean();
  const sellerMap = new Map<string, string>(
    sellers.map(s => [s._id.toString(), s.name || s.email.split('@')[0]])
  );

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } }).lean();

  const bulkOps: any[] = [];
  let updatedItems = 0;

  for (const card of cards) {
    let needsUpdate = false;
    const updatedInventory = card.inventory.map((item: any) => {
      if (item.sellerId) {
        const correctName = sellerMap.get(item.sellerId.toString());
        if (correctName && item.sellerName !== correctName) {
          needsUpdate = true;
          updatedItems++;
          return { ...item, sellerName: correctName };
        }
      }
      return item;
    });

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: card._id },
          update: { $set: { inventory: updatedInventory } },
        },
      });
    }
  }

  let updatedCards = 0;
  if (bulkOps.length > 0) {
    const result = await Card.bulkWrite(bulkOps, { ordered: false });
    updatedCards = result.modifiedCount;
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
  const foilTypeMap: Record<string, string> = { 'nonfoil': 'N', 'foil': 'F', 'etched': 'E' };

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } }).lean();

  const bulkOps: any[] = [];
  let updatedItems = 0;

  for (const card of cards) {
    let needsUpdate = false;

    const updatedInventory = (card.inventory as any[]).map((item: any) => {
      const formattedNumber = card.collectorNumber.padStart(4, '0');
      const foilType = foilTypeMap[item.finish] || 'N';
      const langCode = (card.language?.toUpperCase()) || 'EN';
      const formattedRarity = card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1);
      const newSKU = `${card.setCode}-${formattedNumber}-${foilType}-${langCode}-${formattedRarity}`;

      if (item.sellerSku !== newSKU) {
        needsUpdate = true;
        updatedItems++;
        return { ...item, sellerSku: newSKU };
      }
      return item;
    });

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: card._id },
          update: { $set: { inventory: updatedInventory } },
        },
      });
    }
  }

  let updatedCards = 0;
  if (bulkOps.length > 0) {
    const result = await Card.bulkWrite(bulkOps, { ordered: false });
    updatedCards = result.modifiedCount;
  }

  res.json({
    success: true,
    message: 'Seller SKUs regenerated successfully',
    updatedCards,
    updatedItems
  });
});

export const fixInventoryQuantities = asyncHandler(async (req: Request, res: Response) => {
  let updatedItems = 0;

  // Get all cards with inventory
  const cards = await Card.find({ 'inventory.0': { $exists: true } }).lean();
  console.log(`Scanning ${cards.length} cards for inventory quantity issues...`);

  const bulkOps: any[] = [];
  let totalInventoryItems = 0;

  for (const card of cards) {
    let needsUpdate = false;
    const updatedInventory = (card.inventory as any[]).map((item: any, idx: number) => {
      totalInventoryItems++;

      if (idx < 5) {
        console.log(`Item ${totalInventoryItems}: ${card.name}`, {
          quantityForSale: item.quantityForSale,
          type: typeof item.quantityForSale,
          isNaN: isNaN(item.quantityForSale),
          quantityOwned: item.quantityOwned,
          sellerId: item.sellerId ? 'exists' : 'none',
        });
      }

      let updatedItem = { ...item };

      if (
        item.quantityForSale === null ||
        item.quantityForSale === undefined ||
        isNaN(item.quantityForSale) ||
        typeof item.quantityForSale !== 'number'
      ) {
        updatedItem.quantityForSale = item.sellerId ? (item.quantityOwned || 0) : 0;
        console.log(`Fixed ${card.name} - Set quantityForSale to ${updatedItem.quantityForSale}`);
        needsUpdate = true;
        updatedItems++;
      }

      if (
        item.quantityOwned === null ||
        item.quantityOwned === undefined ||
        isNaN(item.quantityOwned) ||
        typeof item.quantityOwned !== 'number'
      ) {
        updatedItem.quantityOwned = 0;
        needsUpdate = true;
        updatedItems++;
      }

      return updatedItem;
    });

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: card._id },
          update: { $set: { inventory: updatedInventory } },
        },
      });
    }
  }

  console.log(`Scan complete: ${totalInventoryItems} total inventory items checked`);

  let updatedCards = 0;
  const errors: any[] = [];
  if (bulkOps.length > 0) {
    try {
      const result = await Card.bulkWrite(bulkOps, { ordered: false });
      updatedCards = result.modifiedCount;
    } catch (err: any) {
      errors.push(err.message);
    }
  }

  res.json({
    success: true,
    message: 'Inventory quantities fixed successfully',
    totalInventoryItems,
    updatedCards,
    updatedItems,
    errors: errors.length > 0 ? errors : undefined,
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
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name:        { $regex: safeSearch, $options: 'i' } },
      { email:       { $regex: safeSearch, $options: 'i' } },
      { wpnEmail:    { $regex: safeSearch, $options: 'i' } },
      { phoneNumber: { $regex: safeSearch, $options: 'i' } },
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

  const tempPassword = 'Bgt-' + crypto.randomBytes(9).toString('base64url');
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

export const fixDfcLayouts = asyncHandler(async (req: Request, res: Response) => {
  // DFC pairs share the same setCode + collectorNumber (front face = side 'a', back face = side 'b').
  // Since fixDfcImageUrls may have already normalised all imageUrls to /front/, we can't use URL
  // detection. Instead, aggregate all cards and find collector-number slots occupied by >1 card.
  const groups = await Card.aggregate([
    {
      $group: {
        _id: { setCode: '$setCode', collectorNumber: '$collectorNumber' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  const dfcPairs = groups.length;

  if (dfcPairs === 0) {
    res.json({
      success: true,
      message: 'No DFC pairs found (no collector-number slots with more than 1 card).',
      dfcPairs: 0,
      updatedCount: 0,
    });
    return;
  }

  // Collect all card _ids from those groups
  const allIds = groups.flatMap((g: any) => g.ids);

  const result = await Card.updateMany(
    { _id: { $in: allIds }, layout: { $in: ['normal', null, '', undefined] } },
    { $set: { layout: 'transform' } }
  );

  res.json({
    success: true,
    message: `DFC layout fix complete: ${dfcPairs} DFC pair(s) found, ${result.modifiedCount} card(s) updated to layout=transform`,
    dfcPairs,
    updatedCount: result.modifiedCount,
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
