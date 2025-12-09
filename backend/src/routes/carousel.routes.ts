import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getAdminCarouselImages,
  uploadCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
} from '../controllers/carousel.controller';

const router = Router();

// All carousel routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/carousel
 * @desc    Get all carousel images
 * @access  Private (Admin)
 */
router.get('/', getAdminCarouselImages);

/**
 * @route   POST /api/admin/carousel
 * @desc    Upload a new carousel image
 * @access  Private (Admin)
 */
router.post('/', uploadCarouselImage);

/**
 * @route   PUT /api/admin/carousel/:id
 * @desc    Update a carousel image
 * @access  Private (Admin)
 */
router.put('/:id', updateCarouselImage);

/**
 * @route   DELETE /api/admin/carousel/:id
 * @desc    Delete a carousel image
 * @access  Private (Admin)
 */
router.delete('/:id', deleteCarouselImage);

export default router;
