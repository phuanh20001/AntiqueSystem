const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getPendingUsers,
  getApprovedUsers,
  approveUser,
  rejectUser,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.get('/pending-users', protect, admin, getPendingUsers);
router.get('/approved-users', protect, admin, getApprovedUsers);
router.put('/approve-user/:id', protect, admin, approveUser);
router.put('/reject-user/:id', protect, admin, rejectUser);

module.exports = router;
