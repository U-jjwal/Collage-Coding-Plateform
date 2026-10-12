const mongoose = require('mongoose');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { QUESTION_STATUS, SUBMISSION_STATUS } = require('../utils/constants');
const { runCode } = require('../services/judgeService');

/**
 * GET /api/v1/questions
 * Returns all published questions for students with test cases excluded.
 * Enriches with student's personal submission status (accepted, attempted, none).
 */
const getPublishedQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const { difficulty, tag, search } = req.query;

  const query = {
    status: QUESTION_STATUS.PUBLISHED,
  };

  if (difficulty) query.difficulty = difficulty;
  if (tag) query.tags = tag.toLowerCase().trim();

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { tags: regex }];
  }

  const [questions, total] = await Promise.all([
    Question.find(query)
      .select('-testCases') // ⛔ CRITICAL: Never leak test cases to the catalog
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  // If user is authenticated student, determine personal solve status
  let enrichedQuestions = questions.map((q) => q.toObject());

  if (req.user) {
    const questionIds = questions.map((q) => q._id);
    const userSubmissions = await Submission.aggregate([
      {
        $match: {
          studentId: req.user._id,
          questionId: { $in: questionIds },
        },
      },
      {
        $group: {
          _id: '$questionId',
          hasAccepted: {
            $max: {
              $cond: [{ $eq: ['$status', SUBMISSION_STATUS.ACCEPTED] }, 1, 0],
            },
          },
          totalAttempts: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {};
    userSubmissions.forEach((sub) => {
      statusMap[sub._id.toString()] = {
        status: sub.hasAccepted === 1 ? 'accepted' : 'attempted',
        attempts: sub.totalAttempts,
      };
    });

    enrichedQuestions = enrichedQuestions.map((q) => {
      const userMeta = statusMap[q._id.toString()];
      return {
        ...q,
        userStatus: userMeta ? userMeta.status : 'unattempted',
        userAttempts: userMeta ? userMeta.attempts : 0,
      };
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        questions: enrichedQuestions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Published questions retrieved successfully.'
    )
  );
});

/**
 * GET /api/v1/questions/:id
 * Single public question details. Strips hidden test cases.
 */
const getPublicQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let question;
  if (mongoose.Types.ObjectId.isValid(id)) {
    question = await Question.findById(id);
  } else {
    question = await Question.findOne({ slug: id });
  }

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  // If draft/archived, only creator or admin can view
  if (question.status !== QUESTION_STATUS.PUBLISHED) {
    if (
      !req.user ||
      (req.user.role !== 'admin' &&
        question.createdBy.toString() !== req.user._id.toString())
    ) {
      throw new ApiError(404, 'This question is not currently published.');
    }
  }

  // Sanitize via DTO: Strip hidden test cases!
  const publicQuestion = question.toPublicDTO();

  // Attach student's previous submissions info if authenticated
  let studentHistory = null;
  if (req.user) {
    const submissions = await Submission.find({
      questionId: question._id,
      studentId: req.user._id,
    })
      .select('status language createdAt evaluation')
      .sort({ createdAt: -1 })
      .limit(5);

    studentHistory = submissions;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        question: publicQuestion,
        submissions: studentHistory || [],
      },
      'Question details retrieved.'
    )
  );
});

/**
 * POST /api/v1/questions/:id/run
 * Runs custom user code against custom stdin input (does not evaluate or save submission)
 */
const runCustomCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sourceCode = req.body.sourceCode || req.body.code;
  const { language = 'java', customInput = '' } = req.body;

  if (!sourceCode || !sourceCode.trim()) {
    throw new ApiError(400, 'Source code cannot be empty.');
  }

  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  const timeLimitMs = question.timeLimitMs || 5000;
  const memoryLimitKb = question.memoryLimitKb || 262144;

  const result = await runCode(sourceCode, language, customInput, timeLimitMs, memoryLimitKb);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
        status: result.status,
        executionTimeMs: result.executionTimeMs,
      },
      'Code executed successfully.'
    )
  );
});

/**
 * POST /api/v1/questions/:id/submissions
 * Evaluates code against question test cases.
 * CRITICAL RULE: Saves submission as QUEUED first before running tests!
 */
const submitCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sourceCode = req.body.sourceCode || req.body.code;
  const { language = 'java' } = req.body;

  if (!sourceCode || !sourceCode.trim()) {
    throw new ApiError(400, 'Source code is required.');
  }

  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  if (question.status !== QUESTION_STATUS.PUBLISHED && req.user.role === 'student') {
    throw new ApiError(403, 'This question is not currently open for submissions.');
  }

  // 1. Immediately create submission record in DB as QUEUED
  const submission = await Submission.create({
    questionId: question._id,
    studentId: req.user._id,
    sourceCode,
    language: language.toLowerCase(),
    status: SUBMISSION_STATUS.QUEUED,
    evaluation: {
      passedTests: 0,
      totalTests: question.testCases.length,
    },
  });

  // 2. Begin evaluation
  submission.status = SUBMISSION_STATUS.RUNNING;
  await submission.save();

  const testCases = question.testCases || [];
  const timeLimitMs = question.timeLimitMs || 5000;
  const memoryLimitKb = question.memoryLimitKb || 262144;

  let passedTests = 0;
  let overallStatus = SUBMISSION_STATUS.ACCEPTED;
  let maxTimeMs = 0;
  let compileErrorOutput = null;
  const testResults = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = await runCode(sourceCode, language, tc.input, timeLimitMs, memoryLimitKb);

    if (execRes.executionTimeMs && execRes.executionTimeMs > maxTimeMs) {
      maxTimeMs = execRes.executionTimeMs;
    }

    // Check for compilation error (fails entire submission immediately)
    if (execRes.status === SUBMISSION_STATUS.COMPILE_ERROR) {
      overallStatus = SUBMISSION_STATUS.COMPILE_ERROR;
      compileErrorOutput = execRes.compile_output;
      testResults.push({
        testCaseIndex: i + 1,
        passed: false,
        isHidden: tc.isHidden,
        error: 'Compilation Error',
      });
      break;
    }

    if (execRes.status === SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED) {
      overallStatus = SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED;
      testResults.push({
        testCaseIndex: i + 1,
        passed: false,
        isHidden: tc.isHidden,
        error: 'Time Limit Exceeded',
      });
      break;
    }

    if (execRes.status === SUBMISSION_STATUS.RUNTIME_ERROR) {
      overallStatus = SUBMISSION_STATUS.RUNTIME_ERROR;
      testResults.push({
        testCaseIndex: i + 1,
        passed: false,
        isHidden: tc.isHidden,
        error: execRes.stderr || 'Runtime Error',
      });
      break;
    }

    // Compare output: normalize CRLF and trim whitespace
    const actualNormalized = (execRes.stdout || '').replace(/\r\n/g, '\n').trim();
    const expectedNormalized = (tc.expectedOutput || '').replace(/\r\n/g, '\n').trim();

    const isMatch = actualNormalized === expectedNormalized;

    if (isMatch) {
      passedTests++;
      testResults.push({
        testCaseIndex: i + 1,
        passed: true,
        isHidden: tc.isHidden,
      });
    } else {
      overallStatus = SUBMISSION_STATUS.WRONG_ANSWER;
      testResults.push({
        testCaseIndex: i + 1,
        passed: false,
        isHidden: tc.isHidden,
        // Only show input and expected for non-hidden test cases
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        actualOutput: tc.isHidden ? undefined : execRes.stdout,
      });
    }
  }

  // 3. Finalize submission in DB
  submission.status = overallStatus;
  submission.evaluation = {
    passedTests,
    totalTests: testCases.length,
    executionTimeMs: maxTimeMs,
    errorMessage: compileErrorOutput,
    publicOutput: testResults.length > 0 && !testResults[0].isHidden ? testResults[0].actualOutput : null,
  };
  submission.evaluatedAt = new Date();
  await submission.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissionId: submission._id,
        status: submission.status,
        passedTests,
        totalTests: testCases.length,
        executionTimeMs: maxTimeMs,
        testResults,
        errorMessage: compileErrorOutput,
        createdAt: submission.createdAt,
      },
      `Evaluation complete: ${passedTests}/${testCases.length} tests passed.`
    )
  );
});

/**
 * GET /api/v1/submissions/mine
 * Returns list of current student's submissions across all questions
 */
const getMySubmissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    Submission.find({ studentId: req.user._id })
      .populate('questionId', 'title slug difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Submission.countDocuments({ studentId: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Submissions history retrieved.'
    )
  );
});

/**
 * GET /api/v1/questions/:id/submissions/mine
 * Submissions for a specific question by current student
 */
const getMySubmissionsForQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submissions = await Submission.find({
    questionId: id,
    studentId: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, { submissions }, 'Question submissions retrieved.'));
});

/**
 * GET /api/v1/submissions/:id
 * Single submission detail
 */
const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id).populate('questionId', 'title slug difficulty');

  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Authorization check
  if (
    req.user.role === 'student' &&
    submission.studentId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You do not have permission to view this submission.');
  }

  return res.status(200).json(new ApiResponse(200, submission, 'Submission details retrieved.'));
});

module.exports = {
  getPublishedQuestions,
  getPublicQuestionById,
  runCustomCode,
  submitCode,
  getMySubmissions,
  getMySubmissionsForQuestion,
  getSubmissionById,
};
