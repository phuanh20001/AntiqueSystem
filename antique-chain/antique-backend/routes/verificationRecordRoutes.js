const express = require('express');
const router = express.Router();
const {
  createVerificationRecord,
  getAllVerificationRecords,
  getVerificationRecordById,
  getVerificationRecordByItem,
  updateVerificationRecord,
  saveBlockchainVerificationDetails,
  approveVerificationRecord,
  rejectVerificationRecord,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public routes
 */
router.get('/', getAllVerificationRecords);
router.get('/item/:itemId', getVerificationRecordByItem);
router.get('/:id', getVerificationRecordById);

/**
 * Protected routes
 */
router.post('/', protect, createVerificationRecord);
router.put('/:id', protect, updateVerificationRecord);
router.put('/:id/blockchain', protect, saveBlockchainVerificationDetails);
router.put('/:id/approve', protect, approveVerificationRecord);
router.put('/:id/reject', protect, rejectVerificationRecord);

module.exports = router;
