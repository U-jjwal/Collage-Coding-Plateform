const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const authorizedEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Role is required'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for filtering by role and status
authorizedEmailSchema.index({ role: 1, isActive: 1 });

const AuthorizedEmail = mongoose.model('AuthorizedEmail', authorizedEmailSchema);

module.exports = AuthorizedEmail;
