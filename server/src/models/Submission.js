const mongoose = require('mongoose');
const { SUBMISSION_STATUS, REVIEW_STATUS } = require('../utils/constants');

const evaluationSchema = new mongoose.Schema(
  {
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: null },
    memoryKb: { type: Number, default: null },
    publicOutput: { type: String, default: null }, // stdout for visible test cases
    errorMessage: { type: String, default: null },
  },
  { _id: false }
);

const teacherReviewSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceCode: {
      type: String,
      required: [true, 'Source code is required'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['java', 'cpp', 'c', 'python'],
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.QUEUED,
    },
    evaluation: {
      type: evaluationSchema,
      default: () => ({}),
    },
    teacherReview: {
      type: teacherReviewSchema,
      default: () => ({}),
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns
submissionSchema.index({ questionId: 1, studentId: 1, createdAt: -1 });
submissionSchema.index({ studentId: 1, createdAt: -1 });
submissionSchema.index({ questionId: 1, createdAt: -1 });
submissionSchema.index({ 'teacherReview.status': 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
