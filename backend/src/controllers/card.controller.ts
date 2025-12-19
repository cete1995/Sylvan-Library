import { Request, Response } from 'express';
import { Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { searchCardsSchema } from '../validators/card.validator';
import { FilterQuery } from 'mongoose';
import { ICard } from '../models/Card.model';

/**
 * Get all cards with search, filter, and pagination
 * GET /api/cards
 */
export const getCards = asyncHandler(async (req: Request, res: Response) => {
  // Validate and parse query parameters
  const params = searchCardsSchema.parse(req.query);

  // Build query filter
  const filter: FilterQuery<ICard> = {
    isActive: true,
    // Show all cards including those with no inventory (catalog cards)
  };

  // Text search by name
  if (params.q) {
    // Create variations of the search query to handle hyphens
    const searchTerm = params.q.trim();
    const withHyphen = searchTerm.replace(/\s+/g, '-');
    const withoutHyphen = searchTerm.replace(/-/g, ' ');
    const withoutSpace = searchTerm.replace(/[\s-]/g, '');
    
    // Build regex pattern to match any variation
    const patterns = [
      searchTerm,
      withHyphen,
      withoutHyphen,
      withoutSpace
    ].filter((term, index, self) => self.indexOf(term) === index); // Remove duplicates
    
    const regexPattern = patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    filter.$or = [
      { name: { $regex: regexPattern, $options: 'i' } },
      { setName: { $regex: regexPattern, $options: 'i' } },
      { typeLine: { $regex: regexPattern, $options: 'i' } },
    ];
  }

  // Filter by set
  if (params.set) {
    filter.setCode = params.set.toUpperCase();
  }

  // Filter by color identity
  if (params.color) {
    const colors = params.color.split(',').map((c) => c.trim().toUpperCase());
    filter.colorIdentity = { $all: colors };
  }

  // Filter by rarity
  if (params.rarity) {
    filter.rarity = params.rarity;
  }

  // Filter by tags (Borderless, Extended Art, etc.)
  if (params.tags) {
    const tagArray = params.tags.split(',').map(t => t.trim());
    const tagConditions: any[] = [];
    
    if (tagArray.includes('Borderless')) {
      tagConditions.push({ borderColor: 'borderless' });
    }
    if (tagArray.includes('Extended Art')) {
      tagConditions.push({ frameEffects: 'extendedart' });
    }
    
    if (tagConditions.length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: tagConditions });
    }
  }

  // Note: Price filtering removed - prices are now in inventory array
  // TODO: Implement price filtering with inventory array if needed

  // Build sort criteria
  let sortCriteria: any = {};
  let useAggregation = false;
  let aggregationSort: any = {};
  
  switch (params.sort) {
    case 'name_asc':
      sortCriteria = { name: 1 };
      break;
    case 'name_desc':
      sortCriteria = { name: -1 };
      break;
    case 'price_asc':
      // Price sorting disabled - prices now in inventory array
      sortCriteria = { name: 1 };
      break;
    case 'price_desc':
      // Price sorting disabled - prices now in inventory array
      sortCriteria = { name: 1 };
      break;
    case 'number_asc':
      useAggregation = true;
      aggregationSort = { setCode: 1, collectorNumberNumeric: 1, collectorNumber: 1 };
      break;
    case 'number_desc':
      useAggregation = true;
      aggregationSort = { setCode: 1, collectorNumberNumeric: -1, collectorNumber: -1 };
      break;
    case 'set_new':
      sortCriteria = { setCode: -1, collectorNumber: 1 };
      break;
    case 'set_old':
      sortCriteria = { setCode: 1, collectorNumber: 1 };
      break;
    default:
      sortCriteria = { name: 1 };
  }

  // Calculate pagination
  const page = params.page;
  const limit = params.limit;
  const skip = (page - 1) * limit;

  // Execute query
  let cards, total;
  
  if (useAggregation) {
    // Use aggregation for numeric sorting of collector numbers
    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          collectorNumberNumeric: {
            $let: {
              vars: {
                matches: { $regexFindAll: { input: "$collectorNumber", regex: "\\d+" } }
              },
              in: {
                $convert: {
                  input: { $arrayElemAt: ["$$matches.match", 0] },
                  to: "int",
                  onError: 999999,
                  onNull: 999999
                }
              }
            }
          }
        }
      },
      { $sort: aggregationSort },
      { $skip: skip },
      { $limit: limit }
    ];
    
    const [cardsResult, countResult] = await Promise.all([
      Card.aggregate(pipeline),
      Card.countDocuments(filter),
    ]);
    
    cards = cardsResult;
    total = countResult;
  } else {
    // Standard query for other sorts
    [cards, total] = await Promise.all([
      Card.find(filter).sort(sortCriteria).skip(skip).limit(limit).lean(),
      Card.countDocuments(filter),
    ]);
  }

  const totalPages = Math.ceil(total / limit);

  res.json({
    cards,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

/**
 * Get single card by ID
 * GET /api/cards/:id
 */
export const getCardById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const card = await Card.findOne({ _id: id, isActive: true });

  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  res.json({ card });
});

/**
 * Get unique sets (for filter dropdowns)
 * GET /api/cards/sets/list
 */
export const getSets = asyncHandler(async (req: Request, res: Response) => {
  const sets = await Card.aggregate([
    { $match: { isActive: true } }, // Show all sets including catalog cards
    {
      $group: {
        _id: '$setCode',
        setName: { $first: '$setName' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    sets: sets.map((set) => ({
      code: set._id,
      name: set.setName,
      count: set.count,
    })),
  });
});

/**
 * Add inventory to a card
 * POST /api/cards/:id/inventory
 */
export const addInventory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { condition, finish, quantity, quantityForSale } = req.body;
  const user = (req as any).user;

  // Validate input
  if (!condition || !finish) {
    throw new AppError(400, 'Condition and finish are required');
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    throw new AppError(400, 'Valid quantity is required');
  }

  if (typeof quantityForSale !== 'number' || quantityForSale < 0) {
    throw new AppError(400, 'Valid quantity for sale is required');
  }

  if (quantityForSale > quantity) {
    throw new AppError(400, 'Quantity for sale cannot exceed total quantity');
  }

  // Find the card
  const card = await Card.findById(id);
  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  // Check if this exact inventory item already exists for this seller
  const existingInventoryIndex = card.inventory.findIndex(
    (inv) =>
      inv.condition === condition &&
      inv.finish === finish &&
      inv.sellerId === user.id
  );

  if (existingInventoryIndex !== -1) {
    // Update existing inventory
    card.inventory[existingInventoryIndex].quantityOwned += quantity;
    card.inventory[existingInventoryIndex].quantityForSale += quantityForSale;
  } else {
    // Add new inventory item with seller info
    card.inventory.push({
      condition,
      finish,
      quantityOwned: quantity,
      quantityForSale,
      buyPrice: 0,
      sellPrice: 0,
      sellerId: user.id,
      sellerName: user.name || user.email,
    });
  }

  await card.save();

  res.status(200).json({
    message: 'Inventory added successfully',
    card,
  });
});
