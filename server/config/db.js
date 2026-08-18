const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// On Render, we use /data/eventconnect.db for persistence.
// On your computer, it stays in the server folder.
const isRender = process.env.RENDER === 'true';
const dbDir = isRender ? '/data' : __dirname;
const dbPath = isRender ? path.join('/data', 'eventconnect.db') : path.join(__dirname, '..', 'eventconnect.db');

// Ensure directory exists if on Render
if (isRender && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Promisified database helpers
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve({ rows });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const initDb = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'attendee',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          categories TEXT,
          budget_pref TEXT,
          time_pref TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organizer_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          venue_name TEXT NOT NULL,
          venue_lat REAL,
          venue_lng REAL,
          capacity INTEGER NOT NULL DEFAULT 50,
          price REAL NOT NULL DEFAULT 0,
          banner_url TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organizer_id) REFERENCES users(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'confirmed',
          qr_token TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
        );
      `);

      // Phase 2 Tables
      db.run(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL,
          leader_id INTEGER NOT NULL,
          team_name TEXT NOT NULL,
          description TEXT,
          required_skills TEXT DEFAULT '[]',
          max_size INTEGER NOT NULL DEFAULT 4,
          current_size INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'open',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id),
          FOREIGN KEY (leader_id) REFERENCES users(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS team_join_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          requester_id INTEGER NOT NULL,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id),
          FOREIGN KEY (requester_id) REFERENCES users(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, event_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS user_interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          action_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
        );
      `);

      // Safely apply alter table column additions if they do not exist
      const alterSafe = (table, column, typeDef) => {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef};`, (err) => {
          // Ignore error if column already exists
        });
      };

      alterSafe('users', 'skills', "TEXT DEFAULT '[]'");
      alterSafe('users', 'bio', 'TEXT');
      alterSafe('events', 'team_required', 'INTEGER DEFAULT 0');
      alterSafe('events', 'max_team_size', 'INTEGER DEFAULT 4');
      alterSafe('events', 'team_lock_time', 'DATETIME');
      alterSafe('events', 'participation_mode', "TEXT DEFAULT 'solo_only'");
      alterSafe('registrations', 'team_id', 'INTEGER');
      alterSafe('registrations', 'checked_in_at', 'DATETIME');
      alterSafe('registrations', 'participation_type', "TEXT DEFAULT 'solo'");
      alterSafe('teams', 'project_pitch', 'TEXT');
      alterSafe('teams', 'min_size', 'INTEGER DEFAULT 2');
      alterSafe('team_join_requests', 'initiated_by', "TEXT DEFAULT 'member_request'");
      // UPI Payment columns
      alterSafe('events', 'organizer_upi_id', 'TEXT');
      alterSafe('registrations', 'payment_status', "TEXT DEFAULT 'not_required'");
      alterSafe('registrations', 'payment_note', 'TEXT');
      // Organizer default UPI ID (pre-fills new events)
      alterSafe('users', 'default_upi_id', 'TEXT');

      db.run('SELECT 1;', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

module.exports = { db, query, get, run, initDb };
