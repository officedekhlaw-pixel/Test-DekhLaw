/**
 * DekhLaw — Auth Routes
 *
 * POST /api/auth/register/user    → User registration
 * POST /api/auth/register/lawyer  → Lawyer registration
 * POST /api/auth/login/admin      → Admin login
 * POST /api/auth/login/user       → User login (by phone OTP — stub)
 */

const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();

const db       = require('../config/db');
const { handleUserUpload, handleLawyerUpload } = require('../middleware/upload');
const { validate, userRegisterRules, lawyerRegisterRules, adminLoginRules } = require('../middleware/validate');
const { issueToken } = require('../middleware/auth');

// ─── Helper: sanitize phone (strip +91, spaces, dashes) ──────────────────────

function cleanPhone(phone = '') {
  return phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
}

// ─── POST /api/auth/register/user ────────────────────────────────────────────

router.post(
  '/register/user',
  handleUserUpload,
  userRegisterRules,
  validate,
  async (req, res) => {
    try {
      const {
        full_name, phone, email, city, whatsapp
      } = req.body;

      const cleanedPhone = cleanPhone(phone);
      const profilePhoto = req.file ? req.file.path : null;

      // Check for duplicate phone
      const existing = await db.get('SELECT id FROM users WHERE phone = ?', [cleanedPhone]);
      if (existing) {
        return res.status(409).json({ success: false, message: 'A user with this phone number already exists.' });
      }

      // Handle PostgreSQL returning ID vs SQLite lastInsertRowid
      const insertSql = `INSERT INTO users (full_name, phone, email, city, profile_photo, whatsapp)
           VALUES (?, ?, ?, ?, ?, ?)`;
      const insertArgs = [
        full_name.trim(),
        cleanedPhone,
        email?.trim() || null,
        city?.trim() || null,
        profilePhoto,
        whatsapp === 'true' || whatsapp === true ? 1 : 0
      ];

      const result = await db.run(insertSql + (db.type === 'postgres' || db.type === 'pg' ? ' RETURNING id' : ''), insertArgs);
      const userId = result.lastInsertRowid;

      if (!userId) {
        throw new Error('Failed to retrieve user ID after insertion.');
      }

      const token  = issueToken({ id: userId, role: 'user', name: full_name.trim() });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        token,
        user: {
          id:    userId,
          name:  full_name.trim(),
          phone: cleanedPhone,
          city:  city?.trim(),
        }
      });

    } catch (err) {
      console.error('User registration error:', err);
      if (err.message?.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Phone or email already registered.' });
      }
      return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

// ─── POST /api/auth/register/lawyer ──────────────────────────────────────────

router.post(
  '/register/lawyer',
  handleLawyerUpload,
  lawyerRegisterRules,
  validate,
  async (req, res) => {
    try {
      const {
        full_name, phone, email, city, state,
        practice_area, years_experience,
        bar_council_number, court_of_practice,
        whatsapp, bio, languages, password
      } = req.body;

      const cleanedPhone = cleanPhone(phone);
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;

      // File paths (Cloudinary returns full URL in .path)
      const profilePhoto    = req.files?.profilePhoto?.[0]?.path    || null;
      const verificationDoc = req.files?.verificationDoc?.[0]?.path || null;

      // Duplicate checks
      const dupPhone = await db.get('SELECT id FROM lawyers WHERE phone = ?', [cleanedPhone]);
      if (dupPhone) {
        return res.status(409).json({ success: false, message: 'A lawyer with this phone number is already registered.' });
      }

      const bcrClean = bar_council_number?.trim();
      if (bcrClean) {
        const dupBcr = await db.get('SELECT id FROM lawyers WHERE bar_council_number = ?', [bcrClean]);
        if (dupBcr) {
          return res.status(409).json({ success: false, message: 'This Bar Council Registration Number is already registered.' });
        }
      }

      let lawyerId;
      const insertSql = `INSERT INTO lawyers
          (full_name, phone, email, city, state, practice_area, years_experience,
           bar_council_number, court_of_practice, password_hash, profile_photo, verification_doc,
           whatsapp, bio, languages)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertArgs = [
        full_name.trim(),
        cleanedPhone,
        email?.trim() || null,
        city?.trim()  || null,
        state?.trim() || null,
        practice_area?.trim(),
        years_experience?.trim(),
        bar_council_number?.trim(),
        court_of_practice?.trim(),
        passwordHash,
        profilePhoto,
        verificationDoc,
        whatsapp === 'true' || whatsapp === true ? 1 : 0,
        bio?.trim() || null,
        languages?.trim() || null,
      ];

      const result = await db.run(insertSql + (db.type === 'postgres' || db.type === 'pg' ? ' RETURNING id' : ''), insertArgs);
      lawyerId = result.lastInsertRowid;

      if (!lawyerId) {
        throw new Error('Failed to retrieve lawyer ID after insertion.');
      }

      // Create verification queue entry
      await db.run(
        'INSERT INTO lawyer_verifications (lawyer_id) VALUES (?)',
        [lawyerId]
      );

      const token = issueToken({ id: lawyerId, role: 'lawyer', name: full_name.trim() });

      return res.status(201).json({
        success: true,
        message: 'Lawyer profile submitted for verification. You will be notified once approved.',
        token,
        lawyer: {
          id:   lawyerId,
          name: full_name.trim(),
          city: city?.trim(),
        }
      });

    } catch (err) {
      console.error('Lawyer registration error:', err);
      if (err.message?.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Phone, email, or Bar Council number already registered.' });
      }
      return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

// ─── POST /api/auth/login/admin ───────────────────────────────────────────────

router.post('/login/admin', adminLoginRules, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await db.get('SELECT * FROM admins WHERE email = ?', [email.trim().toLowerCase()]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = issueToken({ id: admin.id, role: 'admin', name: admin.name });

    return res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ─── POST /api/auth/login/user (by phone — stub for OTP flow) ────────────────

router.post('/login/user', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required.' });

    const cleanedPhone = cleanPhone(phone);
    const user = await db.get('SELECT id, full_name, city FROM users WHERE phone = ?', [cleanedPhone]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this number. Please register.' });
    }

    const token = issueToken({ id: user.id, role: 'user', name: user.full_name });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.full_name, city: user.city }
    });
  } catch (err) {
    console.error('User login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

module.exports = router;
