const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  getItemsByOwner,
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
router.get('/:id', getItemById);
router.get('/owner/:ownerId', getItemsByOwner);

/**
 * Protected routes
 */
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

/**
 * Verification routes
 */
router.put('/:id/verification-status', protect, updateVerificationStatus);
router.put('/:id/blockchain', protect, saveBlockchainDetails);

module.exports = router;
