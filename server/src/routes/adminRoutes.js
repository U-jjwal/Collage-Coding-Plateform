const express = require('express');
const multer = require('multer');
const router = express.Router();

const {
  getStats,
  importAuthorizedEmails,
  addAuthorizedEmail,
  getAuthorizedEmails,
  updateAuthorizedEmail,
  deleteAuthorizedEmail,
  getUsers,
} = require('../controllers/adminController');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  addEmailValidators,
  updateEmailValidators,
} = require('../validators/adminValidators');

// Multer memory storage configuration for CSV uploads (5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  },
});

// All admin routes require authentication and 'admin' role
router.use(authenticate, authorize('admin'));

// Admin Dashboard stats
router.get('/stats', getStats);

// Bulk import authorized emails via CSV
router.post('/authorized-emails/import', upload.single('file'), importAuthorizedEmails);

// Add single authorized email manually
router.post('/authorized-emails', addEmailValidators, validate, addAuthorizedEmail);

// List authorized emails with search/filtering/pagination
router.get('/authorized-emails', getAuthorizedEmails);

// Update authorized email (status toggle, name, roll number, role)
router.patch('/authorized-emails/:id', updateEmailValidators, validate, updateAuthorizedEmail);

// Delete authorized email
router.delete('/authorized-emails/:id', deleteAuthorizedEmail);

// List registered users
router.get('/users', getUsers);

module.exports = router;
