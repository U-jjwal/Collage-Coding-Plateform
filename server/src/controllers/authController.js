const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthorizedEmail = require('../models/AuthorizedEmail');
const { sendVerificationEmail } = require('../services/emailService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const SKIP_EMAIL = process.env.DEV_SKIP_EMAIL_VERIFY === 'true';

// ─── Helpers ──────────────────────────────────────────────────────────────

const generateToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

const signJWT = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Checks allowlist → creates user → sends verification email (or auto-verifies in dev).
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check allowlist
  const allowEntry = await AuthorizedEmail.findOne({
    email: normalizedEmail,
    isActive: true,
  });

  if (!allowEntry) {
    throw new ApiError(
      403,
      'Your email is not authorized to register. Contact your administrator.'
    );
  }

  // 2. Check not already registered
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists. Please log in.');
  }

  // 3. Hash password
  const passwordHash = await User.hashPassword(password);

  // 4. Build user object
  const userData = {
    email: normalizedEmail,
    passwordHash,
    role: allowEntry.role,         // Role always comes from allowlist
    fullName: fullName || allowEntry.fullName,
    rollNumber: allowEntry.rollNumber || null,
    isEmailVerified: SKIP_EMAIL,   // Auto-verify in dev mode
    isActive: true,
  };

  // 5. If email verification required, generate token
  if (!SKIP_EMAIL) {
    const { rawToken, tokenHash } = generateToken();
    userData.emailVerificationTokenHash = tokenHash;
    userData.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const user = await User.create(userData);
    await sendVerificationEmail(user, rawToken);
    return res.status(201).json(
      new ApiResponse(201, { email: user.email }, 'Account created. Check your email to verify.')
    );
  }

  // 6. Dev mode — create & immediately return JWT
  const user = await User.create(userData);
  const token = signJWT(user._id);
  setAuthCookie(res, token);

  return res.status(201).json(
    new ApiResponse(201, user.toJSON(), 'Account created successfully.')
  );
});

/**
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Need passwordHash for comparison — explicitly select it
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact the administrator.');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signJWT(user._id);
  setAuthCookie(res, token);

  return res.status(200).json(new ApiResponse(200, user.toJSON(), 'Logged in successfully.'));
});

/**
 * POST /auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

/**
 * GET /auth/me
 */
const me = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Profile fetched.'));
});

/**
 * POST /auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) throw new ApiError(400, 'Verification token is required.');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token. Request a new one.');
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const jwtToken = signJWT(user._id);
  setAuthCookie(res, jwtToken);

  return res.status(200).json(new ApiResponse(200, user.toJSON(), 'Email verified successfully.'));
});

/**
 * POST /auth/resend-verification
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailVerificationTokenHash +emailVerificationExpires'
  );

  if (!user) throw new ApiError(404, 'No account found with this email.');
  if (user.isEmailVerified) throw new ApiError(400, 'This account is already verified.');

  const { rawToken, tokenHash } = generateToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, rawToken);

  return res.status(200).json(
    new ApiResponse(200, null, 'Verification email sent. Check your inbox.')
  );
});

module.exports = { register, login, logout, me, verifyEmail, resendVerification };
