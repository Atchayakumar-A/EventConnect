const express = require('express');
const { run, get, query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// List Events (with filters & search)
router.get('/', async (req, res) => {
  try {
    const { category, search, startDate, endDate, organizerId } = req.query;

    let sql = `
      SELECT e.*, u.name as organizer_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as confirmed_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.status = 'active'
    `;
    const params = [];

    if (category) {
      sql += ` AND e.category = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.venue_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (startDate) {
      sql += ` AND e.start_time >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND e.end_time <= ?`;
      params.push(endDate);
    }

    if (organizerId) {
      sql += ` AND e.organizer_id = ?`;
      params.push(organizerId);
    }

    sql += ` ORDER BY e.start_time ASC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get Event by ID
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await get(`
      SELECT e.*, u.name as organizer_name, u.email as organizer_email,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') as waitlist_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `, [eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Create Event (Organizer role required)
router.post('/', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const {
      title, description, category, start_time, end_time,
      venue_name, venue_lat, venue_lng, capacity, price, banner_url,
      team_required, max_team_size, participation_mode, team_lock_time, organizer_upi_id
    } = req.body;

    if (!title || !description || !category || !start_time || !end_time || !venue_name) {
      return res.status(400).json({ error: 'Missing required event fields (title, description, category, start_time, end_time, venue_name)' });
    }

    const defaultBanner = banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
    const computedMode = participation_mode || (team_required ? 'team_only' : 'solo_only');

    const result = await run(`
      INSERT INTO events (
        organizer_id, title, description, category, start_time, end_time,
        venue_name, venue_lat, venue_lng, capacity, price, banner_url,
        team_required, max_team_size, participation_mode, team_lock_time, organizer_upi_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, title, description, category, start_time, end_time,
      venue_name, venue_lat || 0, venue_lng || 0,
      capacity || 50, price || 0, defaultBanner,
      (team_required || computedMode !== 'solo_only') ? 1 : 0, parseInt(max_team_size) || 4,
      computedMode, team_lock_time || null,
      (parseFloat(price) > 0 ? organizer_upi_id || null : null)
    ]);

    const createdEvent = await get('SELECT * FROM events WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Event created successfully', event: createdEvent });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Edit Event
router.put('/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const existing = await get('SELECT * FROM events WHERE id = ?', [eventId]);

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to edit this event' });
    }

    const {
      title, description, category, start_time, end_time,
      venue_name, venue_lat, venue_lng, capacity, price, banner_url
    } = req.body;

    await run(`
      UPDATE events SET
        title = ?, description = ?, category = ?, start_time = ?, end_time = ?,
        venue_name = ?, venue_lat = ?, venue_lng = ?, capacity = ?, price = ?, banner_url = ?
      WHERE id = ?
    `, [
      title || existing.title,
      description || existing.description,
      category || existing.category,
      start_time || existing.start_time,
      end_time || existing.end_time,
      venue_name || existing.venue_name,
      venue_lat !== undefined ? venue_lat : existing.venue_lat,
      venue_lng !== undefined ? venue_lng : existing.venue_lng,
      capacity || existing.capacity,
      price !== undefined ? price : existing.price,
      banner_url || existing.banner_url,
      eventId
    ]);

    const updated = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    res.json({ message: 'Event updated successfully', event: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Cancel Event
router.delete('/:id', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const existing = await get('SELECT * FROM events WHERE id = ?', [eventId]);

    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existing.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to cancel this event' });
    }

    await run(`UPDATE events SET status = 'cancelled' WHERE id = ?`, [eventId]);
    res.json({ message: 'Event cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

module.exports = router;
