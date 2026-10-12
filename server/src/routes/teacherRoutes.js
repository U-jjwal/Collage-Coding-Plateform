const express = require('express');
const router = express.Router();

const {
  createQuestion,
  getMyQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getStudents,
  getQuestionDashboard,
  getQuestionSubmissions,
  getSubmissionDetails,
  reviewSubmission,
} = require('../controllers/teacherController');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createQuestionValidators,
  updateQuestionValidators,
} = require('../validators/questionValidators');

// Teacher routes require authentication and teacher or admin role
router.use(authenticate, authorize('teacher', 'admin'));

// Question Management
router.post('/questions', createQuestionValidators, validate, createQuestion);
router.get('/questions', getMyQuestions);
router.get('/questions/:id', getQuestionById);
router.patch('/questions/:id', updateQuestionValidators, validate, updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Student Roster
router.get('/students', getStudents);

// Question Monitoring & Submission Review (Phase 6)
router.get('/questions/:id/dashboard', getQuestionDashboard);
router.get('/questions/:id/submissions', getQuestionSubmissions);
router.get('/submissions/:id', getSubmissionDetails);
router.patch('/submissions/:id/review', reviewSubmission);

module.exports = router;
