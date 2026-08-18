const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

const isProduction = process.env.DATABASE_URL;
let db;
let pool;

if (isProduction) {
    // USE POSTGRESQL (for Render)
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL');
} else {
    // USE SQLITE (for Local Development)
    const dbPath = path.join(__dirname, '..', 'eventconnect.db');
    db = new sqlite3.Database(dbPath);
    console.log('Connected to SQLite');
}

// Convert SQLite "?" placeholders to PostgreSQL "$1, $2..."
const formatSql = (sql, params) => {
    if (!isProduction) return sql;
    let count = 0;
    return sql.replace(/\?/g, () => `$${++count}`);
};

// Promisified database helpers (works for both)
const query = async (sql, params = []) => {
    if (isProduction) {
        const res = await pool.query(formatSql(sql), params);
        return { rows: res.rows };
    } else {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve({ rows });
            });
        });
    }
};

const get = async (sql, params = []) => {
    if (isProduction) {
        const res = await pool.query(formatSql(sql), params);
        return res.rows[0];
    } else {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }
};

const run = async (sql, params = []) => {
    if (isProduction) {
        // For PostgreSQL, we add RETURNING id to get the last inserted ID
        const pgSql = formatSql(sql) + (sql.toLowerCase().includes('insert') ? ' RETURNING id' : '');
        const res = await pool.query(pgSql, params);
        return { id: res.rows[0]?.id, changes: res.rowCount };
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
};

const initDb = async () => {
    const pkType = isProduction ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
    const timestampType = isProduction ? "TIMESTAMP" : "DATETIME";

    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
          id ${pkType},
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'attendee',
          skills TEXT DEFAULT '[]',
          bio TEXT,
          default_upi_id TEXT,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS user_preferences (
          id ${pkType},
          user_id INTEGER UNIQUE NOT NULL,
          categories TEXT,
          budget_pref TEXT,
          time_pref TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS events (
          id ${pkType},
          organizer_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          start_time ${timestampType} NOT NULL,
          end_time ${timestampType} NOT NULL,
          venue_name TEXT NOT NULL,
          venue_lat REAL,
          venue_lng REAL,
          capacity INTEGER NOT NULL DEFAULT 50,
          price REAL NOT NULL DEFAULT 0,
          banner_url TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          team_required INTEGER DEFAULT 0,
          max_team_size INTEGER DEFAULT 4,
          team_lock_time ${timestampType},
          participation_mode TEXT DEFAULT 'solo_only',
          organizer_upi_id TEXT,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS registrations (
          id ${pkType},
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'confirmed',
          qr_token TEXT,
          payment_status TEXT DEFAULT 'not_required',
          payment_note TEXT,
          checked_in_at ${timestampType},
          participation_type TEXT DEFAULT 'solo',
          team_id INTEGER,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS teams (
          id ${pkType},
          event_id INTEGER NOT NULL,
          leader_id INTEGER NOT NULL,
          team_name TEXT NOT NULL,
          description TEXT,
          required_skills TEXT DEFAULT '[]',
          max_size INTEGER NOT NULL DEFAULT 4,
          current_size INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'open',
          project_pitch TEXT,
          min_size INTEGER DEFAULT 2,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS team_join_requests (
          id ${pkType},
          team_id INTEGER NOT NULL,
          requester_id INTEGER NOT NULL,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          initiated_by TEXT DEFAULT 'member_request',
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
          id ${pkType},
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS reviews (
          id ${pkType},
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          comment TEXT,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS user_interactions (
          id ${pkType},
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          action_type TEXT NOT NULL,
          created_at ${timestampType} DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (let sql of tables) {
        if (isProduction) await pool.query(sql);
        else await new Promise((resolve, reject) => {
            db.run(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

module.exports = { db, query, get, run, initDb };
