const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeRole = (role) => {
  if (!role) return 'collector';
  const lower = String(role).toLowerCase().trim();
  if (lower === 'user') return 'collector';
  return lower;
};

const normalizeStatus = (status) => {
  if (!status) return 'approved';
  const lower = String(status).toLowerCase().trim();
  return ['pending', 'approved', 'rejected'].includes(lower) ? lower : 'approved';
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user.role = normalizeRole(req.user.role);
      req.user.status = normalizeStatus(req.user.status);

      if (req.user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is pending admin approval.' });
      }

      if (req.user.status === 'rejected') {
        return res.status(403).json({ message: 'Your account was rejected. Please contact an administrator.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && normalizeRole(req.user.role) === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  const normalizedAllowed = roles.map((role) => normalizeRole(role));
  const userRole = normalizeRole(req.user && req.user.role);

  if (!req.user || !normalizedAllowed.includes(userRole)) {
    return res.status(403).json({ message: 'Not authorized for this action' });
  }

  next();
};

module.exports = { protect, admin, authorizeRoles };
