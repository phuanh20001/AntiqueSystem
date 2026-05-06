const Item = require('../models/Item');
const VerificationRecord = require('../models/VerificationRecord');
const User = require('../models/User');

/**
 * Get comprehensive item details with all related records
 * @param {String} itemId - MongoDB item ID
 * @returns {Object} Complete item with verification details
 */
const getItemWithDetails = async (itemId) => {
  try {
    const item = await Item.findById(itemId)
      .populate('owner', 'username email role')
      .populate({
        path: 'verificationRecord',
        populate: {
          path: 'verifier',
          select: 'username email',
        },
      });

    return item;
  } catch (error) {
    console.error('Error fetching item details:', error);
    throw error;
  }
};

/**
 * Get all pending items for verification
 * @param {Number} limit - Number of items to return
 * @returns {Array} Array of pending items
 */
const getPendingItems = async (limit = 10) => {
  try {
    const items = await Item.find({ verificationStatus: 'pending' })
      .limit(limit)
      .sort({ createdAt: 1 })
      .populate('owner', 'username email');

    return items;
  } catch (error) {
    console.error('Error fetching pending items:', error);
    throw error;
  }
};

/**
 * Get all verified items
 * @param {Number} limit - Number of items to return
 * @returns {Array} Array of verified items
 */
const getVerifiedItems = async (limit = 10) => {
  try {
    const items = await Item.find({ verificationStatus: 'verified' })
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    return items;
  } catch (error) {
    console.error('Error fetching verified items:', error);
    throw error;
  }
};

/**
 * Get all rejected items
 * @returns {Array} Array of rejected items
 */
const getRejectedItems = async () => {
  try {
    const items = await Item.find({ verificationStatus: 'rejected' })
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    return items;
  } catch (error) {
    console.error('Error fetching rejected items:', error);
    throw error;
  }
};

/**
 * Get statistics about items
 * @returns {Object} Statistics object
 */
const getItemStatistics = async () => {
  try {
    const stats = await Item.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalItems = await Item.countDocuments();
    const totalUsers = await User.countDocuments();
    const verifiedItems = await Item.countDocuments({ verificationStatus: 'verified' });

    return {
      totalItems,
      totalUsers,
      verifiedItems,
      byStatus: stats,
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

/**
 * Get items by category
 * @param {String} category - Item category
 * @param {Number} limit - Number of items to return
 * @returns {Array} Items in category
 */
const getItemsByCategory = async (category, limit = 20) => {
  try {
    const items = await Item.find({ category })
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('owner', 'username email');

    return items;
  } catch (error) {
    console.error('Error fetching items by category:', error);
    throw error;
  }
};

/**
 * Get items within a value range
 * @param {Number} minValue - Minimum estimated value
 * @param {Number} maxValue - Maximum estimated value
 * @returns {Array} Items within value range
 */
const getItemsByValueRange = async (minValue, maxValue) => {
  try {
    const items = await Item.find({
      estimatedValue: { $gte: minValue, $lte: maxValue },
    })
      .sort({ estimatedValue: -1 })
      .populate('owner', 'username email');

    return items;
  } catch (error) {
    console.error('Error fetching items by value range:', error);
    throw error;
  }
};

/**
 * Get verification statistics
 * @returns {Object} Verification statistics
 */
const getVerificationStatistics = async () => {
  try {
    const stats = await VerificationRecord.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$authenticationScore' },
        },
      },
    ]);

    const totalRecords = await VerificationRecord.countDocuments();
    const byMethod = await VerificationRecord.aggregate([
      {
        $group: {
          _id: '$verificationMethod',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalRecords,
      byStatus: stats,
      byMethod,
    };
  } catch (error) {
    console.error('Error fetching verification statistics:', error);
    throw error;
  }
};

/**
 * Get user's verification history
 * @param {String} userId - User ID
 * @returns {Array} Verification records by user
 */
const getUserVerificationHistory = async (userId) => {
  try {
    const records = await VerificationRecord.find({ verifier: userId })
      .sort({ createdAt: -1 })
      .populate('item')
      .populate('verifier', 'username email');

    return records;
  } catch (error) {
    console.error('Error fetching user verification history:', error);
    throw error;
  }
};

/**
 * Get items with blockchain records
 * @param {Number} limit - Number of items to return
 * @returns {Array} Items with blockchain details
 */
const getBlockchainVerifiedItems = async (limit = 20) => {
  try {
    const items = await Item.find({
      blockchainHash: { $exists: true, $ne: null },
      blockchainTransactionHash: { $exists: true, $ne: null },
    })
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    return items;
  } catch (error) {
    console.error('Error fetching blockchain verified items:', error);
    throw error;
  }
};

/**
 * Get items pending blockchain confirmation
 * @returns {Array} Items pending blockchain confirmation
 */
const getPendingBlockchainItems = async () => {
  try {
    const records = await VerificationRecord.find({
      'blockchainDetails.status': { $in: ['pending', null] },
    })
      .populate('item')
      .populate('verifier', 'username email');

    return records;
  } catch (error) {
    console.error('Error fetching pending blockchain items:', error);
    throw error;
  }
};

/**
 * Find item by blockchain hash
 * @param {String} blockchainHash - SHA-256 hash
 * @returns {Object} Item with matching hash
 */
const findItemByBlockchainHash = async (blockchainHash) => {
  try {
    const item = await Item.findOne({ blockchainHash })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    return item;
  } catch (error) {
    console.error('Error finding item by blockchain hash:', error);
    throw error;
  }
};

/**
 * Get user's items with verification summary
 * @param {String} userId - User ID
 * @returns {Array} User's items with verification details
 */
const getUserItemsSummary = async (userId) => {
  try {
    const items = await Item.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'verificationRecord',
        select: 'status authenticationScore blockchainDetails',
      });

    return items;
  } catch (error) {
    console.error('Error fetching user items summary:', error);
    throw error;
  }
};

/**
 * Bulk update verification status
 * @param {Array} itemIds - Array of item IDs
 * @param {String} newStatus - New verification status
 * @returns {Object} Update result
 */
const bulkUpdateVerificationStatus = async (itemIds, newStatus) => {
  try {
    const result = await Item.updateMany(
      { _id: { $in: itemIds } },
      { verificationStatus: newStatus }
    );

    return result;
  } catch (error) {
    console.error('Error bulk updating verification status:', error);
    throw error;
  }
};

/**
 * Get items with authentication score above threshold
 * @param {Number} threshold - Authentication score threshold
 * @returns {Array} High-confidence verified items
 */
const getHighConfidenceItems = async (threshold = 80) => {
  try {
    const items = await Item.aggregate([
      {
        $lookup: {
          from: 'verificationrecords',
          localField: 'verificationRecord',
          foreignField: '_id',
          as: 'verification',
        },
      },
      {
        $match: {
          'verification.authenticationScore': { $gte: threshold },
        },
      },
      {
        $sort: { 'verification.authenticationScore': -1 },
      },
    ]);

    return items;
  } catch (error) {
    console.error('Error fetching high confidence items:', error);
    throw error;
  }
};

module.exports = {
  getItemWithDetails,
  getPendingItems,
  getVerifiedItems,
  getRejectedItems,
  getItemStatistics,
  getItemsByCategory,
  getItemsByValueRange,
  getVerificationStatistics,
  getUserVerificationHistory,
  getBlockchainVerifiedItems,
  getPendingBlockchainItems,
  findItemByBlockchainHash,
  getUserItemsSummary,
  bulkUpdateVerificationStatus,
  getHighConfidenceItems,
};
