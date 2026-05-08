# Security Improvements for AntiqChain

## Overview
This document outlines the security enhancements added to the AntiqChain frontend application to improve data validation, prevent common web vulnerabilities, and enhance overall security posture.

## New Features Added

### 1. Input Sanitization
- **HTML Sanitization**: Prevents XSS (Cross-Site Scripting) attacks by escaping HTML special characters
- **Email Sanitization**: Normalizes email addresses (trim, lowercase)
- **Text Sanitization**: Removes excessive whitespace and normalizes text input

### 2. Enhanced Validation

#### Email Validation
- Validates email format using regex pattern
- Ensures proper email structure (user@domain.tld)

#### Password Strength Validation
- Minimum 8 characters required
- Must contain uppercase letters
- Must contain lowercase letters
- Must contain numbers
- Optional special character support
- Provides clear feedback messages

#### Username Validation
- Minimum 3 characters, maximum 30 characters
- Only allows alphanumeric characters, hyphens, and underscores
- Prevents special characters that could cause issues

#### Antique Data Validation
- **Name Validation**: 3-100 characters
- **Description Validation**: 10-1000 characters
- **Year Validation**: Between 1000 and current year

### 3. Client-Side Rate Limiting
- Prevents brute force attacks on login
- Configurable attempt limits and time windows
- Default: 5 attempts per 60 seconds
- Provides feedback on remaining cooldown time

### 4. Secure Storage Helpers
- Storage availability detection
- Safe storage operations with error handling
- Prevents storage quota exceeded errors
- Graceful fallback when storage is unavailable

## Implementation Guide

### Including the Security Utilities

Add the security utilities script to your HTML pages:

```html
<script src="../js/security-utils.js"></script>
```

### Usage Examples

#### 1. Sanitizing User Input

```javascript
// Sanitize HTML input to prevent XSS
const userInput = sanitizeHTML(document.getElementById('input').value);

// Sanitize email
const email = sanitizeEmail(emailInput.value);

// Sanitize general text
const description = sanitizeText(descriptionInput.value);
```

#### 2. Validating Input

```javascript
// Validate email
if (!isValidEmail(email)) {
  showToast('Please enter a valid email address', true);
  return;
}

// Validate password strength
const passwordCheck = validatePasswordStrength(password);
if (!passwordCheck.isValid) {
  showToast(passwordCheck.message, true);
  return;
}

// Validate username
const usernameCheck = validateUsername(username);
if (!usernameCheck.isValid) {
  showToast(usernameCheck.message, true);
  return;
}
```

#### 3. Implementing Rate Limiting

```javascript
// Check rate limit before login attempt
if (!checkRateLimit('login', 5, 60000)) {
  const remaining = getRateLimitRemaining('login');
  showToast(`Too many attempts. Please wait ${remaining} seconds.`, true);
  return;
}

// Proceed with login
performLogin(email, password);
```

#### 4. Safe Storage Operations

```javascript
// Check if storage is available
if (!isStorageAvailable('localStorage')) {
  showToast('Browser storage is not available', true);
  return;
}

// Safely store data
const success = safeStorageSet('user-data', JSON.stringify(userData));
if (!success) {
  showToast('Failed to save data', true);
}

// Safely retrieve data
const data = safeStorageGet('user-data');
```

## Security Best Practices

### 1. Always Sanitize User Input
```javascript
// ❌ Bad - Direct use of user input
element.innerHTML = userInput;

// ✅ Good - Sanitized input
element.textContent = sanitizeHTML(userInput);
```

### 2. Validate Before Submission
```javascript
// ❌ Bad - No validation
submitForm(formData);

// ✅ Good - Validate first
const emailCheck = isValidEmail(formData.email);
const passwordCheck = validatePasswordStrength(formData.password);

if (!emailCheck || !passwordCheck.isValid) {
  showToast('Please fix validation errors', true);
  return;
}

submitForm(formData);
```

### 3. Implement Rate Limiting on Sensitive Actions
```javascript
// ✅ Good - Rate limit login attempts
if (!checkRateLimit('login', 5, 60000)) {
  const remaining = getRateLimitRemaining('login');
  showToast(`Too many attempts. Wait ${remaining}s`, true);
  return;
}
```

