const Question = require('../models/Question');
const Submission = require('../models/Submission');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { QUESTION_STATUS } = require('../utils/constants');

/**
 * POST /api/v1/teacher/questions
 * Creates a new question
 */
const createQuestion = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    starterCode,
    testCases,
    status,
    timeLimitMs,
    memoryLimitKb,
  } = req.body;

  const defaultStarterCode = {
    java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
    python: `# Write your solution here\nimport sys\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  };

  const question = await Question.create({
    title,
    description,
    difficulty,
    tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
    inputFormat: inputFormat || '',
    outputFormat: outputFormat || '',
    constraints: Array.isArray(constraints) ? constraints : [],
    examples: Array.isArray(examples) ? examples : [],
    starterCode: starterCode || defaultStarterCode,
    testCases: Array.isArray(testCases) ? testCases : [],
    createdBy: req.user._id,
    status: status || QUESTION_STATUS.DRAFT,
    timeLimitMs: timeLimitMs || 5000,
    memoryLimitKb: memoryLimitKb || 262144,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, question, 'Question created successfully.'));
});

/**
 * GET /api/v1/teacher/questions
 * Returns questions authored by the current teacher
 */
const getMyQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const { status, difficulty, search } = req.query;

  const query = {
    createdBy: req.user._id,
  };

  if (status) query.status = status;
  if (difficulty) query.difficulty = difficulty;

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { tags: regex }];
  }

  const [questions, total] = await Promise.all([
    Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  // Attach submission counts to each question
  const questionIds = questions.map((q) => q._id);
  const submissionCounts = await Submission.aggregate([
    { $match: { questionId: { $in: questionIds } } },
    { $group: { _id: '$questionId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  submissionCounts.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  const enrichedQuestions = questions.map((q) => {
    const obj = q.toObject();
    obj.submissionCount = countMap[q._id.toString()] || 0;
    return obj;
  });

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
      'Questions retrieved successfully.'
    )
  );
});

/**
 * GET /api/v1/teacher/questions/:id
 * Single question detail for editing (includes full test cases)
 */
const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  // Ownership check (teachers can only edit own questions, admins can view any)
  if (
    question.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to view or edit this question.');
  }

  return res.status(200).json(new ApiResponse(200, question, 'Question details retrieved.'));
});

/**
 * PATCH /api/v1/teacher/questions/:id
 * Updates an existing question
 */
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  if (
    question.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to modify this question.');
  }

  const allowedUpdates = [
    'title',
    'description',
    'difficulty',
    'tags',
    'inputFormat',
    'outputFormat',
    'constraints',
    'examples',
    'starterCode',
    'testCases',
    'status',
    'timeLimitMs',
    'memoryLimitKb',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'tags' && Array.isArray(req.body.tags)) {
        question.tags = req.body.tags.map((t) => t.trim().toLowerCase());
      } else {
        question[field] = req.body[field];
      }
    }
  });

  await question.save();

  return res
    .status(200)
    .json(new ApiResponse(200, question, 'Question updated successfully.'));
});

/**
 * DELETE /api/v1/teacher/questions/:id
 * Archives if submissions exist, else hard deletes
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  if (
    question.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to delete this question.');
  }

  const submissionCount = await Submission.countDocuments({ questionId: id });

  if (submissionCount > 0) {
    // Preserve history integrity — archive instead of hard deleting
    question.status = QUESTION_STATUS.ARCHIVED;
    await question.save();
    return res.status(200).json(
      new ApiResponse(
        200,
        { archived: true, submissionCount },
        'Question has existing student submissions and has been archived.'
      )
    );
  }

  await Question.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, { deleted: true }, 'Question deleted successfully.'));
});

/**
 * GET /api/v1/teacher/students
 * Lists active registered students for the teacher
 */
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const skip = (page - 1) * limit;
  const { search } = req.query;

  const query = { role: 'student', isActive: true };

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ fullName: regex }, { email: regex }, { rollNumber: regex }];
  }

  const [students, total] = await Promise.all([
    User.find(query)
      .select('fullName email rollNumber createdAt lastLoginAt')
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Students list retrieved.'
    )
  );
});

/**
 * GET /api/v1/teacher/questions/:id/dashboard
 * Aggregated monitoring dashboard for a specific question:
 * submitted students, pending students, status breakdown, review metrics.
 */
const getQuestionDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  if (
    question.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to view this question dashboard.');
  }

  // 1. Get all active registered students
  const allStudents = await User.find({ role: 'student', isActive: true })
    .select('fullName email rollNumber createdAt')
    .sort({ fullName: 1 });

  // 2. Fetch all submissions for this question sorted by newest first
  const allSubmissions = await Submission.find({ questionId: id })
    .populate('studentId', 'fullName email rollNumber')
    .sort({ createdAt: -1 });

  // 3. Group by student to find their latest state & total attempts
  const studentMap = {};
  allSubmissions.forEach((sub) => {
    if (!sub.studentId) return;
    const sId = sub.studentId._id.toString();
    if (!studentMap[sId]) {
      studentMap[sId] = {
        student: sub.studentId,
        submissionsCount: 1,
        latestSubmissionId: sub._id,
        latestStatus: sub.status,
        evaluation: sub.evaluation,
        reviewStatus: sub.teacherReview?.status || 'pending',
        teacherFeedback: sub.teacherReview?.feedback || null,
        lastSubmittedAt: sub.createdAt,
      };
    } else {
      studentMap[sId].submissionsCount += 1;
      // If student eventually solved it in any submission, note accepted
      if (sub.status === 'accepted' && studentMap[sId].latestStatus !== 'accepted') {
        studentMap[sId].hasEverAccepted = true;
      }
    }
  });

  const submittedStudents = [];
  const pendingStudents = [];

  allStudents.forEach((student) => {
    const sId = student._id.toString();
    if (studentMap[sId]) {
      submittedStudents.push(studentMap[sId]);
    } else {
      pendingStudents.push({
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        rollNumber: student.rollNumber,
        registeredAt: student.createdAt,
      });
    }
  });

  const totalStudents = allStudents.length;
  const submittedCount = submittedStudents.length;
  const pendingCount = pendingStudents.length;
  const acceptedCount = submittedStudents.filter(
    (s) => s.latestStatus === 'accepted' || s.hasEverAccepted
  ).length;

  const reviewedCount = submittedStudents.filter(
    (s) => s.reviewStatus === 'reviewed'
  ).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        question: {
          _id: question._id,
          title: question.title,
          slug: question.slug,
          difficulty: question.difficulty,
          status: question.status,
          totalTestCases: question.testCases.length,
          createdAt: question.createdAt,
        },
        metrics: {
          totalStudents,
          submittedCount,
          pendingCount,
          acceptedCount,
          reviewedCount,
          pendingReviewCount: submittedCount - reviewedCount,
          submissionRate: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
          acceptanceRate: submittedCount > 0 ? Math.round((acceptedCount / submittedCount) * 100) : 0,
        },
        submittedStudents,
        pendingStudents,
      },
      'Question dashboard analytics retrieved.'
    )
  );
});

/**
 * GET /api/v1/teacher/questions/:id/submissions
 * Paginated submissions list for this question
 */
const getQuestionSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const { status, reviewStatus, search } = req.query;

  const question = await Question.findById(id);
  if (!question) {
    throw new ApiError(404, 'Question not found.');
  }

  if (
    question.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to view submissions for this question.');
  }

  const query = { questionId: id };
  if (status) query.status = status;
  if (reviewStatus) query['teacherReview.status'] = reviewStatus;

  let studentIds = null;
  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const matchedStudents = await User.find({
      role: 'student',
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
      ],
    }).select('_id');
    studentIds = matchedStudents.map((s) => s._id);
    query.studentId = { $in: studentIds };
  }

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate('studentId', 'fullName email rollNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Submission.countDocuments(query),
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
      'Question submissions retrieved.'
    )
  );
});

/**
 * GET /api/v1/teacher/submissions/:id
 * Full submission details for review
 */
const getSubmissionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id)
    .populate('questionId', 'title slug difficulty createdBy starterCode testCases')
    .populate('studentId', 'fullName email rollNumber');

  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  // Ownership check: Question author or Admin
  if (
    submission.questionId.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to review this submission.');
  }

  return res.status(200).json(
    new ApiResponse(200, submission, 'Submission details retrieved.')
  );
});

/**
 * PATCH /api/v1/teacher/submissions/:id/review
 * Saves teacher feedback and updates review status
 */
const reviewSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { feedback, status = 'reviewed' } = req.body;

  const submission = await Submission.findById(id).populate('questionId', 'createdBy');
  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  if (
    submission.questionId.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to review this submission.');
  }

  submission.teacherReview = {
    status,
    feedback: feedback ? feedback.trim() : '',
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };

  await submission.save();

  return res.status(200).json(
    new ApiResponse(200, submission, 'Submission review saved successfully.')
  );
});

module.exports = {
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
};
