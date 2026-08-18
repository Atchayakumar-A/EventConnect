const express = require('express');
const { query, get, run } = require('../config/db');
const { authenticateToken, requireRole, requireEventOwnership } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/organizer/:eventId - Metrics for event organizer
router.get('/organizer/:eventId',
  authenticateToken,
  requireRole('organizer'),
  requireEventOwnership('eventId'),
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const event = req.event; // provided by requireEventOwnership

      // 1. Registration Counts (all statuses)
      const regStats = await get(`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
          SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END) as waitlist_count,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
          SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in_count,
          SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment_count,
          SUM(CASE WHEN payment_status = 'awaiting_verification' THEN 1 ELSE 0 END) as pending_payments
        FROM registrations
        WHERE event_id = ?
      `, [eventId]);

      // 2. Registrations Over Time (grouped by day)
      const timelineRes = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM registrations
        WHERE event_id = ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [eventId]);

      // 3. Reviews & Ratings
      const reviewStats = await get(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE event_id = ?',
        [eventId]
      );

      const recentReviews = await query(`
        SELECT r.*, u.name as reviewer_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [eventId]);

      // 4. Team stats if team event
      let teamStats = null;
      if (event.team_required) {
        const teamsInfo = await get(`
          SELECT 
            COUNT(*) as total_teams,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as recruiting_teams,
            SUM(CASE WHEN status = 'full' THEN 1 ELSE 0 END) as full_teams
          FROM teams
          WHERE event_id = ?
        `, [eventId]);
        teamStats = teamsInfo;
      }

      // 5. Revenue (confirmed payments × price)
      let revenue = 0;
      if (Number(event.price) > 0) {
        const revRow = await get(`
          SELECT COUNT(*) as confirmed_paid
          FROM registrations
          WHERE event_id = ? AND payment_status = 'confirmed'
        `, [eventId]);
        revenue = (revRow ? revRow.confirmed_paid : 0) * Number(event.price);
      }

      const confirmedCount = regStats ? regStats.confirmed_count || 0 : 0;
      const checkedInCount = regStats ? regStats.checked_in_count || 0 : 0;
      // Attendance rate = checked_in / (confirmed + checked_in) — those who showed up / total who showed plus were confirmed
      const totalExpected = confirmedCount + checkedInCount;
      const attendanceRate = totalExpected > 0 ? Math.round((checkedInCount / totalExpected) * 100) : 0;
      const noShowRate = 100 - attendanceRate;

      res.json({
        event,
        stats: {
          totalRegistrations: regStats ? regStats.total_registrations || 0 : 0,
          confirmedCount,
          waitlistCount: regStats ? regStats.waitlist_count || 0 : 0,
          cancelledCount: regStats ? regStats.cancelled_count || 0 : 0,
          checkedInCount,
          pendingPaymentCount: regStats ? regStats.pending_payment_count || 0 : 0,
          pendingPayments: regStats ? regStats.pending_payments || 0 : 0,
          avgRating: reviewStats && reviewStats.avg_rating ? Math.round(reviewStats.avg_rating * 10) / 10 : 0,
          reviewCount: reviewStats ? reviewStats.review_count || 0 : 0,
          attendanceRate,
          noShowRate,
          revenue,
        },
        registrationsTimeline: timelineRes.rows,
        recentReviews: recentReviews.rows,
        teamStats
      });

    } catch (err) {
      console.error('Fetch organizer analytics error:', err);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

// GET /api/analytics/admin - Full Admin summary panel
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const usersRes = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    const eventsRes = await query(`
      SELECT e.*, u.name as organizer_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as total_registrations
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ORDER BY e.created_at DESC
    `);

    res.json({
      users: usersRes.rows,
      events: eventsRes.rows
    });
  } catch (err) {
    console.error('Fetch admin panel error:', err);
    res.status(500).json({ error: 'Failed to fetch admin panel' });
  }
});

// PUT /api/analytics/admin/events/:eventId/status - Admin toggle event status
router.put('/admin/events/:eventId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const newStatus = status === 'cancelled' ? 'cancelled' : 'active';

    await run('UPDATE events SET status = ? WHERE id = ?', [newStatus, req.params.eventId]);
    res.json({ message: `Event status updated to ${newStatus}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

module.exports = router;
