const express = require('express');
const { query, get, run } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { rankEventsForUser } = require('./recommend.engine');

const router = express.Router();

// POST /api/recommendations/interaction - Log user interaction (fire-and-forget view logger)
router.post('/interaction', authenticateToken, async (req, res) => {
  try {
    const { eventId, actionType } = req.body; // actionType: 'viewed', 'registered', 'rated'
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    await run(
      'INSERT INTO user_interactions (user_id, event_id, action_type) VALUES (?, ?, ?)',
      [req.user.id, eventId, actionType || 'viewed']
    );

    res.json({ success: true });
  } catch (err) {
    // Fire-and-forget: fail silently so UI is never blocked
    res.json({ success: false });
  }
});

// GET /api/recommendations - Get personalized hybrid recommendations for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch user preferences
    const dbPrefs = await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    const userPrefs = dbPrefs ? {
      ...dbPrefs,
      categories: JSON.parse(dbPrefs.categories || '[]')
    } : { categories: [], budget_pref: 'any', time_pref: 'anytime' };

    // 2. Fetch implicit behavioral signals (interactions, registrations, reviews)
    const interactionsRes = await query(`
      SELECT i.*, e.category
      FROM user_interactions i
      JOIN events e ON i.event_id = e.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const registrationsRes = await query(`
      SELECT r.*, e.category
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
    `, [req.user.id]);

    const reviewsRes = await query(`
      SELECT rv.*, e.category
      FROM reviews rv
      JOIN events e ON rv.event_id = e.id
      WHERE rv.user_id = ?
    `, [req.user.id]);

    // 3. Fetch all upcoming active events with confirmed counts
    const eventsSql = `
      SELECT e.*, u.name as organizer_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'checked_in')) as confirmed_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.status = 'active'
      ORDER BY e.start_time ASC
    `;

    const eventsRes = await query(eventsSql);

    // 4. Rank events using hybrid recommendation engine
    const rankedEvents = rankEventsForUser(
      eventsRes.rows,
      userPrefs,
      interactionsRes.rows,
      registrationsRes.rows,
      reviewsRes.rows
    );

    res.json({
      recommendations: rankedEvents.slice(0, 8),
      userPreferencesUsed: userPrefs
    });
  } catch (err) {
    console.error('Recommendation API error:', err);
    res.status(500).json({ error: 'Failed to calculate recommendations' });
  }
});

module.exports = router;
