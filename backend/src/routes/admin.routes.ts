import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createCard,
  updateCard,
  deleteCard,
  getAdminCards,
  getStats,
  bulkUploadCards,
} from '../controllers/admin.controller';
import { uploadSetJson } from '../controllers/set.controller';

const router = Router();

// Configure multer for CSV upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// All admin routes require authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/admin/cards
 * @desc    Get all cards (admin view with filters)
 * @access  Private (Admin)
 */
router.get('/cards', getAdminCards);

/**
 * @route   POST /api/admin/cards
 * @desc    Create a new card
 * @access  Private (Admin)
 */
router.post('/cards', createCard);

/**
 * @route   PUT /api/admin/cards/:id
 * @desc    Update a card
 * @access  Private (Admin)
 */
router.put('/cards/:id', updateCard);

/**
 * @route   DELETE /api/admin/cards/:id
 * @desc    Delete a card (soft delete)
 * @access  Private (Admin)
 */
router.delete('/cards/:id', deleteCard);

/**
 * @route   POST /api/admin/cards/bulk-upload
 * @desc    Bulk upload cards from CSV
 * @access  Private (Admin)
 */
router.post('/cards/bulk-upload', upload.single('file'), bulkUploadCards);

/**
 * @route   POST /api/admin/sets/upload
 * @desc    Upload a complete set from MTGJson format
 * @access  Private (Admin)
 */
router.post('/sets/upload', uploadSetJson);

export default router;
