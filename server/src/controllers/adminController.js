const AuthorizedEmail = require('../models/AuthorizedEmail');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parseAuthorizedEmailsCsv } = require('../services/csvParser');

/**
 * GET /api/v1/admin/stats
 * Dashboard summary statistics
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalAuthorized,
    activeAuthorized,
    totalUsers,
    totalStudents,
    totalTeachers,
  ] = await Promise.all([
    AuthorizedEmail.countDocuments(),
    AuthorizedEmail.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalAuthorized,
        activeAuthorized,
        totalUsers,
        totalStudents,
        totalTeachers,
      },
      'Admin statistics retrieved successfully'
    )
  );
});

/**
 * POST /api/v1/admin/authorized-emails/import
 * Bulk imports emails from an uploaded CSV file
 */
const importAuthorizedEmails = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a CSV file.');
  }

  // Parse CSV
  const { validRows, errors, duplicatesInCsv } = parseAuthorizedEmailsCsv(req.file.buffer);

  if (validRows.length === 0 && errors.length === 0) {
    throw new ApiError(400, 'Uploaded CSV is empty.');
  }

  // Check which emails already exist in database
  const emailsToCheck = validRows.map((r) => r.email);
  const existingDocs = await AuthorizedEmail.find({
    email: { $in: emailsToCheck },
  }).select('email');

  const existingDbEmails = new Set(existingDocs.map((doc) => doc.email));
  const duplicatesInDb = [];
  const rowsToInsert = [];

  validRows.forEach((row) => {
    if (existingDbEmails.has(row.email)) {
      duplicatesInDb.push(row.email);
    } else {
      rowsToInsert.push({
        ...row,
        invitedBy: req.user._id,
        isActive: true,
      });
    }
  });

  // Bulk insert new rows
  let insertedCount = 0;
  if (rowsToInsert.length > 0) {
    const inserted = await AuthorizedEmail.insertMany(rowsToInsert);
    insertedCount = inserted.length;
  }

  const allDuplicates = Array.from(new Set([...duplicatesInCsv, ...duplicatesInDb]));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        inserted: insertedCount,
        duplicates: allDuplicates,
        errors,
        totalProcessed: validRows.length + errors.length,
      },
      `Successfully imported ${insertedCount} email(s).`
    )
  );
});

/**
 * POST /api/v1/admin/authorized-emails
 * Add single authorized email manually
 */
const addAuthorizedEmail = asyncHandler(async (req, res) => {
  const { email, role, fullName, rollNumber } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const existing = await AuthorizedEmail.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, `Email ${normalizedEmail} is already on the authorized list.`);
  }

  const doc = await AuthorizedEmail.create({
    email: normalizedEmail,
    role,
    fullName: fullName.trim(),
    rollNumber: rollNumber ? rollNumber.trim() : null,
    invitedBy: req.user._id,
    isActive: true,
  });

  return res.status(201).json(new ApiResponse(201, doc, 'Authorized email added successfully.'));
});

/**
 * GET /api/v1/admin/authorized-emails
 * Paginated list of authorized emails with search and filtering
 */
const getAuthorizedEmails = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const { search, role, isActive } = req.query;
  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true';
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { email: searchRegex },
      { fullName: searchRegex },
      { rollNumber: searchRegex },
    ];
  }

  const [authorizedEmails, total] = await Promise.all([
    AuthorizedEmail.find(query)
      .populate('invitedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuthorizedEmail.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        authorizedEmails,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Authorized emails retrieved successfully.'
    )
  );
});

/**
 * PATCH /api/v1/admin/authorized-emails/:id
 * Toggle status or update info
 */
const updateAuthorizedEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, fullName, rollNumber, role } = req.body;

  const authEntry = await AuthorizedEmail.findById(id);
  if (!authEntry) {
    throw new ApiError(404, 'Authorized email record not found.');
  }

  if (fullName !== undefined) authEntry.fullName = fullName.trim();
  if (rollNumber !== undefined) authEntry.rollNumber = rollNumber ? rollNumber.trim() : null;
  if (role !== undefined) authEntry.role = role;

  if (isActive !== undefined) {
    authEntry.isActive = Boolean(isActive);
    // If deactivating, also cascade deactivation to matching User
    if (authEntry.isActive === false) {
      await User.updateOne({ email: authEntry.email }, { isActive: false });
    } else {
      // Re-activating also activates matching user
      await User.updateOne({ email: authEntry.email }, { isActive: true });
    }
  }

  await authEntry.save();

  return res
    .status(200)
    .json(new ApiResponse(200, authEntry, 'Authorized email updated successfully.'));
});

/**
 * DELETE /api/v1/admin/authorized-emails/:id
 * Removes an email from authorized list
 */
const deleteAuthorizedEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authEntry = await AuthorizedEmail.findById(id);

  if (!authEntry) {
    throw new ApiError(404, 'Authorized email record not found.');
  }

  // Also deactivate the registered user if present
  await User.updateOne({ email: authEntry.email }, { isActive: false });
  await AuthorizedEmail.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Authorized email deleted successfully.'));
});

/**
 * GET /api/v1/admin/users
 * Paginated list of registered users
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const { search, role, isActive } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { email: searchRegex },
      { fullName: searchRegex },
      { rollNumber: searchRegex },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Users retrieved successfully.'
    )
  );
});

module.exports = {
  getStats,
  importAuthorizedEmails,
  addAuthorizedEmail,
  getAuthorizedEmails,
  updateAuthorizedEmail,
  deleteAuthorizedEmail,
  getUsers,
};
