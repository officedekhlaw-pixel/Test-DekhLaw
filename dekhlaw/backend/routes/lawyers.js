/**
 * DekhLaw — Lawyers Routes
 *
 * GET  /api/lawyers          → Search / list verified lawyers
 * GET  /api/lawyers/:id      → Get single lawyer profile
 * POST /api/lawyers/:id/rate → Rate a lawyer (user)
 */

const express = require('express');
const router  = express.Router();

const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// ─── GET /api/lawyers — Search & List ────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const {
      city, practice_area, experience,
      name, page = 1, limit = 20, sort = 'rating'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query  = `
      SELECT id, full_name, city, state, practice_area, years_experience,
             court_of_practice, profile_photo, rating, total_ratings,
             whatsapp, languages, bio, is_verified
      FROM lawyers
      WHERE is_active = 1
    `;
    const args = [];

    if (city)          { query += ' AND city LIKE ?';          args.push(`%${city}%`); }
    if (practice_area) { query += ' AND practice_area LIKE ?'; args.push(`%${practice_area}%`); }
    if (experience)    { query += ' AND years_experience = ?'; args.push(experience); }
    if (name)          { query += ' AND full_name LIKE ?';     args.push(`%${name}%`); }

    const sortMap = {
      rating:     'rating DESC, total_ratings DESC',
      newest:     'created_at DESC',
      experience: 'years_experience DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'rating DESC'} LIMIT ? OFFSET ?`;
    args.push(Number(limit), offset);

    const lawyers = await db.all(query, args);

    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM lawyers WHERE is_active = 1';
    const countArgs = [];
    if (city)          { countQuery += ' AND city LIKE ?';          countArgs.push(`%${city}%`); }
    if (practice_area) { countQuery += ' AND practice_area LIKE ?'; countArgs.push(`%${practice_area}%`); }
    if (experience)    { countQuery += ' AND years_experience = ?'; countArgs.push(experience); }
    if (name)          { countQuery += ' AND full_name LIKE ?';     countArgs.push(`%${name}%`); }

    const countRow = await db.get(countQuery, countArgs);
    const total = parseInt(countRow.count);

    // Log search for analytics
    try {
      await db.run(
        'INSERT INTO search_logs (city, practice_area, results_count, ip) VALUES (?, ?, ?, ?)',
        [city || null, practice_area || null, lawyers.length, req.ip]
      );
    } catch (_) { /* analytics failure should not break the response */ }

    return res.json({
      success: true,
      data:    lawyers,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / Number(limit))
    });

  } catch (err) {
    console.error('Lawyer search error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch lawyers.' });
  }
});

// ─── GET /api/lawyers/:id — Single Profile ────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const lawyer = await db.get(
      `SELECT id, full_name, city, state, practice_area, years_experience,
              court_of_practice, profile_photo, rating, total_ratings,
              whatsapp, languages, bio, is_verified, created_at
       FROM lawyers WHERE id = ? AND is_active = 1`,
      [req.params.id]
    );

    if (!lawyer) {
      return res.status(404).json({ success: false, message: 'Lawyer not found.' });
    }

    return res.json({ success: true, data: lawyer });
  } catch (err) {
    console.error('Lawyer fetch error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ─── POST /api/lawyers/:id/rate — Rate a Lawyer ──────────────────────────────

router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const lawyer = await db.get('SELECT id, rating, total_ratings FROM lawyers WHERE id = ?', [req.params.id]);
    if (!lawyer) return res.status(404).json({ success: false, message: 'Lawyer not found.' });

    const newTotal  = (parseInt(lawyer.total_ratings) || 0) + 1;
    const newRating = (((parseFloat(lawyer.rating) || 0) * (parseInt(lawyer.total_ratings) || 0)) + Number(rating)) / newTotal;

    await db.run(
      `UPDATE lawyers SET rating = ?, total_ratings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [Math.round(newRating * 10) / 10, newTotal, lawyer.id]
    );

    return res.json({ success: true, message: 'Rating submitted. Thank you!', newRating });
  } catch (err) {
    console.error('Rating error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
});

module.exports = router;
