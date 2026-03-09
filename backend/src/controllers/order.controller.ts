import { Request, Response } from 'express';
import { Order, Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get user's order history
 * GET /api/orders
 */
export const getUserOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

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
  const userId = authReq.user?.id;
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
  const userId = authReq.user?.id;
  const { items, shippingAddress, phoneNumber, courierNotes, paymentMethod } = req.body;

  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Order must contain at least one item');
  }

  if (!shippingAddress || !phoneNumber) {
    throw new AppError(400, 'Shipping address and phone number are required');
  }

  // Verify prices server-side and check stock
  const verifiedItems = [];
  for (const item of items) {
    const card = await Card.findById(item.card);
    if (!card) {
      throw new AppError(404, `Card not found: ${item.card}`);
    }

    // Find matching inventory entry
    const invEntry = card.inventory.find(
      (inv) => inv.condition === item.condition && inv.finish === item.finish
    );

    if (!invEntry) {
      throw new AppError(400, `No inventory found for ${card.name} (${item.condition} / ${item.finish})`);
    }

    if (invEntry.quantityForSale < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${card.name}: only ${invEntry.quantityForSale} available`);
    }

    const pricePerUnit = invEntry.sellPrice;
    const subtotal = pricePerUnit * item.quantity;

    verifiedItems.push({
      card: item.card,
      cardName: item.cardName || card.name,
      condition: item.condition,
      finish: item.finish,
      quantity: item.quantity,
      pricePerUnit,
      subtotal,
    });
  }

  const totalAmount = verifiedItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // Atomically decrement stock before creating order to prevent race conditions
  const decremented: Array<{ card: string; condition: string; finish: string; quantity: number }> = [];
  for (const item of verifiedItems) {
    const updateResult = await Card.updateOne(
      {
        _id: item.card,
        inventory: {
          $elemMatch: {
            condition: item.condition,
            finish: item.finish,
            quantityForSale: { $gte: item.quantity },
          },
        },
      },
      { $inc: { 'inventory.$.quantityForSale': -item.quantity } }
    );

    if (updateResult.modifiedCount === 0) {
      // Roll back already decremented items
      for (const prev of decremented) {
        await Card.updateOne(
          { _id: prev.card, inventory: { $elemMatch: { condition: prev.condition, finish: prev.finish } } },
          { $inc: { 'inventory.$.quantityForSale': prev.quantity } }
        );
      }
      throw new AppError(409, `Insufficient stock for ${item.cardName} — it was just purchased by another user`);
    }

    decremented.push({ card: item.card, condition: item.condition, finish: item.finish, quantity: item.quantity });
  }

  let order;
  try {
    order = await Order.create({
      user: userId,
      orderNumber,
      items: verifiedItems,
      totalAmount,
      shippingAddress,
      phoneNumber,
      courierNotes,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'unpaid',
    });
  } catch (err) {
    // Roll back stock decrements if order creation fails
    for (const prev of decremented) {
      await Card.updateOne(
        { _id: prev.card, inventory: { $elemMatch: { condition: prev.condition, finish: prev.finish } } },
        { $inc: { 'inventory.$.quantityForSale': prev.quantity } }
      );
    }
    throw err;
  }

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
    .sort({ createdAt: -1 })
    .limit(500);

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
