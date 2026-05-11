/**
 * Ticket Routes
 * Defines endpoints for support ticket management
 */
const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  respondToTicket,
  updateTicketStatus,
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');

// All ticket routes require authentication
router.use(protect);

// Collector / Verifier routes
router.post('/', createTicket);
router.get('/my-tickets', getMyTickets);

// Admin-only routes (placed before /:id to avoid param conflicts)
router.get('/all', admin, getAllTickets);
router.put('/:id/respond', admin, respondToTicket);
router.put('/:id/status', admin, updateTicketStatus);

// Single ticket (owner or admin)
router.get('/:id', getTicketById);

module.exports = router;
