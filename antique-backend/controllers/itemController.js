const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isCollectorRole = (role) => ['user', 'collector'].includes(String(role || '').toLowerCase());

/**
 * @desc    Create a new antique item
 * @route   POST /api/items
 * @access  Private
 */
const createItem = async (req, res) => {
  try {
    const { title, description, category, estimatedAge, estimatedYear, estimatedPeriod, material, dimensions, condition, provenance, estimatedValue, images, metadata } = req.body;

    if (!title || !description || !category || !(estimatedAge || estimatedYear || estimatedPeriod) || !material) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const item = await Item.create({
      owner: req.user._id,
      title,
      description,
      category,
      estimatedAge,
      estimatedYear: estimatedYear || null,
      estimatedPeriod: estimatedPeriod || null,
      material,
      dimensions: dimensions || {},
      condition: condition || 'good',
      provenance: provenance || null,
      estimatedValue: estimatedValue || null,
      images: images || [],
      metadata: metadata || {},
      verificationStatus: 'pending',
    });

    // Populate owner details
    await item.populate('owner', 'username email');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item,
    });
  } catch (error) {
    console.error('Create Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating item',
    });
  }
};

/**
 * @desc    Get all items with pagination and filters
 * @route   GET /api/items
 * @access  Public
 */
const getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, verificationStatus, owner, isSold } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};

    if (category) filter.category = category;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (owner) filter.owner = owner;
    if (isSold !== undefined) {
      filter.isSold = String(isSold).toLowerCase() === 'true';
    }

    const items = await Item.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    const total = await Item.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Items Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching items',
    });
  }
};

/**
 * @desc    Get item by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItemById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('verificationRecord');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get Item By ID Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching item',
    });
  }
};

/**
 * @desc    Get items by owner
 * @route   GET /api/items/owner/:ownerId
 * @access  Public
 */
const getItemsByOwner = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.ownerId)) {
      return res.status(400).json({ success: false, message: 'Invalid owner ID' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const items = await Item.find({ owner: req.params.ownerId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    const total = await Item.countDocuments({ owner: req.params.ownerId });

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Items By Owner Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching owner items',
    });
  }
};

/**
 * @desc    Update item details
 * @route   PUT /api/items/:id
 * @access  Private (Owner only)
 */
const updateItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check ownership (unless user is admin)
    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item',
      });
    }

    // Allowed fields to update
    const allowedFields = [
      'title',
      'description',
      'category',
      'estimatedAge',
      'estimatedYear',
      'estimatedPeriod',
      'material',
      'dimensions',
      'condition',
      'provenance',
      'estimatedValue',
      'images',
      'metadata',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    item = await Item.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating item',
    });
  }
};

/**
 * @desc    Update item verification status
 * @route   PUT /api/items/:id/verification-status
 * @access  Private (Admin/Verifier only)
 */
const updateVerificationStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const { verificationStatus, verificationRecord } = req.body;

    if (!['pending', 'verified', 'rejected', 'in_progress'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status',
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        verificationRecord: verificationRecord || undefined,
      },
      { new: true, runValidators: true }
    ).populate('owner', 'username email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('Update Verification Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating verification status',
    });
  }
};

/**
 * @desc    Save blockchain transaction details
 * @route   PUT /api/items/:id/blockchain
 * @access  Private
 */
const saveBlockchainDetails = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const { blockchainHash, blockchainTransactionHash, blockchainContractAddress } = req.body;

    if (!blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain hash is required',
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        blockchainHash,
        blockchainTransactionHash: blockchainTransactionHash || null,
        blockchainContractAddress: blockchainContractAddress || null,
      },
      { new: true, runValidators: true }
    ).populate('owner', 'username email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blockchain details saved successfully',
      data: item,
    });
  } catch (error) {
    console.error('Save Blockchain Details Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error saving blockchain details',
    });
  }
};

/**
 * @desc    Delete item
 * @route   DELETE /api/items/:id
 * @access  Private (Owner only)
 */
const deleteItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check ownership (unless user is admin)
    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item',
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting item',
    });
  }
};

/**
 * @desc    Search items
 * @route   GET /api/items/search
 * @access  Public
 */
const searchItems = async (req, res) => {
  try {
    const { query, category, minValue, maxValue } = req.query;

    let filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { material: { $regex: query, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minValue || maxValue) {
      filter.estimatedValue = {};
      if (minValue) filter.estimatedValue.$gte = parseFloat(minValue);
      if (maxValue) filter.estimatedValue.$lte = parseFloat(maxValue);
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner', 'username email');

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Search Items Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching items',
    });
  }
};

/**
 * @desc    Get items owned by the authenticated user
 * @route   GET /api/items/my-items
 * @access  Private
 */
const getMyItems = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const items = await Item.find({ owner: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('owner', 'username email')
      .populate('verificationRecord');

    const total = await Item.countDocuments({ owner: req.user._id });

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get My Items Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching your items',
    });
  }
};

/**
 * @desc    Purchase a verified item
 * @route   POST /api/items/:id/purchase
 * @access  Private (Collector only)
 */
const purchaseItem = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!isCollectorRole(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only collector accounts can buy items' });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'Only verified items can be purchased' });
    }

    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You already own this item' });
    }

    if (item.isSold) {
      return res.status(400).json({ success: false, message: 'Item has already been sold' });
    }

    const sellerId = item.owner;
    item.previousOwner = sellerId;
    item.owner = req.user._id;
    item.isSold = true;
    item.soldAt = new Date();
    item.purchaseHistory.push({
      buyer: req.user._id,
      seller: sellerId,
      amount: item.estimatedValue || null,
    });

    await item.save();
    await item.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Item purchased successfully',
      data: item,
    });
  } catch (error) {
    console.error('Purchase Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error purchasing item',
    });
  }
};

/**
 * @desc    Relist owned item to marketplace
 * @route   PUT /api/items/:id/relist
 * @access  Private (Collector owner only)
 */
const relistItem = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!isCollectorRole(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only collector accounts can relist items' });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to relist this item' });
    }

    if (item.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'Only verified items can be listed for sale' });
    }

    item.isSold = false;
    item.soldAt = null;
    await item.save();
    await item.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Item relisted to marketplace successfully',
      data: item,
    });
  } catch (error) {
    console.error('Relist Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error relisting item',
    });
  }
};

/**
 * @desc    Get purchase history for authenticated collector
 * @route   GET /api/items/my-purchases
 * @access  Private
 */
const getMyPurchases = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const items = await Item.find({ 'purchaseHistory.buyer': req.user._id })
      .sort({ soldAt: -1 })
      .populate('owner', 'username email');

    const purchasedItems = items.map((item) => {
      const latestRecord = [...item.purchaseHistory]
        .reverse()
        .find((entry) => entry.buyer && entry.buyer.toString() === req.user._id.toString());

      return {
        ...item.toObject(),
        purchasedAt: latestRecord?.purchasedAt || item.soldAt || null,
        purchaseAmount: latestRecord?.amount ?? item.estimatedValue ?? null,
      };
    });

    res.status(200).json({
      success: true,
      count: purchasedItems.length,
      data: purchasedItems,
    });
  } catch (error) {
    console.error('Get My Purchases Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchase history',
    });
  }
};

module.exports = {
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
};
