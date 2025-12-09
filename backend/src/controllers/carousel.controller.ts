import { Request, Response } from 'express';
import { Carousel } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Get all active carousel images
 * GET /api/carousel
 */
export const getCarouselImages = asyncHandler(async (req: Request, res: Response) => {
  const images = await Carousel.find({ isActive: true })
    .sort({ order: 1 })
    .limit(8);

  res.json({ images });
});

/**
 * Get all carousel images (admin)
 * GET /api/admin/carousel
 */
export const getAdminCarouselImages = asyncHandler(async (req: Request, res: Response) => {
  const images = await Carousel.find().sort({ order: 1 });

  res.json({ images });
});

/**
 * Upload carousel image
 * POST /api/admin/carousel
 */
export const uploadCarouselImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl, altText, order } = req.body;

  // Check total count
  const count = await Carousel.countDocuments();
  if (count >= 8) {
    throw new AppError(400, 'Maximum 8 carousel images allowed. Please delete one before adding new.');
  }

  // Validate order
  if (order < 0 || order > 7) {
    throw new AppError(400, 'Order must be between 0 and 7');
  }

  // Check if order already exists
  const existing = await Carousel.findOne({ order });
  if (existing) {
    throw new AppError(400, `Order ${order} is already taken. Please choose a different order.`);
  }

  const image = await Carousel.create({
    imageUrl,
    altText: altText || '',
    order,
    isActive: true,
  });

  res.status(201).json({
    message: 'Carousel image uploaded successfully',
    image,
  });
});

/**
 * Update carousel image
 * PUT /api/admin/carousel/:id
 */
export const updateCarouselImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { imageUrl, altText, order, isActive } = req.body;

  const image = await Carousel.findById(id);
  if (!image) {
    throw new AppError(404, 'Carousel image not found');
  }

  // If order is being changed, check if new order is available
  if (order !== undefined && order !== image.order) {
    if (order < 0 || order > 7) {
      throw new AppError(400, 'Order must be between 0 and 7');
    }
    const existing = await Carousel.findOne({ order, _id: { $ne: id } });
    if (existing) {
      throw new AppError(400, `Order ${order} is already taken. Please choose a different order.`);
    }
    image.order = order;
  }

  if (imageUrl !== undefined) image.imageUrl = imageUrl;
  if (altText !== undefined) image.altText = altText;
  if (isActive !== undefined) image.isActive = isActive;

  await image.save();

  res.json({
    message: 'Carousel image updated successfully',
    image,
  });
});

/**
 * Delete carousel image
 * DELETE /api/admin/carousel/:id
 */
export const deleteCarouselImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const image = await Carousel.findByIdAndDelete(id);
  if (!image) {
    throw new AppError(404, 'Carousel image not found');
  }

  res.json({
    message: 'Carousel image deleted successfully',
  });
});
