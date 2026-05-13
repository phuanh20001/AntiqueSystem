/**
 * Ticket Model
 * Defines the schema for support tickets in the AntiqChain system.
 * Collectors and verifiers can submit tickets to administrators.
 */
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ticket must have a submitter'],
  },
  subject: {
    type: String,
    required: [true, 'Please provide a ticket subject'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters'],
    maxlength: [120, 'Subject cannot exceed 120 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a ticket description'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    enum: ['account', 'verification', 'marketplace', 'technical', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [2000, 'Admin response cannot exceed 2000 characters'],
    default: null,
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  respondedAt: {
    type: Date,
    default: null,
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null,
  },
}, { timestamps: true });

// Index for efficient queries
ticketSchema.index({ submittedBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
