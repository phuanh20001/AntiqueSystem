const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isCollectorRole = (role) => ['user', 'collector'].includes(String(role || '').toLowerCase());

// "No record found" is a normal contract revert when an item has not been verified yet —
// we treat it as an absent record rather than a hard failure.
const isAbsentRecordError = (message) => /no\s+record/i.test(String(message || ''));

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
 *
 * For terminal decisions ('verified' or 'rejected') this endpoint also
 * commits the verdict to the Ethereum (Sepolia) smart contract. We refuse
 * to set the off-chain status if the on-chain transaction fails — that
 * way a "verified" badge always implies a publicly auditable chain record.
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

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    let blockchainResult = null;
    const isTerminalDecision =
      verificationStatus === 'verified' || verificationStatus === 'rejected';

    if (isTerminalDecision && blockchainService.contract) {
      const isAuthentic = verificationStatus === 'verified';
      const canonical = blockchainService.buildItemCanonicalData(item);
      const metadataHash = blockchainService.generateMetadataHash(canonical);

      try {
        // The contract reverts on duplicate verification, so check first.
        const alreadyOnChain = await blockchainService
          .isItemVerifiedOnChain(req.params.id)
          .catch(() => false);

        if (alreadyOnChain) {
          blockchainResult = { alreadyOnChain: true };
        } else {
          console.log(
            `[itemController] Submitting verification to chain — item=${req.params.id}, decision=${verificationStatus}`
          );
          const submission = await blockchainService.submitVerificationToBlockchain(
            req.params.id,
            isAuthentic,
            metadataHash
          );

          item.blockchainHash = metadataHash;
          item.blockchainTransactionHash = submission.txHash;
          item.blockchainContractAddress = process.env.CONTRACT_ADDRESS || null;
          item.blockchainNetwork = process.env.ALCHEMY_SEPOLIA_URL ? 'sepolia' : null;

          blockchainResult = {
            txHash: submission.txHash,
            metadataHash,
            etherscanUrl: blockchainService.getEtherscanUrl(submission.txHash),
            contractAddress: process.env.CONTRACT_ADDRESS || null,
            network: 'sepolia',
          };
        }
      } catch (err) {
        console.error('[itemController] Blockchain submission failed:', err);
        // Refuse the off-chain status update if the on-chain commit failed —
        // we don't want to silently produce a "verified" item with no chain proof.
        return res.status(502).json({
          success: false,
          message: `Blockchain submission failed: ${err.message || err}`,
        });
      }
    }

    item.verificationStatus = verificationStatus;
    if (verificationRecord) {
      item.verificationRecord = verificationRecord;
    }

    await item.save();
    await item.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: item,
      blockchain: blockchainResult,
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
 * @desc    Get full blockchain proof for an item
 * @route   GET /api/items/:id/proof
 * @access  Public
 *
 * Compares the metadata hash stored off-chain (MongoDB) with the metadata
 * hash currently on-chain. If they differ, something has been tampered
 * with on either side. The response also bundles Etherscan deep-links so
 * the client can show a "view on chain" proof in one click.
 */
const getItemBlockchainProof = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('verificationRecord');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    let onChainRecord = null;
    let onChainError = null;
    let onChainStatus = 'error';

    if (!blockchainService.contract) {
      onChainError = 'Blockchain contract is not configured on the server';
    } else {
      try {
        onChainRecord = await blockchainService.getVerificationFromChain(req.params.id);
        onChainStatus = onChainRecord && onChainRecord.exists ? 'present' : 'absent';
      } catch (err) {
        const msg = err.message || 'Failed to read from blockchain';
        if (isAbsentRecordError(msg)) {
          onChainStatus = 'absent';
        } else {
          onChainError = msg;
        }
      }
    }

    const offChainHash = item.blockchainHash || null;
    const onChainHash = onChainRecord ? onChainRecord.metadataHash : null;

    // Recompute the hash from the CURRENT item snapshot. If this differs
    // from what's on-chain, the off-chain Item document has been tampered
    // with after verification (someone edited title/description/etc.).
    const recomputedCanonical = blockchainService.buildItemCanonicalData(item);
    const recomputedHash = blockchainService.generateMetadataHash(recomputedCanonical);

    let hashMatches = null;
    if (offChainHash && onChainHash) {
      hashMatches = offChainHash === onChainHash;
    }

    let recomputedMatches = null;
    if (recomputedHash && onChainHash) {
      recomputedMatches = recomputedHash === onChainHash;
    }

    const contractAddress =
      process.env.CONTRACT_ADDRESS || item.blockchainContractAddress || null;
    const network =
      item.blockchainNetwork || (process.env.ALCHEMY_SEPOLIA_URL ? 'sepolia' : null);
    const txHash = item.blockchainTransactionHash || null;
    const etherscanTxUrl = txHash
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : null;
    const etherscanContractUrl = contractAddress
      ? `https://sepolia.etherscan.io/address/${contractAddress}`
      : null;

    res.status(200).json({
      success: true,
      data: {
        item: {
          _id: item._id,
          title: item.title,
          verificationStatus: item.verificationStatus,
          owner: item.owner
            ? { username: item.owner.username, email: item.owner.email }
            : null,
        },
        onChainStatus,
        onChainRecord,
        onChainError,
        offChainHash,
        onChainHash,
        recomputedHash,
        hashMatches,
        recomputedMatches,
        contractAddress,
        network,
        txHash,
        etherscanTxUrl,
        etherscanContractUrl,
      },
    });
  } catch (error) {
    console.error('Get Item Blockchain Proof Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching blockchain proof',
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

/**
 * @desc    Admin: clear on-chain verification and reset item to pending for re-review
 * @route   POST /api/items/:id/revoke-verification
 * @access  Private (Admin only)
 *
 * Calls revokeVerification on the contract when a record exists; always clears
 * blockchain pointer fields on the Item and sets verificationStatus to pending.
 */
const revokeItemVerification = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const status = String(item.verificationStatus || '').toLowerCase();
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Only verified or rejected items can be reversed',
      });
    }

    let revocationTxHash = null;
    let etherscanUrl = null;

    if (blockchainService.contract) {
      const onChain = await blockchainService
        .isItemVerifiedOnChain(req.params.id)
        .catch(() => false);

      if (onChain) {
        try {
          const submission = await blockchainService.revokeVerificationOnChain(req.params.id);
          revocationTxHash = submission.txHash;
          etherscanUrl = blockchainService.getEtherscanUrl(submission.txHash);
        } catch (err) {
          console.error('[itemController] On-chain revoke failed:', err);
          return res.status(502).json({
            success: false,
            message: `Blockchain revoke failed: ${err.message || err}`,
          });
        }
      }
    }

    item.blockchainHash = null;
    item.blockchainTransactionHash = null;
    item.blockchainContractAddress = null;
    item.blockchainNetwork = null;
    item.verificationStatus = 'pending';
    item.verificationRecord = null;

    await item.save();
    await item.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Verification reversed; item reset to pending for re-review',
      data: item,
      revocationTxHash,
      etherscanUrl,
    });
  } catch (error) {
    console.error('Revoke Item Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error revoking verification',
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
  getItemBlockchainProof,
  revokeItemVerification,
  deleteItem,
  searchItems,
};
