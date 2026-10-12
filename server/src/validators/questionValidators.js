const { body, param } = require('express-validator');
const { DIFFICULTY, QUESTION_STATUS } = require('../utils/constants');

const createQuestionValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters.'),
  body('difficulty')
    .customSanitizer((v) => {
      if (!v) return v;
      const lower = String(v).toLowerCase();
      if (lower === 'easy') return 'Easy';
      if (lower === 'medium') return 'Medium';
      if (lower === 'hard') return 'Hard';
      return v;
    })
    .isIn(Object.values(DIFFICULTY))
    .withMessage(`Difficulty must be one of: ${Object.values(DIFFICULTY).join(', ')}`),
  body('status')
    .optional()
    .isIn(Object.values(QUESTION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(QUESTION_STATUS).join(', ')}`),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings.'),
  body('inputFormat')
    .optional()
    .trim(),
  body('outputFormat')
    .optional()
    .trim(),
  body('constraints')
    .optional()
    .isArray()
    .withMessage('Constraints must be an array of strings.'),
  body('examples')
    .optional()
    .isArray()
    .withMessage('Examples must be an array.'),
  body('testCases')
    .optional()
    .isArray()
    .withMessage('Test cases must be an array.'),
  body('starterCode')
    .optional()
    .isObject()
    .withMessage('Starter code must be an object with language keys.'),
  body('timeLimitMs')
    .optional()
    .isInt({ min: 500, max: 15000 })
    .withMessage('Time limit must be between 500ms and 15,000ms.'),
  body('memoryLimitKb')
    .optional()
    .isInt({ min: 16384, max: 1048576 })
    .withMessage('Memory limit must be between 16MB and 1GB.'),
];

const updateQuestionValidators = [
  param('id')
    .isMongoId()
    .withMessage('Invalid question ID format.'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters.'),
  body('difficulty')
    .optional()
    .customSanitizer((v) => {
      if (!v) return v;
      const lower = String(v).toLowerCase();
      if (lower === 'easy') return 'Easy';
      if (lower === 'medium') return 'Medium';
      if (lower === 'hard') return 'Hard';
      return v;
    })
    .isIn(Object.values(DIFFICULTY))
    .withMessage(`Difficulty must be one of: ${Object.values(DIFFICULTY).join(', ')}`),
  body('status')
    .optional()
    .isIn(Object.values(QUESTION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(QUESTION_STATUS).join(', ')}`),
  body('tags')
    .optional()
    .isArray(),
  body('constraints')
    .optional()
    .isArray(),
  body('examples')
    .optional()
    .isArray(),
  body('testCases')
    .optional()
    .isArray(),
];

module.exports = {
  createQuestionValidators,
  updateQuestionValidators,
};
