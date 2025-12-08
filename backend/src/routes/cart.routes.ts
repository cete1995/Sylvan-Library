import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', addToCart);

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:itemId', updateCartItem);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:itemId', removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', clearCart);

export default router;
