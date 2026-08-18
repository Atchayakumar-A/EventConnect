const express = require('express');
const crypto = require('crypto');
const { get, run, query } = require('../config/db');
const { authenticateToken, requireRole, requireEventOwnership, JWT_SECRET } = require('../middleware/auth');
const { createNotification } = require('../notifications/notifications.service');

const router = express.Router();

// POST /api/checkin/verify - Organizer verifies & checks in attendee QR code
// Requires organizer role AND must own the event being scanned
router.post('/verify', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { qrToken, token, eventId } = req.body;
    const tokenVal = qrToken || token;

    if (!tokenVal || !eventId) {
      return res.status(400).json({ success: false, code: 'invalid_request', reason: 'qrToken and eventId are required' });
    }

    // 0. Ownership check — organizer must own this event (admin bypasses)
    if (req.user.role !== 'admin') {
      const event = await get('SELECT organizer_id FROM events WHERE id = ?', [eventId]);
      if (!event) {
        return res.status(404).json({ success: false, code: 'invalid_request', reason: 'Event not found' });
      }
      if (event.organizer_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 'forbidden', reason: 'You do not own this event' });
      }
    }

    // 1. Verify HMAC Signature
    const parts = tokenVal.split('.');
    if (parts.length !== 2) {
      return res.status(400).json({ success: false, code: 'invalid_signature', reason: 'Malformed QR ticket payload' });
    }

    const [payloadStr, signature] = parts;
    const expectedHmac = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');

    if (signature !== expectedHmac) {
      return res.status(400).json({ success: false, code: 'invalid_signature', reason: 'Invalid or tampered ticket QR code' });
    }

    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch (e) {
      return res.status(400).json({ success: false, code: 'invalid_signature', reason: 'Invalid token payload JSON' });
    }

    const { registrationId, eventId: tokenEventId, userId } = payload;

    // 2. Verify Event Match
    if (String(tokenEventId) !== String(eventId)) {
      return res.status(400).json({ success: false, code: 'wrong_event', reason: 'Ticket is for a different event' });
    }

    // 3. Verify Registration Status
    const reg = await get('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (!reg) {
      return res.status(404).json({ success: false, code: 'not_found', reason: 'Registration record not found' });
    }

    if (reg.status === 'waitlisted' || reg.status === 'cancelled' || reg.status === 'pending_payment') {
      return res.status(400).json({ success: false, code: 'not_confirmed', reason: `Attendee registration status is ${reg.status}` });
    }

    if (reg.status === 'checked_in' || reg.checked_in_at) {
      return res.status(400).json({
        success: false,
        code: 'already_checked_in',
        reason: 'Already checked in! (Duplicate scan detected)',
        checked_in_at: reg.checked_in_at
      });
    }

    // 4. Mark Attendance
    const checkInTime = new Date().toISOString();
    await run(
      "UPDATE registrations SET status = 'checked_in', checked_in_at = ? WHERE id = ?",
      [checkInTime, registrationId]
    );

    const attendee = await get('SELECT name, email FROM users WHERE id = ?', [userId]);
    const event = await get('SELECT title FROM events WHERE id = ?', [eventId]);

    // Fetch team name if applicable
    let teamName = null;
    if (reg.team_id) {
      const team = await get('SELECT name FROM teams WHERE id = ?', [reg.team_id]);
      teamName = team ? team.name : null;
    }

    // Running check-in counter
    const counterRow = await get(
      "SELECT COUNT(*) as checked_in_count FROM registrations WHERE event_id = ? AND status = 'checked_in'",
      [eventId]
    );
    const confirmedRow = await get(
      "SELECT COUNT(*) as confirmed_count FROM registrations WHERE event_id = ? AND (status = 'confirmed' OR status = 'checked_in')",
      [eventId]
    );

    // Send in-app notification
    await createNotification(
      userId,
      'checkin',
      `Check-in verified for "${event ? event.title : 'Event'}"! Welcome!`
    );

    res.json({
      success: true,
      code: 'success',
      message: 'Check-in verified successfully!',
      attendeeName: attendee ? attendee.name : 'Attendee',
      eventTitle: event ? event.title : 'Event',
      teamName,
      attendee: attendee || { name: 'Attendee', email: '' },
      checked_in_at: checkInTime,
      checkedInCount: counterRow ? counterRow.checked_in_count : 1,
      totalConfirmed: confirmedRow ? confirmedRow.confirmed_count : 1,
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, code: 'server_error', reason: 'Internal check-in processing error' });
  }
});

// GET /api/checkin/counter/:eventId - Get live check-in counter for event
router.get('/counter/:eventId',
  authenticateToken,
  requireRole('organizer'),
  requireEventOwnership('eventId'),
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const checkedIn = await get(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'checked_in'",
        [eventId]
      );
      const totalConfirmed = await get(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND (status = 'confirmed' OR status = 'checked_in')",
        [eventId]
      );
      res.json({
        eventId,
        checkedInCount: checkedIn ? checkedIn.count : 0,
        totalConfirmed: totalConfirmed ? totalConfirmed.count : 0,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch counter' });
    }
  }
);

module.exports = router;
