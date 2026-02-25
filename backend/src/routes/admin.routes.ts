import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createCard,
  updateCard,
  deleteCard,
  getAdminCards,
  getStats,
  getSets,
  getSetsWithMissingImages,
  bulkUploadCards,
  clearDatabase,
  fixSellerNames,
  regenerateSellerSKUs,
  fixInventoryQuantities,
  fixDfcImageUrls,
  cleanupCombinedNames,
} from '../controllers/admin.controller';
import { uploadSetJson, importSetFromMTGJson } from '../controllers/set.controller';

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
 * @route   GET /api/admin/sets
 * @desc    Get all unique sets
 * @access  Private (Admin)
 */
router.get('/sets', getSets);

/**
 * @route   GET /api/admin/sets/missing-images
 * @desc    Get all sets with missing card images
 * @access  Private (Admin)
 */
router.get('/sets/missing-images', getSetsWithMissingImages);

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

/**
 * @route   POST /api/admin/sets/import-from-mtgjson
 * @desc    Fetch set from MTGJson CDN and import it server-side
 * @access  Private (Admin)
 */
router.post('/sets/import-from-mtgjson', importSetFromMTGJson);

/**
 * @route   POST /api/admin/clear-database
 * @desc    Clear entire database (cards, non-admin users, carts)
 * @access  Private (Admin)
 */
router.post('/clear-database', clearDatabase);

/**
 * @route   POST /api/admin/fix-seller-names
 * @desc    Update all inventory items with correct seller names
 * @access  Private (Admin)
 */
router.post('/fix-seller-names', fixSellerNames);

/**
 * @route   POST /api/admin/regenerate-seller-skus
 * @desc    Regenerate seller SKUs for all cards (SetCode-CollectorNumber-FoilType-LanguageCode-Rarity)
 * @access  Private (Admin)
 */
router.post('/regenerate-seller-skus', regenerateSellerSKUs);

/**
 * @route   POST /api/admin/fix-inventory-quantities
 * @desc    Fix NaN and invalid quantityForSale values in all inventory items
 * @access  Private (Admin)
 */
router.post('/fix-inventory-quantities', fixInventoryQuantities);
router.post('/fix-dfc-image-urls', fixDfcImageUrls);
router.post('/cleanup-combined-names', cleanupCombinedNames);

export default router;
