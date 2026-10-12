const mongoose = require('mongoose');
const { QUESTION_STATUS, DIFFICULTY } = require('../utils/constants');

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: true },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY),
      required: [true, 'Difficulty is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    constraints: {
      type: [String],
      default: [],
    },
    examples: {
      type: [exampleSchema],
      default: [],
    },
    starterCode: {
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
      c: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.DRAFT,
    },
    timeLimitMs: {
      type: Number,
      default: 5000, // 5 seconds
    },
    memoryLimitKb: {
      type: Number,
      default: 262144, // 256 MB
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ createdBy: 1, status: 1 });
questionSchema.index({ tags: 1 });

// Auto-generate slug from title before saving
questionSchema.pre('save', async function () {
  if (!this.isModified('title') && this.slug) return;

  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Ensure uniqueness by appending a suffix if needed
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await mongoose.model('Question').findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
});

/**
 * Returns a sanitized question object safe for student consumption.
 * Strips hidden test case inputs/outputs.
 */
questionSchema.methods.toPublicDTO = function () {
  const obj = this.toObject();
  // Remove hidden test case details
  obj.testCases = obj.testCases
    .filter((tc) => !tc.isHidden)
    .map(({ input, expectedOutput }) => ({ input, expectedOutput }));
  return obj;
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
