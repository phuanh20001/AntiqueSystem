/**
 * Security Utilities for AntiqChain Frontend
 * Provides input sanitization, validation, and XSS protection
 */

// ── INPUT SANITIZATION ──
/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized string
 */
function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize email input
 * @param {string} email - Email address
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize general text input
 * @param {string} text - Text input
 * @returns {string} - Sanitized text
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

// ── INPUT VALIDATION ──
/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object} - Validation result with isValid and message
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, and numbers'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong'
  };
}

/**
 * Validate username format
 * @param {string} username - Username
 * @returns {object} - Validation result
 */
function validateUsername(username) {
  if (!username || username.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters long'
    };
  }

  if (username.length > 30) {
    return {
      isValid: false,
      message: 'Username must be less than 30 characters'
    };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, hyphens, and underscores'
    };
  }

  return {
    isValid: true,
    message: 'Username is valid'
  };
}

/**
 * Validate antique name
 * @param {string} name - Antique name
 * @returns {object} - Validation result
 */
function validateAntiqueName(name) {
  if (!name || name.trim().length < 3) {
    return {
      isValid: false,
      message: 'Antique name must be at least 3 characters long'
    };
  }

  if (name.length > 100) {
    return {
      isValid: false,
      message: 'Antique name must be less than 100 characters'
    };
  }

  return {
    isValid: true,
    message: 'Antique name is valid'
  };
}

/**
 * Validate antique description
 * @param {string} description - Antique description
 * @returns {object} - Validation result
 */
function validateAntiqueDescription(description) {
  if (!description || description.trim().length < 10) {
    return {
      isValid: false,
      message: 'Description must be at least 10 characters long'
    };
  }

  if (description.length > 1000) {
    return {
      isValid: false,
      message: 'Description must be less than 1000 characters'
    };
  }

  return {
    isValid: true,
    message: 'Description is valid'
  };
}

/**
 * Validate year input
 * @param {number|string} year - Year value
 * @returns {object} - Validation result
 */
function validateYear(year) {
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum)) {
    return {
      isValid: false,
      message: 'Year must be a valid number'
    };
  }

  if (yearNum < 1000 || yearNum > currentYear) {
    return {
      isValid: false,
      message: `Year must be between 1000 and ${currentYear}`
    };
  }

  return {
    isValid: true,
    message: 'Year is valid'
  };
}

// ── RATE LIMITING ──
const rateLimitStore = new Map();

/**
 * Simple client-side rate limiting
 * @param {string} action - Action identifier
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if action is allowed
 */
function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `ratelimit_${action}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { attempts: 1, resetAt: now + windowMs });
    return true;
  }

  const data = rateLimitStore.get(key);
  
  if (now > data.resetAt) {
    rateLimitStore.set(key, { attempts: 1, resetAt: now + windowMs });
    return true;
  }

  if (data.attempts >= maxAttempts) {
    return false;
  }

  data.attempts++;
  return true;
}

/**
 * Get remaining time for rate limit
 * @param {string} action - Action identifier
 * @returns {number} - Seconds remaining
 */
function getRateLimitRemaining(action) {
  const key = `ratelimit_${action}`;
  const data = rateLimitStore.get(key);
  
  if (!data) return 0;
  
  const remaining = Math.ceil((data.resetAt - Date.now()) / 1000);
  return Math.max(0, remaining);
}

// ── SECURE STORAGE HELPERS ──
/**
 * Check if storage is available
 * @param {string} type - 'localStorage' or 'sessionStorage'
 * @returns {boolean} - True if available
 */
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safely set item in storage with error handling
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 * @returns {boolean} - True if successful
 */
function safeStorageSet(key, value, useSession = false) {
  try {
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('Storage error:', e);
    return false;
  }
}

/**
 * Safely get item from storage
 * @param {string} key - Storage key
 * @param {boolean} useSession - Use sessionStorage instead of localStorage
 * @returns {string|null} - Stored value or null
 */
function safeStorageGet(key, useSession = false) {
  try {
    const storage = useSession ? sessionStorage : localStorage;
    return storage.getItem(key);
  } catch (e) {
    console.error('Storage error:', e);
    return null;
  }
}

// ── EXPORT FOR USE ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    sanitizeEmail,
    sanitizeText,
    isValidEmail,
    validatePasswordStrength,
    validateUsername,
    validateAntiqueName,
    validateAntiqueDescription,
    validateYear,
    checkRateLimit,
    getRateLimitRemaining,
    isStorageAvailable,
    safeStorageSet,
    safeStorageGet
  };
}
