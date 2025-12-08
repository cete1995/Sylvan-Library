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
    filter.$or = [
      { name: { $regex: params.q, $options: 'i' } },
      { setName: { $regex: params.q, $options: 'i' } },
      { typeLine: { $regex: params.q, $options: 'i' } },
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
