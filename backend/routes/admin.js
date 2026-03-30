/**
 * DekhLaw — Admin Routes
 * All endpoints require admin JWT.
 *
 * GET  /api/admin/dashboard           → Stats overview
 * GET  /api/admin/verifications       → Pending lawyer verifications
 * PATCH /api/admin/verifications/:id  → Approve / reject lawyer
 * GET  /api/admin/lawyers             → All lawyers (including unverified)
 * PATCH /api/admin/lawyers/:id        → Edit lawyer details
 * DELETE /api/admin/lawyers/:id       → Deactivate lawyer
 * GET  /api/admin/users               → All registered users
 */

const express = require('express');
const router  = express.Router();

const db      = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────

router.get('/dashboard', (req, res) => {
  const stats = {
    users: {
      total:    db.get('SELECT COUNT(*) as c FROM users', []).c,
      today:    db.get("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')", []).c,
    },
    lawyers: {
      total:      db.get('SELECT COUNT(*) as c FROM lawyers', []).c,
      verified:   db.get('SELECT COUNT(*) as c FROM lawyers WHERE is_verified = 1', []).c,
      pending:    db.get('SELECT COUNT(*) as c FROM lawyers WHERE is_verified = 0', []).c,
    },
    sos: {
      total:     db.get('SELECT COUNT(*) as c FROM sos_requests', []).c,
      pending:   db.get("SELECT COUNT(*) as c FROM sos_requests WHERE status = 'pending'", []).c,
      today:     db.get("SELECT COUNT(*) as c FROM sos_requests WHERE date(created_at) = date('now')", []).c,
      resolved:  db.get("SELECT COUNT(*) as c FROM sos_requests WHERE status = 'resolved'", []).c,
    },
    contact: {
      unread:    db.get('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0', []).c,
      total:     db.get('SELECT COUNT(*) as c FROM contact_messages', []).c,
    },
  };

  // Recent activity
  const recentSOS  = db.all('SELECT id, name, city, legal_issue, status, created_at FROM sos_requests ORDER BY created_at DESC LIMIT 5', []);
  const recentLawyers = db.all('SELECT id, full_name, city, practice_area, is_verified, created_at FROM lawyers ORDER BY created_at DESC LIMIT 5', []);

  return res.json({ success: true, stats, recentSOS, recentLawyers });
});

// ─── GET /api/admin/verifications — Pending Lawyer Queue ─────────────────────

router.get('/verifications', (req, res) => {
  const { status = 'pending' } = req.query;

  const rows = db.all(
    `SELECT v.id as verification_id, v.status, v.admin_notes, v.created_at,
            l.id, l.full_name, l.phone, l.email, l.city, l.practice_area,
            l.bar_council_number, l.court_of_practice, l.years_experience,
            l.profile_photo, l.verification_doc
     FROM lawyer_verifications v
     JOIN lawyers l ON v.lawyer_id = l.id
     WHERE v.status = ?
     ORDER BY v.created_at ASC`,
    [status]
  );

  return res.json({ success: true, data: rows });
});

// ─── PATCH /api/admin/verifications/:id — Approve/Reject ─────────────────────

router.patch('/verifications/:id', (req, res) => {
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  const v = db.get('SELECT * FROM lawyer_verifications WHERE id = ?', [req.params.id]);
  if (!v) return res.status(404).json({ success: false, message: 'Verification record not found.' });

  if (action === 'approve') {
    db.run("UPDATE lawyers SET is_verified = 1, updated_at = datetime('now') WHERE id = ?", [v.lawyer_id]);
    db.run(
      `UPDATE lawyer_verifications SET status = 'approved', admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?`,
      [notes || null, req.params.id]
    );
    return res.json({ success: true, message: 'Lawyer approved and is now visible on the platform.' });

  } else if (action === 'reject') {
    db.run("UPDATE lawyers SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [v.lawyer_id]);
    db.run(
      `UPDATE lawyer_verifications SET status = 'rejected', admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?`,
      [notes || null, req.params.id]
    );
    return res.json({ success: true, message: 'Lawyer registration rejected.' });

  } else {
    return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
  }
});

// ─── GET /api/admin/lawyers — All Lawyers ────────────────────────────────────

router.get('/lawyers', (req, res) => {
  const { city, practice_area, is_verified, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  let query  = 'SELECT * FROM lawyers WHERE 1=1';
  const args = [];

  if (city)          { query += ' AND city LIKE ?';          args.push(`%${city}%`); }
  if (practice_area) { query += ' AND practice_area LIKE ?'; args.push(`%${practice_area}%`); }
  if (is_verified !== undefined) { query += ' AND is_verified = ?'; args.push(Number(is_verified)); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(Number(limit), offset);

  const data  = db.all(query, args);
  const total = db.get('SELECT COUNT(*) as c FROM lawyers', []).c;

  return res.json({ success: true, data, total });
});

// ─── PATCH /api/admin/lawyers/:id — Edit Lawyer ──────────────────────────────

router.patch('/lawyers/:id', (req, res) => {
  const allowed = ['full_name', 'phone', 'email', 'city', 'state', 'practice_area',
                   'years_experience', 'court_of_practice', 'bio', 'is_active', 'is_verified'];
  const updates = [];
  const vals    = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      vals.push(req.body[key]);
    }
  }

  if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update.' });

  updates.push("updated_at = datetime('now')");
  vals.push(req.params.id);

  db.run(`UPDATE lawyers SET ${updates.join(', ')} WHERE id = ?`, vals);
  return res.json({ success: true, message: 'Lawyer updated.' });
});

// ─── DELETE /api/admin/lawyers/:id — Deactivate ──────────────────────────────

router.delete('/lawyers/:id', (req, res) => {
  db.run("UPDATE lawyers SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [req.params.id]);
  return res.json({ success: true, message: 'Lawyer deactivated.' });
});

// ─── GET /api/admin/users — All Users ────────────────────────────────────────

router.get('/users', (req, res) => {
  const { city, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  let query  = 'SELECT id, full_name, phone, email, city, whatsapp, created_at FROM users WHERE 1=1';
  const args = [];

  if (city) { query += ' AND city LIKE ?'; args.push(`%${city}%`); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(Number(limit), offset);

  const data  = db.all(query, args);
  const total = db.get('SELECT COUNT(*) as c FROM users', []).c;

  return res.json({ success: true, data, total });
});

module.exports = router;
