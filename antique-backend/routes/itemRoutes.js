const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  getItemsByOwner,
  getMyItems,
  getMyPurchases,
  purchaseItem,
  relistItem,
  updateItem,
  updateVerificationStatus,
  saveBlockchainDetails,
  deleteItem,
  searchItems,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public routes
 */
router.get('/', getAllItems);
router.get('/search', searchItems);

/**
 * Protected routes (must come before :id route)
 */
router.get('/my-items', protect, getMyItems);
router.get('/my-purchases', protect, getMyPurchases);

/**
 * Public routes with ID parameter
 */
router.get('/:id', getItemById);
router.get('/owner/:ownerId', getItemsByOwner);

/**
 * Protected routes for modification
 */
router.post('/', protect, createItem);
router.post('/:id/purchase', protect, purchaseItem);
router.put('/:id/relist', protect, relistItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

/**
 * Verification routes
 */
router.put('/:id/verification-status', protect, updateVerificationStatus);
router.put('/:id/blockchain', protect, saveBlockchainDetails);

module.exports = router;
