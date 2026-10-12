const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

const QUESTION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const SUBMISSION_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  COMPILE_ERROR: 'compile_error',
  RUNTIME_ERROR: 'runtime_error',
  TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
};

const REVIEW_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
};

// Judge0 language IDs
const LANGUAGE_IDS = {
  java: 62,
  cpp: 54,
  c: 50,
  python: 71,
};

const SUPPORTED_LANGUAGES = ['java'];

module.exports = {
  ROLES,
  QUESTION_STATUS,
  DIFFICULTY,
  SUBMISSION_STATUS,
  REVIEW_STATUS,
  LANGUAGE_IDS,
  SUPPORTED_LANGUAGES,
};
