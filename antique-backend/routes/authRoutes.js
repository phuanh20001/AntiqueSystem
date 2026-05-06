/**
 * Auth Routes
 * Defines endpoints for user registration, login, logout
 */
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  getAllUsers,
  createUserByAdmin,
  approveUser,
  rejectUser,
  deleteUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.get('/pending-users', protect, getPendingUsers);
router.get('/approved-users', protect, getApprovedUsers);
router.get('/rejected-users', protect, getRejectedUsers);
router.get('/users', protect, getAllUsers);
router.post('/users', protect, createUserByAdmin);
router.put('/approve-user/:id', protect, approveUser);
router.put('/reject-user/:id', protect, rejectUser);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
