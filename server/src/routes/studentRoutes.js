const express = require('express');
const router = express.Router();

const {
  getPublishedQuestions,
  getPublicQuestionById,
  runCustomCode,
  submitCode,
  getMySubmissions,
  getMySubmissionsForQuestion,
  getSubmissionById,
} = require('../controllers/studentController');

const authenticate = require('../middleware/authenticate');
const { runLimiter, submitLimiter } = require('../middleware/rateLimiter');

// All student endpoints require authentication
router.use(authenticate);

// Question Catalog
router.get('/questions', getPublishedQuestions);
router.get('/questions/:id', getPublicQuestionById);

// Code Execution & Submissions
router.post('/questions/:id/run', runLimiter, runCustomCode);
router.post('/questions/:id/submissions', submitLimiter, submitCode);

// Submissions History
router.get('/submissions/mine', getMySubmissions);
router.get('/questions/:id/submissions/mine', getMySubmissionsForQuestion);
router.get('/submissions/:id', getSubmissionById);

module.exports = router;
