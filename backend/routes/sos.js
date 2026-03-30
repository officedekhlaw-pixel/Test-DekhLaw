/**
 * DekhLaw — SOS Routes
 *
 * POST /api/sos             → Submit SOS request (₹199 emergency)
 * GET  /api/sos/:id         → Get SOS status (user)
 * GET  /api/sos             → List all SOS (admin)
 * PATCH /api/sos/:id/status → Update SOS status (admin)
 * PATCH /api/sos/:id/assign → Assign lawyer to SOS (admin)
 */

const express  = require('express');
const router   = express.Router();

const db       = require('../config/db');
const { validate, sosRules } = require('../middleware/validate');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { notifyLawyer } = require('../utils/notify');

// ─── POST /api/sos — Submit SOS Request ──────────────────────────────────────

router.post('/', sosRules, validate, async (req, res) => {
  try {
    const { name, phone, city, legalIssue, description } = req.body;

    // Sanitize phone
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);

    const result = db.run(
      `INSERT INTO sos_requests (name, phone, city, legal_issue, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cleanPhone,
        city.trim(),
        legalIssue.trim(),
        description?.trim() || null
      ]
    );

    const sosId = result.lastInsertRowid;

    // Auto-match: find available lawyers in the same city with matching practice area
    const matchedLawyers = findMatchingLawyers(city.trim(), legalIssue);

    // Notify matched lawyers (WhatsApp / SMS in production)
    for (const lawyer of matchedLawyers.slice(0, 3)) {
      await notifyLawyer(lawyer, { name, phone: cleanPhone, city, legalIssue, sosId });
    }

    return res.status(201).json({
      success:        true,
      message:        'SOS request submitted. A lawyer will contact you shortly.',
      sosId,
      matchedLawyers: matchedLawyers.length,
    });

  } catch (err) {
    console.error('SOS error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit SOS. Please call us directly.' });
  }
});

// ─── Helper: find matching lawyers ───────────────────────────────────────────

function findMatchingLawyers(city, legalIssue) {
  // Map SOS issue → practice area
  const issueMap = {
    'Detained / Arrested':    'Criminal Law',
    'Urgent Legal Notice':    'Civil Law',
    'At a Court Proceeding':  'Civil Law',
    'Unlawful Eviction':      'Property Law',
    'Other Legal Emergency':  null,
  };
  const practiceArea = issueMap[legalIssue];

  let query  = 'SELECT id, full_name, phone, whatsapp FROM lawyers WHERE is_verified = 1 AND is_active = 1 AND city LIKE ?';
  const args = [`%${city}%`];

  if (practiceArea) {
    query += ' AND practice_area = ?';
    args.push(practiceArea);
  }

  query += ' ORDER BY rating DESC LIMIT 10';

  return db.all(query, args);
}

// ─── GET /api/sos/:id — SOS Status (public) ──────────────────────────────────

router.get('/:id', (req, res) => {
  const sos = db.get(
    `SELECT s.id, s.name, s.city, s.legal_issue, s.status, s.created_at,
            l.full_name AS lawyer_name, l.phone AS lawyer_phone
     FROM sos_requests s
     LEFT JOIN lawyers l ON s.assigned_lawyer_id = l.id
     WHERE s.id = ?`,
    [req.params.id]
  );

  if (!sos) return res.status(404).json({ success: false, message: 'SOS request not found.' });

  return res.json({ success: true, data: sos });
});

// ─── GET /api/sos — All SOS (admin only) ─────────────────────────────────────

router.get('/', authMiddleware, adminOnly, (req, res) => {
  const { status, city, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query  = `SELECT s.*, l.full_name AS lawyer_name FROM sos_requests s LEFT JOIN lawyers l ON s.assigned_lawyer_id = l.id WHERE 1=1`;
  const args = [];

  if (status) { query += ' AND s.status = ?'; args.push(status); }
  if (city)   { query += ' AND s.city LIKE ?'; args.push(`%${city}%`); }

  query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  args.push(Number(limit), Number(offset));

  const data  = db.all(query, args);
  const total = db.get('SELECT COUNT(*) as count FROM sos_requests', []).count;

  return res.json({ success: true, data, total, page: Number(page) });
});

// ─── PATCH /api/sos/:id/status — Update Status (admin) ──────────────────────

router.patch('/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'assigned', 'resolved', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  db.run(
    `UPDATE sos_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, req.params.id]
  );

  return res.json({ success: true, message: `SOS status updated to ${status}.` });
});

// ─── PATCH /api/sos/:id/assign — Assign Lawyer (admin) ──────────────────────

router.patch('/:id/assign', authMiddleware, adminOnly, (req, res) => {
  const { lawyerId } = req.body;

  const lawyer = db.get('SELECT id, full_name FROM lawyers WHERE id = ?', [lawyerId]);
  if (!lawyer) return res.status(404).json({ success: false, message: 'Lawyer not found.' });

  db.run(
    `UPDATE sos_requests
     SET assigned_lawyer_id = ?, status = 'assigned', updated_at = datetime('now')
     WHERE id = ?`,
    [lawyerId, req.params.id]
  );

  return res.json({ success: true, message: `SOS assigned to ${lawyer.full_name}.` });
});

module.exports = router;
