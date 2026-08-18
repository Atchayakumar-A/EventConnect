const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { run, get, query } = require('../config/db');
const { authenticateToken, JWT_SECRET, requireRole, requireEventOwnership } = require('../middleware/auth');
const { checkTimeConflict } = require('../conflicts/conflict.service');
const { createNotification } = require('../notifications/notifications.service');

const router = express.Router();

// Helper to generate HMAC signed QR token payload
const generateQrToken = (registrationId, eventId, userId) => {
  const payload = JSON.stringify({ registrationId, eventId, userId, timestamp: Date.now() });
  const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}.${hmac}`;
};

// Create Registration / RSVP
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, bypassConflictWarning, team_id } = req.body;
    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    // 1. Verify Event Existence & Status
    const event = await get('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event || event.status !== 'active') {
      return res.status(404).json({ error: 'Event not available for registration' });
    }

    // 2. Check existing user registration for this event
    const existingReg = await get('SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?', [req.user.id, event_id]);
    if (existingReg) {
      return res.status(400).json({ error: `You are already registered for this event (status: ${existingReg.status})` });
    }

    // 3. Time Conflict Check
    if (!bypassConflictWarning) {
      const conflictCheck = await checkTimeConflict(req.user.id, event_id);
      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          conflict: true,
          conflictingEvent: conflictCheck.conflicts[0],
          message: `This event overlaps with "${conflictCheck.conflicts[0].title}" which you are already registered for.`
        });
      }
    }

    // 4. Capacity Check
    const countRow = await get("SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'confirmed'", [event_id]);
    const currentConfirmedCount = countRow ? countRow.count : 0;

    const isPaid = Number(event.price) > 0;

    // For paid events: always pending payment (no waitlist yet — capacity checked after confirmation)
    const registrationStatus = isPaid
      ? 'pending_payment'
      : (currentConfirmedCount >= event.capacity ? 'waitlisted' : 'confirmed');

    const paymentStatus = isPaid ? 'awaiting_verification' : 'not_required';

    // 5. Insert Registration Record
    const result = await run(
      'INSERT INTO registrations (user_id, event_id, status, team_id, payment_status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, event_id, registrationStatus, team_id || null, paymentStatus]
    );

    const registrationId = result.id;

    if (!isPaid) {
      // Free event — generate QR immediately
      const qrToken = generateQrToken(registrationId, event_id, req.user.id);
      await run('UPDATE registrations SET qr_token = ? WHERE id = ?', [qrToken, registrationId]);

      const notifyMsg = registrationStatus === 'waitlisted'
        ? `You have been added to the waitlist for "${event.title}".`
        : `Your registration for "${event.title}" is confirmed!`;
      await createNotification(req.user.id, 'registration', notifyMsg);

      const qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
        color: { dark: '#334155', light: '#FAF9F6' },
        width: 250,
        margin: 2
      });

      return res.status(201).json({
        message: registrationStatus === 'waitlisted'
          ? 'Capacity reached. You have been added to the waitlist.'
          : 'Registration confirmed successfully!',
        registration: {
          id: registrationId,
          event_id,
          status: registrationStatus,
          payment_status: paymentStatus,
          qrToken,
          qrCodeDataUrl,
          event
        }
      });
    } else {
      // Paid event — no QR yet; return UPI details for payment
      await createNotification(req.user.id, 'payment', `Please complete payment for "${event.title}". Send ₹${event.price} to UPI ID: ${event.organizer_upi_id || 'N/A'} and wait for organizer confirmation.`);

      return res.status(201).json({
        message: 'Registration initiated. Please complete UPI payment and await organizer confirmation.',
        registration: {
          id: registrationId,
          event_id,
          status: registrationStatus,
          payment_status: paymentStatus,
          upiId: event.organizer_upi_id,
          amount: event.price,
          event
        }
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// ─── Organizer: List pending payments for their event ────────────────────────
router.get('/pending-payments/:eventId',
  authenticateToken,
  requireRole('organizer'),
  requireEventOwnership('eventId'),
  async (req, res) => {
    try {
      const pendingRegs = await query(`
        SELECT r.id as registration_id, r.user_id, r.payment_status, r.payment_note, r.created_at,
               u.name as attendee_name, u.email as attendee_email
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ? AND r.payment_status = 'awaiting_verification'
        ORDER BY r.created_at ASC
      `, [req.params.eventId]);

      res.json({ event: req.event, pendingPayments: pendingRegs.rows });
    } catch (err) {
      console.error('Pending payments error:', err);
      res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
  }
);

// ─── Organizer: Confirm a payment → generate QR ──────────────────────────────
router.post('/payments/:registrationId/confirm', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const reg = await get(`
      SELECT r.*, e.organizer_id, e.price, e.title, e.capacity
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [req.params.registrationId]);

    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: you do not own this event' });
    }
    if (reg.payment_status !== 'awaiting_verification') {
      return res.status(400).json({ error: 'Payment is not in awaiting_verification state' });
    }

    // Capacity re-check at confirmation time
    const countRow = await get("SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'confirmed'", [reg.event_id]);
    const currentCount = countRow ? countRow.count : 0;
    const newStatus = currentCount >= reg.capacity ? 'waitlisted' : 'confirmed';

    // Generate QR
    const qrToken = generateQrToken(reg.id, reg.event_id, reg.user_id);

    await run(`
      UPDATE registrations
      SET payment_status = 'confirmed', status = ?, qr_token = ?
      WHERE id = ?
    `, [newStatus, qrToken, reg.id]);

    // Notify attendee
    const notifyMsg = newStatus === 'confirmed'
      ? `Your payment for "${reg.title}" has been confirmed! Your QR ticket is ready.`
      : `Your payment for "${reg.title}" was confirmed but the event is full — you're on the waitlist.`;
    await createNotification(reg.user_id, 'payment_confirmed', notifyMsg);

    const qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
      color: { dark: '#334155', light: '#FAF9F6' },
      width: 250,
      margin: 2
    });

    res.json({ message: 'Payment confirmed and QR ticket generated', qrCodeDataUrl });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// ─── Organizer: Reject a payment ─────────────────────────────────────────────
