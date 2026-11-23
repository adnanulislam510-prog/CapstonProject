/**
 * =====================================================================
 * File: /backend/db/database.js
 * Description: SQLite database connection & schema initialization
 * Database File: food_rescue.sqlite
 * =====================================================================
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Resolve path to food_rescue.sqlite in the /backend root
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '..', 'food_rescue.sqlite');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database (food_rescue.sqlite):', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Initialize database schemas
db.serialize(() => {
  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
      console.error('Failed to enable foreign keys:', err.message);
    }
  });

  // Table 1: users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('RESTAURANT', 'SHELTER')),
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });

  // Table 2: shelter_profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS shelter_profiles (
      user_id INTEGER PRIMARY KEY,
      has_van INTEGER DEFAULT 0,
      max_portions INTEGER NOT NULL,
      cutoff_time TEXT NOT NULL,
      no_show_count INTEGER DEFAULT 0,
      last_no_show_at DATETIME NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating shelter_profiles table:', err.message);
  });

  // Table 3: food_batches
  db.run(`
    CREATE TABLE IF NOT EXISTS food_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      raw_description TEXT NOT NULL,
      total_portions INTEGER NOT NULL,
      has_trays INTEGER DEFAULT 0,
      pickup_location TEXT NOT NULL,
      hold_until DATETIME NOT NULL,
      gate_code TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'CLAIMED', 'EN_ROUTE', 'COMPLETED', 'EXPIRED')),
      claimed_by_id INTEGER NULL,
      claimed_at DATETIME NULL,
      completed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (claimed_by_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating food_batches table:', err.message);
  });

  // Table 4: claim_logs
  db.run(`
    CREATE TABLE IF NOT EXISTS claim_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      shelter_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE CASCADE,
      FOREIGN KEY (shelter_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating claim_logs table:', err.message);
  });
});

/**
 * Promise-based helper methods for cleaner async/await database operations
 */
const query = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = db;
module.exports.db = db;
module.exports.query = query;

