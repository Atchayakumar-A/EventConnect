const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, query } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const userRole = role === 'organizer' ? 'organizer' : 'attendee';
    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), password_hash, userRole]
    );

    const user = { id: result.id, name, email: email.toLowerCase().trim(), role: userRole };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Signup successful',
      token,
      user,
      hasPreferences: false
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const dbUser = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    const prefs = await get('SELECT * FROM user_preferences WHERE user_id = ?', [user.id]);
    const parsedPrefs = prefs ? {
      ...prefs,
      categories: JSON.parse(prefs.categories || '[]')
    } : null;

    res.json({
      token,
      user,
      preferences: parsedPrefs,
      hasPreferences: !!parsedPrefs
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const dbUser = await get('SELECT id, name, email, role, skills, bio, default_upi_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pastEventsCountRow = await get(
      "SELECT COUNT(*) as count FROM registrations WHERE user_id = ? AND status = 'confirmed'",
      [req.user.id]
    );

    const prefs = await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    const parsedPrefs = prefs ? {
      ...prefs,
      categories: JSON.parse(prefs.categories || '[]')
    } : null;

    res.json({
      user: {
        ...dbUser,
        skills: JSON.parse(dbUser.skills || '[]'),
        past_events_count: pastEventsCountRow ? pastEventsCountRow.count : 0,
        default_upi_id: dbUser.default_upi_id || ''
      },
      preferences: parsedPrefs,
      hasPreferences: !!parsedPrefs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile (skills, bio, and default_upi_id for organizers)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { skills, bio, default_upi_id } = req.body;
    const skillsJson = JSON.stringify(skills || []);

    await run(
      'UPDATE users SET skills = ?, bio = ?, default_upi_id = ? WHERE id = ?',
      [skillsJson, bio || '', default_upi_id || null, req.user.id]
    );

    const updatedUser = await get('SELECT id, name, email, role, skills, bio, default_upi_id, created_at FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        skills: JSON.parse(updatedUser.skills || '[]'),
        default_upi_id: updatedUser.default_upi_id || ''
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Save/Update User Preferences (Onboarding)
router.post('/preferences', authenticateToken, async (req, res) => {
  try {
    const { categories, budget_pref, time_pref } = req.body;
    const categoriesJson = JSON.stringify(categories || []);
    const budget = budget_pref || 'any';
    const time = time_pref || 'anytime';

    const existing = await get('SELECT id FROM user_preferences WHERE user_id = ?', [req.user.id]);

    if (existing) {
      await run(
        'UPDATE user_preferences SET categories = ?, budget_pref = ?, time_pref = ? WHERE user_id = ?',
        [categoriesJson, budget, time, req.user.id]
      );
    } else {
      await run(
        'INSERT INTO user_preferences (user_id, categories, budget_pref, time_pref) VALUES (?, ?, ?, ?)',
        [req.user.id, categoriesJson, budget, time]
      );
    }

    const updatedPrefs = await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);

    res.json({
      message: 'Preferences saved successfully',
      preferences: {
        ...updatedPrefs,
        categories: JSON.parse(updatedPrefs.categories || '[]')
      }
    });
  } catch (err) {
    console.error('Preferences save error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

module.exports = router;
