/**
 * Auth Controller
 * Handles user registration, login, logout and profile
 */
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token expiry duration
const TOKEN_EXPIRY = '30d';

// Bcrypt salt rounds
const SALT_ROUNDS = 10;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: TOKEN_EXPIRY,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedRole = normalizeRequestedRole(role);

    // Create user
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
    });

    if (user) {
      console.log(`New user registered: ${user.email}`);
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please add email and password' });
    }

    // Normalize email and check for user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  // Client is responsible for deleting the token
  res.status(200).json({
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
};

// @desc    Get users waiting for approval
// @route   GET /api/auth/pending-users
// @access  Private (Admin only)
const getPendingUsers = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get users already approved
// @route   GET /api/auth/approved-users
// @access  Private (Admin only)
const getApprovedUsers = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({ status: 'approved' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get rejected user accounts
// @route   GET /api/auth/rejected-users
// @access  Private (Admin only)
const getRejectedUsers = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({ status: 'rejected' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all user accounts
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Admin creates a user account
// @route   POST /api/auth/users
// @access  Private (Admin only)
const createUserByAdmin = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const allowedRoles = ['user', 'verifier', 'admin'];
    const nextRole = allowedRoles.includes(role) ? role : 'user';
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const created = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: nextRole,
      status: 'approved',
      requestedRole: null,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id: created._id,
        username: created.username,
        email: created.email,
        role: created.role,
        status: created.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Approve a user account
// @route   PUT /api/auth/approve-user/:id
// @access  Private (Admin only)
const approveUser = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextRole = user.requestedRole || user.role || 'user';
    user.role = ['user', 'verifier', 'admin'].includes(nextRole) ? nextRole : 'user';
    user.status = 'approved';
    await user.save();

    res.status(200).json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reject a user account
// @route   PUT /api/auth/reject-user/:id
// @access  Private (Admin only)
const rejectUser = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    await user.save();

    res.status(200).json({ success: true, message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete any user account
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'Admin cannot delete own account' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
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
};