router.post('/payments/:registrationId/reject', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { note } = req.body;
    const reg = await get(`
      SELECT r.*, e.organizer_id, e.title
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [req.params.registrationId]);

    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: you do not own this event' });
    }

    await run(`
      UPDATE registrations
      SET payment_status = 'rejected', status = 'cancelled', payment_note = ?
      WHERE id = ?
    `, [note || 'Payment could not be verified', reg.id]);

    await createNotification(reg.user_id, 'payment_rejected',
      `Your payment for "${reg.title}" was rejected. Reason: ${note || 'Payment could not be verified'}. Please contact the organizer.`
    );

    res.json({ message: 'Payment rejected and attendee notified' });
  } catch (err) {
    console.error('Reject payment error:', err);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// Check Time Conflict for pre-check endpoint
router.get('/check-conflict/:eventId', authenticateToken, async (req, res) => {
  try {
    const result = await checkTimeConflict(req.user.id, req.params.eventId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Conflict check failed' });
  }
});

// Get User's Registered Events ("My Events" screen)
router.get('/my-events', authenticateToken, async (req, res) => {
  try {
    const registeredSql = `
      SELECT r.id as registration_id, r.status as registration_status, r.qr_token,
             r.payment_status, r.payment_note, r.created_at as registered_at,
             e.*, u.name as organizer_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.organizer_id = u.id
      WHERE r.user_id = ?
      ORDER BY e.start_time ASC
    `;
    const registered = await query(registeredSql, [req.user.id]);

    // Created events if organizer
    let created = [];
    if (req.user.role === 'organizer') {
      const createdSql = `
        SELECT e.*,
          (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as confirmed_count,
          (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') as waitlist_count,
          (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.payment_status = 'awaiting_verification') as pending_payments_count,
          (SELECT AVG(rv.rating) FROM reviews rv WHERE rv.event_id = e.id) as avg_rating
        FROM events e
        WHERE e.organizer_id = ?
        ORDER BY e.created_at DESC
      `;
      const createdRes = await query(createdSql, [req.user.id]);
      created = createdRes.rows;
    }

    res.json({
      registeredEvents: registered.rows,
      createdEvents: created
    });
  } catch (err) {
    console.error('Fetch my-events error:', err);
    res.status(500).json({ error: 'Failed to fetch registered events' });
  }
});

// ─── Organizer: List all attendees for an event ───────────────────────────────
router.get('/event/:eventId',
  authenticateToken,
  requireRole('organizer'),
  requireEventOwnership('eventId'),
  async (req, res) => {
    try {
      const { status } = req.query;
      let sql = `
        SELECT r.id as registration_id, r.status, r.payment_status, r.created_at as registered_at,
               r.checked_in_at, r.payment_note,
               u.name as attendee_name, u.email as attendee_email,
               t.name as team_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN teams t ON r.team_id = t.id
        WHERE r.event_id = ?
      `;
      const params = [req.params.eventId];

      if (status && status !== 'all') {
        sql += ' AND r.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY r.created_at ASC';

      const result = await query(sql, params);
      res.json({ event: req.event, attendees: result.rows });
    } catch (err) {
      console.error('Fetch event attendees error:', err);
      res.status(500).json({ error: 'Failed to fetch attendees' });
    }
  }
);

// Get Ticket details + base64 QR code image
router.get('/:registrationId/ticket', authenticateToken, async (req, res) => {
  try {
    const ticket = await get(`
      SELECT r.id as registration_id, r.status, r.qr_token, r.created_at as registered_at,
             r.payment_status, r.payment_note,
             e.title, e.category, e.start_time, e.end_time, e.venue_name, e.banner_url,
             e.price, e.organizer_upi_id,
             u.name as attendee_name, u.email as attendee_email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND r.user_id = ?
    `, [req.params.registrationId, req.user.id]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    let qrCodeDataUrl = null;
    // Only generate QR if payment is confirmed (or free event)
    if (ticket.qr_token && ticket.payment_status !== 'awaiting_verification' && ticket.payment_status !== 'rejected') {
      qrCodeDataUrl = await QRCode.toDataURL(ticket.qr_token, {
        color: { dark: '#2B5B7A', light: '#FAF9F6' },
        width: 280,
        margin: 2
      });
    }

    res.json({ ...ticket, qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate ticket QR' });
  }
});

// Cancel Registration
router.delete('/:registrationId', authenticateToken, async (req, res) => {
  try {
    const reg = await get('SELECT * FROM registrations WHERE id = ? AND user_id = ?', [req.params.registrationId, req.user.id]);
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await run('DELETE FROM registrations WHERE id = ?', [req.params.registrationId]);
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

module.exports = router;
