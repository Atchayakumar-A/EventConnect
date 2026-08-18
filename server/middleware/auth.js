const jwt = require('jsonwebtoken');
const { get } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'eventconnect_super_secret_jwt_key_2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Permission denied. Required role: ${role}` });
    }
    next();
  };
};

/**
 * Middleware factory: verifies that the authenticated organizer owns the event
 * referenced by req.params[eventIdParam] (defaults to 'eventId').
 * Admin role bypasses the check.
 * Attaches the loaded event to req.event for downstream use.
 */
const requireEventOwnership = (eventIdParam = 'eventId') => {
  return async (req, res, next) => {
    try {
      const eventId = req.params[eventIdParam];
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }
      const event = await get('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      // Admin bypasses ownership check
      if (req.user.role === 'admin') {
        req.event = event;
        return next();
      }
      if (event.organizer_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: you do not own this event' });
      }
      req.event = event;
      next();
    } catch (err) {
      console.error('Ownership check error:', err);
      res.status(500).json({ error: 'Ownership verification failed' });
    }
  };
};

module.exports = { authenticateToken, requireRole, requireEventOwnership, JWT_SECRET };
