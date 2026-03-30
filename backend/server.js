/**
 * DekhLaw — Express Backend Server
 * Handles all form submissions, auth, file uploads, and data storage.
 */

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/db');

const authRoutes    = require('./routes/auth');
const sosRoutes     = require('./routes/sos');
const contactRoutes = require('./routes/contact');
const lawyerRoutes  = require('./routes/lawyers');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Middleware ────────────────────────────────────────────────────

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500'
].filter(Boolean);

app.use(helmet());
app.use(cors()); // Allow all for simplicity, or refine after testing
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for deployment health checks
app.get('/', (req, res) => {
  res.send('DekhLaw Backend is running');
});

// Serve uploaded files (profile photos, documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Strict limit on SOS submissions (prevent abuse)
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Too many SOS requests. Please wait 15 minutes.' }
});

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

app.use('/api/', generalLimiter);
app.use('/api/sos', sosLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',    authRoutes);
app.use('/api/sos',     sosRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/admin',   adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DekhLaw API is running', timestamp: new Date() });
});

// ─── 404 & Error Handler ─────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

db.connect().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ DekhLaw backend running on port ${PORT}`);
    console.log(`📦 Database: ${process.env.DB_TYPE || 'sqlite (default)'}\n`);
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});

module.exports = app;
