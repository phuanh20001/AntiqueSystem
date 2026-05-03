const mongoose = require('mongoose');
const VerificationRecord = require('../models/VerificationRecord');
const Item = require('../models/Item');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new verification record
 * @route   POST /api/verification-records
 * @access  Private
 */
const createVerificationRecord = async (req, res) => {
  try {
    const { item, verificationMethod, authenticationScore, details } = req.body;

    if (!item || !verificationMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide item and verification method',
      });
    }

    if (!isValidObjectId(item)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID',
      });
    }

    // Check if item exists
    const itemExists = await Item.findById(item);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const verificationRecord = await VerificationRecord.create({
      item,
      verifier: req.user._id,
      verificationMethod,
      authenticationScore: authenticationScore || null,
      verificationDetails: details || {},
      status: 'pending',
      timeline: [
        {
          event: 'created',
          description: 'Verification record created',
          performedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
    });

    // Link verification record to item
    await Item.findByIdAndUpdate(item, {
      verificationRecord: verificationRecord._id,
      verificationStatus: 'in_progress',
    });

    await verificationRecord.populate('item').populate('verifier', 'username email');

    res.status(201).json({
      success: true,
      message: 'Verification record created successfully',
      data: verificationRecord,
    });
  } catch (error) {
    console.error('Create Verification Record Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating verification record',
    });
  }
};

/**
 * @desc    Get all verification records
 * @route   GET /api/verification-records
 * @access  Public
 */
const getAllVerificationRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, verificationMethod } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};

    if (status) filter.status = status;
    if (verificationMethod) filter.verificationMethod = verificationMethod;

    const records = await VerificationRecord.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('item')
      .populate('verifier', 'username email');

    const total = await VerificationRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Verification Records Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching verification records',
    });
  }
};

/**
 * @desc    Get verification record by ID
 * @route   GET /api/verification-records/:id
 * @access  Public
 */
const getVerificationRecordById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification record ID' });
    }

    const record = await VerificationRecord.findById(req.params.id)
      .populate('item')
      .populate('verifier', 'username email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Get Verification Record By ID Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching verification record',
    });
  }
};

/**
 * @desc    Get verification record by item ID
 * @route   GET /api/verification-records/item/:itemId
 * @access  Public
 */
const getVerificationRecordByItem = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const record = await VerificationRecord.findOne({ item: req.params.itemId })
      .populate('item')
      .populate('verifier', 'username email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No verification record found for this item',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Get Verification Record By Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching verification record',
    });
  }
};

/**
 * @desc    Update verification record
 * @route   PUT /api/verification-records/:id
 * @access  Private (Verifier only)
 */
