const { body } = require('express-validator');

const registerValidators = [
  body('email')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters.'),
];

const loginValidators = [
  body('email')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

const verifyEmailValidators = [
  body('token').notEmpty().withMessage('Verification token is required.'),
];

const resendVerificationValidators = [
  body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
];

module.exports = {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  resendVerificationValidators,
};
