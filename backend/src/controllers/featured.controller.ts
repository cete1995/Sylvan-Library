import { Request, Response } from 'express';
import { FeaturedBanner, FeaturedProduct, Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Get active featured banner
 * GET /api/featured/banner
 */
export const getFeaturedBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await FeaturedBanner.findOne({ isActive: true });

  res.json({ banner });
});

/**
 * Get active featured products
 * GET /api/featured/products
 */
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await FeaturedProduct.find({ isActive: true })
    .populate('cardId')
    .sort({ order: 1 })
    .limit(20);

  res.json({ products });
});

/**
 * Get admin featured banner
 * GET /api/admin/featured/banner
 */
export const getAdminFeaturedBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await FeaturedBanner.findOne();

  res.json({ banner });
});

/**
 * Update or create featured banner
 * POST /api/admin/featured/banner
 */
export const upsertFeaturedBanner = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl, title, buttonText, buttonLink, isActive } = req.body;

  // Validate required fields
  if (!imageUrl || !title || !buttonText || !buttonLink) {
    throw new AppError(400, 'All fields are required: imageUrl, title, buttonText, buttonLink');
  }

  // Prevent open redirect / JS injection via buttonLink
  const isRelative = typeof buttonLink === 'string' && buttonLink.startsWith('/');
  const isAbsolute = typeof buttonLink === 'string' && /^https?:\/\//i.test(buttonLink);
  if (!isRelative && !isAbsolute) {
    throw new AppError(400, 'buttonLink must be a relative path (starting with /) or an absolute http/https URL');
  }

  let banner = await FeaturedBanner.findOne();

  if (banner) {
    banner.imageUrl = imageUrl;
    banner.title = title;
    banner.buttonText = buttonText;
    banner.buttonLink = buttonLink;
    banner.isActive = isActive !== undefined ? isActive : true;
    await banner.save();
  } else {
    banner = await FeaturedBanner.create({
      imageUrl,
      title,
      buttonText,
      buttonLink,
      isActive: isActive !== undefined ? isActive : true,
    });
  }

  res.json({
    message: 'Featured banner updated successfully',
    banner,
  });
});

/**
 * Get all featured products (admin)
 * GET /api/admin/featured/products
 */
export const getAdminFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await FeaturedProduct.find()
    .populate('cardId')
    .sort({ order: 1 });

  res.json({ products });
});

/**
 * Add featured product
 * POST /api/admin/featured/products
 */
export const addFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const { cardId, order } = req.body;

  // Verify card exists
  const card = await Card.findById(cardId);
  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  // Check if order already exists
  const existing = await FeaturedProduct.findOne({ order });
  if (existing) {
    throw new AppError(400, `Order ${order} is already taken. Please choose a different order.`);
  }

  const product = await FeaturedProduct.create({
    cardId,
    order,
    isActive: true,
  });

  await product.populate('cardId');

  res.status(201).json({
    message: 'Featured product added successfully',
    product,
  });
});

/**
 * Update featured product
 * PUT /api/admin/featured/products/:id
 */
export const updateFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cardId, order, isActive } = req.body;

  const product = await FeaturedProduct.findById(id);
  if (!product) {
    throw new AppError(404, 'Featured product not found');
  }

  // If order is being changed, check if new order is available
  if (order !== undefined && order !== product.order) {
    const existing = await FeaturedProduct.findOne({ order, _id: { $ne: id } });
    if (existing) {
      throw new AppError(400, `Order ${order} is already taken. Please choose a different order.`);
    }
    product.order = order;
  }

  if (cardId !== undefined) {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new AppError(404, 'Card not found');
    }
    product.cardId = cardId;
  }

  if (isActive !== undefined) product.isActive = isActive;

  await product.save();
  await product.populate('cardId');

  res.json({
    message: 'Featured product updated successfully',
    product,
  });
});

/**
 * Delete featured product
 * DELETE /api/admin/featured/products/:id
 */
export const deleteFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await FeaturedProduct.findByIdAndDelete(id);
  if (!product) {
    throw new AppError(404, 'Featured product not found');
  }

  res.json({
    message: 'Featured product deleted successfully',
  });
});
