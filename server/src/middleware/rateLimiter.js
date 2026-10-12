const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      next(new ApiError(429, options.message.message));
    },
  });

// Auth rate limiters
const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many login attempts. Please try again in 15 minutes.'
);

const registerLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many registration attempts. Please try again later.'
);

// Code execution rate limiters
const runLimiter = createLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many run requests. Please wait a moment before trying again.'
);

const submitLimiter = createLimiter(
  60 * 1000, // 1 minute
  5,
  'Too many submissions. Please wait before submitting again.'
);

// General API limiter
const apiLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  'Too many requests from this IP. Please try again later.'
);

module.exports = {
  loginLimiter,
  registerLimiter,
  runLimiter,
  submitLimiter,
  apiLimiter,
};
