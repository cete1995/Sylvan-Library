import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/order.controller';

const router = Router();

// Customer routes (authenticated)
router.use(authenticate);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);

// Admin routes
router.put('/admin/:id', requireAdmin, updateOrderStatus);

export default router;
