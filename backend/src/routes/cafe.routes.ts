import { Router } from 'express';
import { getCafeSettings } from '../controllers/cafe.controller';

const router = Router();

// Public — no auth required
router.get('/settings', getCafeSettings);

export default router;
