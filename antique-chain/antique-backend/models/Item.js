const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide an owner'],
    },
    title: {
      type: String,
      required: [true, 'Please provide item title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide item description'],
    },
    category: {
      type: String,
      enum: [
        'furniture',
        'artwork',
        'jewelry',
        'collectibles',
        'ceramics',
        'textiles',
        'metalware',
        'timepieces',
        'books',
        'other',
      ],
      required: [true, 'Please select a category'],
    },
    estimatedAge: {
      type: Number,
      default: null,
    },
    estimatedYear: {
      type: Number,
      default: null,
    },
    estimatedPeriod: {
      type: String,
      default: null,
    },
    material: {
      type: String,
      required: [true, 'Please provide material information'],
    },
    dimensions: {
      length: {
        type: Number,
        default: null,
      },
      width: {
        type: Number,
        default: null,
      },
      height: {
        type: Number,
        default: null,
      },
      unit: {
        type: String,
        enum: ['cm', 'inch', 'mm'],
        default: 'cm',
      },
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good',
    },
    provenance: {
      type: String,
      default: null,
    },
    estimatedValue: {
      type: Number,
      default: null,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'in_progress'],
      default: 'pending',
    },
    verificationRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationRecord',
      default: null,
    },
    blockchainHash: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    blockchainTransactionHash: {
      type: String,
      default: null,
    },
    blockchainContractAddress: {
      type: String,
      default: null,
    },
    blockchainNetwork: {
      type: String,
      default: null,
    },
    metadata: {
      customFields: mongoose.Schema.Types.Mixed,
      notes: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
itemSchema.index({ owner: 1, createdAt: -1 });
itemSchema.index({ verificationStatus: 1 });
itemSchema.index({ blockchainHash: 1 });

// Pre-save hook to populate owner details if needed
itemSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate('owner', 'username email');
  this.options._recursed = true;
  next();
});

module.exports = mongoose.model('Item', itemSchema);
