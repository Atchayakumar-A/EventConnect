const { run } = require('../config/db');

/**
 * Helper to create an in-app notification for a user
 * @param {number} userId - Recipient user ID
 * @param {string} type - Notification category (e.g. 'registration', 'waitlist', 'team_request', 'team_response')
 * @param {string} message - Notification text message
 */
const createNotification = async (userId, type, message) => {
  try {
    await run(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [userId, type, message]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

module.exports = { createNotification };
