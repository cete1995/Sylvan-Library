import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getUserOrders,
  getOrderById,
  createOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller';

const router = Router();

// Customer routes (authenticated)
router.use(authenticate);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);

// Admin routes
router.get('/admin/all', requireAdmin, getAllOrders);
router.put('/admin/:id', requireAdmin, updateOrderStatus);

export default router;