### 4. Handle Storage Errors Gracefully
```javascript
// ✅ Good - Safe storage with error handling
if (!safeStorageSet('token', authToken)) {
  // Fallback to session storage or show error
  showToast('Unable to save session', true);
}
```

## Integration with Existing Code

### Login Page Enhancement

```javascript
// In login.html or login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get and sanitize inputs
  const email = sanitizeEmail(emailInput.value);
  const password = passwordInput.value; // Don't sanitize passwords
  
  // Validate inputs
  if (!isValidEmail(email)) {
    showToast('Invalid email format', true);
    return;
  }
  
  // Check rate limit
  if (!checkRateLimit('login', 5, 60000)) {
    const remaining = getRateLimitRemaining('login');
    showToast(`Too many login attempts. Wait ${remaining} seconds.`, true);
    return;
  }
  
  // Proceed with login
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    // Handle response...
  } catch (error) {
    showToast('Login failed. Please try again.', true);
  }
});
```

### Registration Form Enhancement

```javascript
// In registration form handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Sanitize inputs
  const username = sanitizeText(usernameInput.value);
  const email = sanitizeEmail(emailInput.value);
  const password = passwordInput.value;
  
  // Validate username
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.isValid) {
    showToast(usernameCheck.message, true);
    return;
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    showToast('Invalid email format', true);
    return;
  }
  
  // Validate password
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    showToast(passwordCheck.message, true);
    return;
  }
  
  // Proceed with registration
  // ...
});
```

### Antique Submission Form Enhancement

```javascript
// In submit.html form handler
document.getElementById('antiqueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Sanitize inputs
  const name = sanitizeText(nameInput.value);
  const description = sanitizeText(descriptionInput.value);
  const year = parseInt(yearInput.value, 10);
  
  // Validate antique name
  const nameCheck = validateAntiqueName(name);
  if (!nameCheck.isValid) {
    showToast(nameCheck.message, true);
    return;
  }
  
  // Validate description
  const descCheck = validateAntiqueDescription(description);
  if (!descCheck.isValid) {
    showToast(descCheck.message, true);
    return;
  }
  
  // Validate year
  const yearCheck = validateYear(year);
  if (!yearCheck.isValid) {
    showToast(yearCheck.message, true);
    return;
  }
  
  // Proceed with submission
  // ...
});
```

## Testing Recommendations

### 1. XSS Prevention Testing
```javascript
// Test with malicious input
const maliciousInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeHTML(maliciousInput);
console.log(sanitized); // Should output escaped HTML
```

### 2. Validation Testing
```javascript
// Test email validation
console.log(isValidEmail('test@example.com')); // true
console.log(isValidEmail('invalid-email')); // false

// Test password strength
console.log(validatePasswordStrength('weak')); // { isValid: false, ... }
console.log(validatePasswordStrength('Strong123')); // { isValid: true, ... }
```

### 3. Rate Limiting Testing
```javascript
// Test rate limiting
for (let i = 0; i < 10; i++) {
  const allowed = checkRateLimit('test', 5, 60000);
  console.log(`Attempt ${i + 1}: ${allowed ? 'Allowed' : 'Blocked'}`);
}
```

## Future Enhancements

1. **Content Security Policy (CSP)**: Implement CSP headers to prevent XSS
2. **HTTPS Enforcement**: Ensure all communications use HTTPS
3. **JWT Token Expiration**: Implement token refresh mechanism
4. **Two-Factor Authentication**: Add 2FA support for enhanced security
5. **Backend Validation**: Mirror all frontend validations on the backend
6. **Security Headers**: Implement security headers (X-Frame-Options, X-Content-Type-Options, etc.)
7. **Input Length Limits**: Add maximum length constraints to prevent DoS
8. **File Upload Validation**: Validate file types and sizes for image uploads

## Known Limitations

1. **Client-Side Only**: These are client-side protections and should be complemented with server-side validation
2. **Storage Security**: localStorage and sessionStorage are not encrypted
3. **Rate Limiting**: Client-side rate limiting can be bypassed; implement server-side rate limiting
4. **Password Storage**: Never store passwords in localStorage; only store tokens

## Contributing

When adding new security features:
1. Follow the existing code style
2. Add comprehensive validation
3. Provide clear error messages
4. Document usage examples
5. Test thoroughly with edge cases

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

---

**Author**: arjunjham-coder  
**Date**: May 8, 2026  
**Version**: 1.0.0
