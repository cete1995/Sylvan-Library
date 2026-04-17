import { Router } from 'express';
import { getCards, getCardById, getSets, addInventory, getGroupedCards } from '../controllers/card.controller';
import { authenticate, requireAdminOrSeller } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/cards/sets/list
 * @desc    Get list of unique sets
 * @access  Public
 */
router.get('/sets/list', getSets);

/**
 * @route   GET /api/cards/grouped
 * @desc    Get cards grouped by name with printing count and min price
 * @access  Public
 */
router.get('/grouped', getGroupedCards);

/**
 * @route   GET /api/cards
 * @desc    Get all cards with search and filters
 * @access  Public
 */
router.get('/', getCards);

/**
 * @route   GET /api/cards/:id
 * @desc    Get single card by ID
 * @access  Public
 */
router.get('/:id', getCardById);

/**
 * @route   POST /api/cards/:id/inventory
 * @desc    Add inventory to a card
 * @access  Private (Admin or Seller)
 */
router.post('/:id/inventory', authenticate, requireAdminOrSeller, addInventory);

export default router;
