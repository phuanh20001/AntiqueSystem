const mongoose = require('mongoose');

const verificationRecordSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Please provide an item'],
    },
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'resubmitted'],
      default: 'pending',
    },
    verificationMethod: {
      type: String,
      enum: ['blockchain', 'manual', 'expert_review', 'ai_analysis'],
      default: 'blockchain',
    },
    authenticationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    authenticityCertificate: {
      certificateNumber: String,
      issueDate: Date,
      expiryDate: Date,
      url: String,
    },
    blockchainDetails: {
      transactionHash: String,
      blockNumber: Number,
      contractAddress: String,
      metadataHash: String,
      network: String,
      timestamp: Date,
      gasUsed: String,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending',
      },
    },
    verificationDetails: {
      authenticityComments: String,
      condition: String,
      rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'extremely_rare'],
        default: null,
      },
      historicalSignificance: String,
      expertOpinion: String,
      recommendedValue: Number,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    attachments: [
      {
        type: String, // URL to verification report, certificate, etc.
        description: String,
      },
    ],
    timeline: [
      {
        event: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    metadata: {
      customFields: mongoose.Schema.Types.Mixed,
      notes: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
verificationRecordSchema.index({ item: 1 });
verificationRecordSchema.index({ status: 1 });
verificationRecordSchema.index({ createdAt: -1 });
verificationRecordSchema.index({ 'blockchainDetails.transactionHash': 1 });

// Pre-save hook to populate item and verifier
verificationRecordSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate('item').populate('verifier', 'username email');
  this.options._recursed = true;
  next();
});

module.exports = mongoose.model('VerificationRecord', verificationRecordSchema);
