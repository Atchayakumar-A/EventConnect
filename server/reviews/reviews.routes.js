const express = require('express');
const { run, get, query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews - Submit a rating and review for an event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, rating, comment } = req.body;

    if (!event_id || !rating) {
      return res.status(400).json({ error: 'event_id and rating (1-5) are required' });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // 1. Verify user registration status (checked_in required)
    const reg = await get(
      "SELECT id FROM registrations WHERE user_id = ? AND event_id = ? AND (status = 'checked_in' OR checked_in_at IS NOT NULL)",
      [req.user.id, event_id]
    );

    if (!reg) {
      return res.status(403).json({ error: 'Only attendees who have been checked in at the venue can review this event.' });
    }

    // 2. Check duplicate review
    const existing = await get(
      'SELECT id FROM reviews WHERE user_id = ? AND event_id = ?',
      [req.user.id, event_id]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a review for this event.' });
    }

    // Insert review
    await run(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, event_id, ratingVal, comment || '']
    );

    // Calculate updated avg rating
    const stats = await get(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE event_id = ?',
      [event_id]
    );

    res.status(201).json({
      message: 'Review submitted successfully!',
      stats: {
        avgRating: Math.round((stats.avg_rating || 0) * 10) / 10,
        reviewCount: stats.review_count
      }
    });

  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews/event/:eventId - Fetch reviews & average rating for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const listSql = `
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `;

    const result = await query(listSql, [eventId]);

    const stats = await get(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE event_id = ?',
      [eventId]
    );

    res.json({
      reviews: result.rows,
      avgRating: stats && stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0,
      reviewCount: stats ? stats.review_count : 0
    });
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