const updateVerificationRecord = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification record ID' });
    }

    const { status, authenticationScore, verificationDetails, blockchainDetails, rejectionReason } = req.body;

    let record = await VerificationRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found',
      });
    }

    // Update record fields
    if (status) record.status = status;
    if (authenticationScore !== undefined) record.authenticationScore = authenticationScore;
    if (verificationDetails) record.verificationDetails = { ...record.verificationDetails, ...verificationDetails };
    if (blockchainDetails) record.blockchainDetails = { ...record.blockchainDetails, ...blockchainDetails };
    if (rejectionReason) record.rejectionReason = rejectionReason;

    // Add timeline entry
    record.timeline.push({
      event: status || 'updated',
      description: `Verification record updated by ${req.user.username}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    record = await record.save();

    // Update item verification status
    if (status === 'approved') {
      await Item.findByIdAndUpdate(record.item, { verificationStatus: 'verified' });
    } else if (status === 'rejected') {
      await Item.findByIdAndUpdate(record.item, { verificationStatus: 'rejected' });
    }

    await record.populate('item').populate('verifier', 'username email');

    res.status(200).json({
      success: true,
      message: 'Verification record updated successfully',
      data: record,
    });
  } catch (error) {
    console.error('Update Verification Record Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating verification record',
    });
  }
};

/**
 * @desc    Save blockchain verification details
 * @route   PUT /api/verification-records/:id/blockchain
 * @access  Private
 */
const saveBlockchainVerificationDetails = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid verification record ID' });
    }

    const { transactionHash, blockNumber, metadataHash, contractAddress, network, status } = req.body;

    if (!transactionHash || !metadataHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash and metadata hash are required',
      });
    }

    let record = await VerificationRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found',
      });
    }

    // Update blockchain details
    record.blockchainDetails = {
      transactionHash,
      blockNumber: blockNumber || null,
      metadataHash,
      contractAddress: contractAddress || null,
      timestamp: new Date(),
      status: status || 'confirmed',
    };

    // Add timeline entry
    record.timeline.push({
      event: 'blockchain_recorded',
      description: `Verification recorded on blockchain - TxHash: ${transactionHash}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    record = await record.save();

    // Update item with blockchain details
    await Item.findByIdAndUpdate(record.item, {
      blockchainHash: metadataHash,
      blockchainTransactionHash: transactionHash,
      blockchainContractAddress: contractAddress || null,
      blockchainNetwork: network || null,
    });

    await record.populate('item').populate('verifier', 'username email');

    res.status(200).json({
      success: true,
      message: 'Blockchain verification details saved successfully',
      data: record,
    });
  } catch (error) {
    console.error('Save Blockchain Verification Details Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error saving blockchain details',
    });
  }
};

/**
 * @desc    Approve verification record
 * @route   PUT /api/verification-records/:id/approve
 * @access  Private (Verifier only)
 */
const approveVerificationRecord = async (req, res) => {
  try {
    const { authenticationScore, certificateNumber, expertOpinion, recommendedValue } = req.body;

    let record = await VerificationRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found',
      });
    }

    record.status = 'approved';
    record.authenticationScore = authenticationScore || record.authenticationScore;
    record.verificationDetails = {
      ...record.verificationDetails,
      expertOpinion: expertOpinion || record.verificationDetails?.expertOpinion,
      recommendedValue: recommendedValue || record.verificationDetails?.recommendedValue,
    };

    if (certificateNumber) {
      record.authenticityCertificate = {
        ...record.authenticityCertificate,
        certificateNumber,
        issueDate: new Date(),
      };
    }

    record.timeline.push({
      event: 'approved',
      description: `Verification approved by ${req.user.username}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    record = await record.save();

    // Update item status
    await Item.findByIdAndUpdate(record.item, { verificationStatus: 'verified' });

    await record.populate('item').populate('verifier', 'username email');

    res.status(200).json({
      success: true,
      message: 'Verification record approved successfully',
      data: record,
    });
  } catch (error) {
    console.error('Approve Verification Record Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error approving verification record',
    });
  }
};

/**
 * @desc    Reject verification record
 * @route   PUT /api/verification-records/:id/reject
 * @access  Private (Verifier only)
 */
const rejectVerificationRecord = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason',
      });
    }

    let record = await VerificationRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found',
      });
    }

    record.status = 'rejected';
    record.rejectionReason = rejectionReason;

    record.timeline.push({
      event: 'rejected',
      description: `Verification rejected by ${req.user.username}: ${rejectionReason}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    record = await record.save();

    // Update item status
    await Item.findByIdAndUpdate(record.item, { verificationStatus: 'rejected' });

    await record.populate('item').populate('verifier', 'username email');

    res.status(200).json({
      success: true,
      message: 'Verification record rejected successfully',
      data: record,
    });
  } catch (error) {
    console.error('Reject Verification Record Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting verification record',
    });
  }
};

module.exports = {
  createVerificationRecord,
  getAllVerificationRecords,
  getVerificationRecordById,
  getVerificationRecordByItem,
  updateVerificationRecord,
  saveBlockchainVerificationDetails,
  approveVerificationRecord,
  rejectVerificationRecord,
};
