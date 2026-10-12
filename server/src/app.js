const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Route imports (will be added as phases progress)
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Required for Monaco Editor web workers and font assets
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── General Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1', studentRoutes);

// ─── Frontend Static Files (Single-Host Production Deployment) ─────────────
const distCandidates = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../../public'),
  path.join(__dirname, '../../client/dist'),
];

const clientDistPath = distCandidates.find((dir) => fs.existsSync(dir));

if (clientDistPath) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all frontend routes (excluding /api and /health)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/health')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
