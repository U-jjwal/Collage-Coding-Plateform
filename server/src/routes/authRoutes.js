const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  resendVerificationValidators,
} = require('../validators/authValidators');

// POST /api/v1/auth/register
router.post('/register', registerLimiter, registerValidators, validate, register);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, loginValidators, validate, login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me   (protected)
router.get('/me', authenticate, me);

// POST /api/v1/auth/verify-email
router.post('/verify-email', verifyEmailValidators, validate, verifyEmail);

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', resendVerificationValidators, validate, resendVerification);

module.exports = router;
