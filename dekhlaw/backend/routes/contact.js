/**
 * DekhLaw — Contact Routes
 *
 * POST /api/contact      → Submit contact message
 * GET  /api/contact      → Get all messages (admin)
 * PATCH /api/contact/:id → Mark as read (admin)
 */

const express = require('express');
const router  = express.Router();

const db      = require('../config/db');
const { validate, contactRules } = require('../middleware/validate');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── POST /api/contact ────────────────────────────────────────────────────────

router.post('/', contactRules, validate, (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    db.run(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        message.trim()
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. We will get back to you within 24 hours.'
    });

  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

// ─── GET /api/contact — All Messages (admin) ─────────────────────────────────

router.get('/', authMiddleware, adminOnly, (req, res) => {
  const { is_read, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query  = 'SELECT * FROM contact_messages WHERE 1=1';
  const args = [];

  if (is_read !== undefined) {
    query += ' AND is_read = ?';
    args.push(is_read === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(Number(limit), Number(offset));

  const data  = db.all(query, args);
  const total = db.get('SELECT COUNT(*) as count FROM contact_messages', []).count;
  const unread = db.get('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0', []).count;

  return res.json({ success: true, data, total, unread, page: Number(page) });
});

// ─── PATCH /api/contact/:id — Mark as read (admin) ───────────────────────────

router.patch('/:id', authMiddleware, adminOnly, (req, res) => {
  db.run(
    `UPDATE contact_messages SET is_read = 1, replied_at = datetime('now') WHERE id = ?`,
    [req.params.id]
  );
  return res.json({ success: true, message: 'Marked as read.' });
});

module.exports = router;
