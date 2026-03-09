import { Request, Response } from 'express';
import { Cart, Card } from '../models';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  let cart = await Cart.findOne({ user: userId }).populate('items.card');
  
  if (!cart) {
    // Create empty cart if doesn't exist
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Always sync prices from current inventory
  let needsSave = false;
  for (const item of cart.items) {
    if (item.card && (item.card as any).inventory) {
      const cardInventory = (item.card as any).inventory;
      const currentInventory = cardInventory[item.inventoryIndex];
      
      if (currentInventory) {
        let newPrice = currentInventory.sellPrice;
        
        // If current inventory has price 0, find another inventory with same condition/finish but with price > 0
        if (newPrice === 0) {
          const matchingWithPrice = cardInventory.find((inv: any) =>
            inv.condition === currentInventory.condition &&
            inv.finish === currentInventory.finish &&
            inv.sellPrice > 0
          );
          
          if (matchingWithPrice) {
            newPrice = matchingWithPrice.sellPrice;
          }
        }
        
        // Update price if different
        if (item.price !== newPrice) {
          item.price = newPrice;
          needsSave = true;
        }
      }
    }
  }
  
  if (needsSave) {
    await cart.save();
    await cart.populate('items.card');
  }

  res.json({ cart });
});

/**
 * Add item to cart
 * POST /api/cart
 */
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { cardId, inventoryIndex, quantity = 1 } = req.body;

  if (!cardId || inventoryIndex === undefined) {
    throw new AppError(400, 'Card ID and inventory index are required');
  }

  // Verify card exists and get inventory item
  const card = await Card.findById(cardId);
  if (!card) {
    throw new AppError(404, 'Card not found');
  }

  const inventory = card.inventory || [];
  if (inventoryIndex < 0 || inventoryIndex >= inventory.length) {
    throw new AppError(400, 'Invalid inventory index');
  }

  const inventoryItem = inventory[inventoryIndex];

  // If the selected inventory has price 0, try to find a matching inventory with price > 0
  let priceToUse = inventoryItem.sellPrice;
  if (priceToUse === 0) {
    const matchingWithPrice = inventory.find((inv: any) =>
      inv.condition === inventoryItem.condition &&
      inv.finish === inventoryItem.finish &&
      inv.sellPrice > 0
    );
    if (matchingWithPrice) {
      priceToUse = matchingWithPrice.sellPrice;
    }
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Check if this exact item (card + inventory index) already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.card.toString() === cardId && item.inventoryIndex === inventoryIndex
  );

  // Calculate total quantity (existing + new)
  const existingQuantity = existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : 0;
  const totalQuantity = existingQuantity + quantity;
  
  // Check if enough quantity available
  if (inventoryItem.quantityForSale < totalQuantity) {
    if (existingQuantity > 0) {
      throw new AppError(400, `Only ${inventoryItem.quantityForSale} available. You already have ${existingQuantity} in your cart.`);
    } else {
      throw new AppError(400, `Only ${inventoryItem.quantityForSale} available in stock.`);
    }
  }

  if (existingItemIndex >= 0) {
    // Update quantity
    cart.items[existingItemIndex].quantity = totalQuantity;
    // Update price if it was 0
    if (cart.items[existingItemIndex].price === 0 && priceToUse > 0) {
      cart.items[existingItemIndex].price = priceToUse;
    }
  } else {
    // Add new item
    cart.items.push({
      card: cardId,
      inventoryIndex,
      quantity,
      price: priceToUse,
    });
  }

  await cart.save();
  await cart.populate('items.card');

  res.json({
    message: 'Item added to cart',
    cart,
  });
});

/**
 * Update cart item quantity
 * PUT /api/cart/:itemId
 */
export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    throw new AppError(400, 'Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new AppError(404, 'Item not found in cart');
  }

  // Verify quantity available
  const card = await Card.findById(item.card);
  if (card && card.inventory[item.inventoryIndex]) {
    const available = card.inventory[item.inventoryIndex].quantityForSale;
    if (quantity > available) {
      throw new AppError(400, `Only ${available} available in stock.`);
    }
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.card');

  res.json({
    message: 'Cart updated',
    cart,
  });
});

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  cart.items = cart.items.filter(item => item._id?.toString() !== itemId) as any;
  await cart.save();
  await cart.populate('items.card');

  res.json({
    message: 'Item removed from cart',
    cart,
  });
});

/**
 * Clear cart
 * DELETE /api/cart
 */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  cart.items = [] as any;
  await cart.save();

  res.json({
    message: 'Cart cleared',
    cart,
  });
});
