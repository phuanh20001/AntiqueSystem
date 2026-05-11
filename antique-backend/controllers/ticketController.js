/**
 * Ticket Controller
 * Handles support ticket CRUD and admin responses.
 */
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new support ticket
 * @route   POST /api/tickets
 * @access  Private (Collector / Verifier)
 */
const createTicket = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot submit tickets — use the admin dashboard instead',
      });
    }

    const { subject, description, category, priority, relatedItem } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    const ticket = await Ticket.create({
      submittedBy: req.user._id,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      relatedItem: relatedItem && isValidObjectId(relatedItem) ? relatedItem : null,
    });

    await ticket.populate('submittedBy', 'username email role');

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating ticket',
    });
  }
};

/**
 * @desc    Get tickets for authenticated user
 * @route   GET /api/tickets/my-tickets
 * @access  Private
 */
const getMyTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const tickets = await Ticket.find({ submittedBy: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'username email role')
      .populate('respondedBy', 'username email')
      .populate('relatedItem', 'title');

    const total = await Ticket.countDocuments({ submittedBy: req.user._id });

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get My Tickets Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching your tickets',
    });
  }
};

/**
 * @desc    Get all tickets (admin only)
 * @route   GET /api/tickets
 * @access  Private (Admin)
 */
const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'username email role')
      .populate('respondedBy', 'username email')
      .populate('relatedItem', 'title');

    const total = await Ticket.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Tickets Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tickets',
    });
  }
};

/**
 * @desc    Get a single ticket by ID
 * @route   GET /api/tickets/:id
 * @access  Private (Owner or Admin)
 */
const getTicketById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const ticket = await Ticket.findById(req.params.id)
      .populate('submittedBy', 'username email role')
      .populate('respondedBy', 'username email')
      .populate('relatedItem', 'title');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only the submitter or an admin can view
    if (
      String(ticket.submittedBy._id || ticket.submittedBy) !== String(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Get Ticket By ID Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching ticket',
    });
  }
};

/**
 * @desc    Admin responds to a ticket and updates its status
 * @route   PUT /api/tickets/:id/respond
 * @access  Private (Admin)
 */
const respondToTicket = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const { adminResponse, status } = req.body;

    if (!adminResponse) {
      return res.status(400).json({
        success: false,
        message: 'Admin response is required',
      });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.adminResponse = adminResponse;
    ticket.respondedBy = req.user._id;
    ticket.respondedAt = new Date();
    if (status) ticket.status = status;

    await ticket.save();
    await ticket.populate('submittedBy', 'username email role');
    await ticket.populate('respondedBy', 'username email');
    await ticket.populate('relatedItem', 'title');

    res.status(200).json({
      success: true,
      message: 'Ticket response saved',
      data: ticket,
    });
  } catch (error) {
    console.error('Respond To Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error responding to ticket',
    });
  }
};

/**
 * @desc    Update ticket status (admin only)
 * @route   PUT /api/tickets/:id/status
 * @access  Private (Admin)
 */
const updateTicketStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('submittedBy', 'username email role')
      .populate('respondedBy', 'username email')
      .populate('relatedItem', 'title');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket status updated',
      data: ticket,
    });
  } catch (error) {
    console.error('Update Ticket Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating ticket status',
    });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  respondToTicket,
  updateTicketStatus,
};
