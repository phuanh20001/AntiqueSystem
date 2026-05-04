const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const ROLE_VALUES = ['collector', 'verifier', 'admin'];
const STATUS_VALUES = ['pending', 'approved', 'rejected'];

const normalizeRole = (role) => {
  if (!role) return 'collector';
  const lower = String(role).toLowerCase().trim();
  if (lower === 'user') return 'collector';
  return ROLE_VALUES.includes(lower) ? lower : 'collector';
};

const normalizeStatus = (status) => {
  if (!status) return 'approved';
  const lower = String(status).toLowerCase().trim();
  return STATUS_VALUES.includes(lower) ? lower : 'approved';
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body || {};
    console.log('Register attempt:', { username, email, role, roleType: typeof role });

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const requestedRole = normalizeRole(role);
    const safeRole = requestedRole === 'admin' ? 'collector' : requestedRole;

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      status: 'pending',
    });

    if (user) {
      res.status(201).json({
        message: 'Account created successfully. Please wait for admin approval before login.',
        user: {
          _id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);

    // Mongoose validation errors -> send 400 with details
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }

    // Duplicate key (unique) errors
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists', error: error.message });
    }

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

    // Check for user email
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const normalizedStatus = normalizeStatus(user.status);
    if (normalizedStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }

    if (normalizedStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account was rejected. Please contact an administrator.' });
    }

    const normalizedRole = normalizeRole(user.role);

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: normalizedRole,
      status: normalizedStatus,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      ...req.user.toObject(),
      role: normalizeRole(req.user.role),
      status: normalizeStatus(req.user.status),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get users pending approval
// @route   GET /api/auth/pending-users
// @access  Private (Admin)
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get approved users
// @route   GET /api/auth/approved-users
// @access  Private (Admin)
const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'approved' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Approve user account
// @route   PUT /api/auth/approve-user/:id
// @access  Private (Admin)
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    user.role = normalizeRole(user.role);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reject user account
// @route   PUT /api/auth/reject-user/:id
// @access  Private (Admin)
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    user.role = normalizeRole(user.role);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  // Client is responsible for deleting the token
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getPendingUsers,
  getApprovedUsers,
  approveUser,
  rejectUser,
};
