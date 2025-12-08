import { Router } from 'express';
import { getCards, getCardById, getSets } from '../controllers/card.controller';

const router = Router();

/**
 * @route   GET /api/cards/sets/list
 * @desc    Get list of unique sets
 * @access  Public
 */
router.get('/sets/list', getSets);

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

export default router;
