require('dotenv').config();

// ── Startup env guard — log missing vars but don't process.exit in serverless ──
const REQUIRED_ENV = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'STRIPE_MONTHLY_PRICE_ID', 'STRIPE_YEARLY_PRICE_ID',
  'RESEND_API_KEY', 'FRONTEND_URL'
];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error('FATAL: Missing required environment variables:', missingEnv.join(', '));
  // Don't process.exit() in serverless — it kills the worker permanently
  // The app will fail gracefully on first DB/API call instead
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// CORS — allow frontend origin with or without trailing slash
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // strip trailing slash variant
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, error: 'Too many OTP attempts. Try again in 10 minutes.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // generous limit — Vercel serverless resets state on cold starts anyway
  message: { success: false, error: 'Too many requests. Slow down.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply general limiter to all routes
app.use('/api/', generalLimiter);

// Stripe webhook needs raw body for signature verification
// Vercel pre-buffers the body — use verify callback to capture raw bytes
app.use(express.json({
  limit: '100kb',
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/webhook') {
      req.rawBody = buf; // save raw Buffer for Stripe signature check
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/reset-password', otpLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/subscribe', require('./routes/subscriptions'));
app.use('/api/subscription', require('./routes/subscriptions'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/winners', require('./routes/winners'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

const PORT = process.env.PORT || 5000;
// Only listen in local dev — Vercel serverless uses the exported app directly
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
