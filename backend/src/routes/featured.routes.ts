import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getAdminFeaturedBanner,
  upsertFeaturedBanner,
  getAdminFeaturedProducts,
  addFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
} from '../controllers/featured.controller';

const router = Router();

// All featured routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/featured/banner
 * @desc    Get featured banner
 * @access  Private (Admin)
 */
router.get('/banner', getAdminFeaturedBanner);

/**
 * @route   POST /api/admin/featured/banner
 * @desc    Update or create featured banner
 * @access  Private (Admin)
 */
router.post('/banner', upsertFeaturedBanner);

/**
 * @route   GET /api/admin/featured/products
 * @desc    Get all featured products
 * @access  Private (Admin)
 */
router.get('/products', getAdminFeaturedProducts);

/**
 * @route   POST /api/admin/featured/products
 * @desc    Add a featured product
 * @access  Private (Admin)
 */
router.post('/products', addFeaturedProduct);

/**
 * @route   PUT /api/admin/featured/products/:id
 * @desc    Update a featured product
 * @access  Private (Admin)
 */
router.put('/products/:id', updateFeaturedProduct);

/**
 * @route   DELETE /api/admin/featured/products/:id
 * @desc    Delete a featured product
 * @access  Private (Admin)
 */
router.delete('/products/:id', deleteFeaturedProduct);

export default router;
