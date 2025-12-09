import { Router } from 'express';
import {
  getFeaturedBanner,
  getFeaturedProducts,
} from '../controllers/featured.controller';

const router = Router();

/**
 * @route   GET /api/featured/banner
 * @desc    Get active featured banner
 * @access  Public
 */
router.get('/banner', getFeaturedBanner);

/**
 * @route   GET /api/featured/products
 * @desc    Get active featured products
 * @access  Public
 */
router.get('/products', getFeaturedProducts);

export default router;
