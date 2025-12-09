import { Request, Response } from 'express';
import { Order } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get user's order history
 * GET /api/orders
 */
export const getUserOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;

  const orders = await Order.find({ user: userId })
    .populate('items.card', 'name imageUrl setName')
    .sort({ createdAt: -1 });

  res.json({ orders });
});

/**
 * Get single order details
 * GET /api/orders/:id
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const { id } = req.params;

  const order = await Order.findById(id).populate('items.card', 'name imageUrl setName');

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Ensure user can only view their own orders
  if (order.user.toString() !== userId) {
    throw new AppError(403, 'Access denied');
  }

  res.json({ order });
});

/**
 * Create new order
 * POST /api/orders
 */
export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const { items, shippingAddress, phoneNumber, courierNotes, paymentMethod } = req.body;

  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Order must contain at least one item');
  }

  if (!shippingAddress || !phoneNumber) {
    throw new AppError(400, 'Shipping address and phone number are required');
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const order = await Order.create({
    user: userId,
    orderNumber,
    items,
    totalAmount,
    shippingAddress,
    phoneNumber,
    courierNotes,
    paymentMethod,
    status: 'pending',
    paymentStatus: 'unpaid',
  });

  const populatedOrder = await Order.findById(order._id).populate('items.card', 'name imageUrl setName');

  res.status(201).json({
    message: 'Order created successfully',
    order: populatedOrder,
  });
});

/**
 * Get all orders (admin)
 * GET /api/admin/orders
 */
export const getAllOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, paymentStatus } = req.query;

  const filter: any = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const orders = await Order.find(filter)
    .populate('user', 'name email phoneNumber')
    .populate('items.card', 'name imageUrl setName')
    .sort({ createdAt: -1 });

  res.json({ orders });
});

/**
 * Update order status (admin)
 * PUT /api/admin/orders/:id
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (status !== undefined) order.status = status;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  await order.save();

  const updatedOrder = await Order.findById(id)
    .populate('user', 'name email phoneNumber')
    .populate('items.card', 'name imageUrl setName');

  res.json({
    message: 'Order updated successfully',
    order: updatedOrder,
  });
});
