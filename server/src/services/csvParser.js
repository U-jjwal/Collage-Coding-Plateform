const { parse } = require('csv-parse/sync');
const { ROLES } = require('../utils/constants');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const ALLOWED_ROLES = Object.values(ROLES);

/**
 * Normalizes header keys to standard names
 */
const normalizeHeader = (header) => {
  const clean = header.toLowerCase().replace(/[\s_-]/g, '');
  if (clean === 'email') return 'email';
  if (clean === 'role') return 'role';
  if (clean === 'fullname' || clean === 'name') return 'fullName';
  if (clean === 'rollnumber' || clean === 'rollno' || clean === 'roll') return 'rollNumber';
  return header.trim();
};

/**
 * Parses and validates CSV content.
 * Expected columns: email, role, fullName, rollNumber (optional)
 *
 * @param {Buffer|string} csvBuffer
 * @returns {{ validRows: Array, errors: Array, duplicatesInCsv: Array }}
 */
const parseAuthorizedEmailsCsv = (csvBuffer) => {
  let records;
  try {
    records = parse(csvBuffer, {
      columns: (headers) => headers.map(normalizeHeader),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new Error(`CSV Parsing failed: ${err.message}`);
  }

  const validRows = [];
  const errors = [];
  const duplicatesInCsv = [];
  const seenEmails = new Set();

  records.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header line
    const email = (row.email || '').toLowerCase().trim();
    const role = (row.role || '').toLowerCase().trim();
    const fullName = (row.fullName || '').trim();
    const rollNumber = (row.rollNumber || '').trim() || null;

    // Missing email
    if (!email) {
      errors.push({ row: rowNum, email: null, reason: 'Missing email address' });
      return;
    }

    // Invalid email format
    if (!EMAIL_REGEX.test(email)) {
      errors.push({ row: rowNum, email, reason: 'Invalid email format' });
      return;
    }

    // Duplicate within CSV itself
    if (seenEmails.has(email)) {
      duplicatesInCsv.push(email);
      errors.push({ row: rowNum, email, reason: 'Duplicate email within CSV' });
      return;
    }
    seenEmails.add(email);

    // Missing or invalid role
    if (!role || !ALLOWED_ROLES.includes(role)) {
      errors.push({
        row: rowNum,
        email,
        reason: `Invalid or missing role. Allowed: ${ALLOWED_ROLES.join(', ')}`,
      });
      return;
    }

    // Missing full name
    if (!fullName) {
      errors.push({ row: rowNum, email, reason: 'Missing full name' });
      return;
    }

    validRows.push({
      email,
      role,
      fullName,
      rollNumber,
    });
  });

  return { validRows, errors, duplicatesInCsv };
};

module.exports = {
  parseAuthorizedEmailsCsv,
};
