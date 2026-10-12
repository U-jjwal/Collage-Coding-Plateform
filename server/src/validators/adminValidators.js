const { body, param } = require('express-validator');
const { ROLES } = require('../utils/constants');

const addEmailValidators = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('role')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),
  body('rollNumber')
    .optional({ nullable: true })
    .trim(),
];

const updateEmailValidators = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format.'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty.'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean.'),
  body('rollNumber')
    .optional({ nullable: true })
    .trim(),
];

module.exports = {
  addEmailValidators,
  updateEmailValidators,
};
