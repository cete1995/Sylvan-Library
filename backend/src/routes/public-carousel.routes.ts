import { Router } from 'express';
import { getCarouselImages } from '../controllers/carousel.controller';

const router = Router();

/**
 * @route   GET /api/carousel
 * @desc    Get active carousel images
 * @access  Public
 */
router.get('/', getCarouselImages);

export default router;
