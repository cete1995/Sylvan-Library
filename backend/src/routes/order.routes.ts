import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/order.controller';

const router = Router();

// Limit order creation: max 10 orders per 15 minutes per IP
const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many orders placed. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Customer routes (authenticated)
router.use(authenticate);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/', orderCreateLimiter, createOrder);

// Admin routes
router.put('/admin/:id', requireAdmin, updateOrderStatus);

export default router;
