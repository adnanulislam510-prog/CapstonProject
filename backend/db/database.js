const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const rawDbPath = process.env.DB_PATH || 'food_rescue.sqlite';
const dbPath =
  rawDbPath === ':memory:'
    ? ':memory:'
    : path.isAbsolute(rawDbPath)
      ? rawDbPath
      : path.resolve(__dirname, '..', rawDbPath);

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');
if (dbPath !== ':memory:') {
  db.exec('PRAGMA journal_mode = WAL;');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('RESTAURANT', 'SHELTER')),
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    default_pickup_point TEXT NOT NULL DEFAULT 'Back gate',
    closing_cutoff_time TEXT NOT NULL DEFAULT '23:30',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shelter_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    has_van INTEGER NOT NULL DEFAULT 0 CHECK (has_van IN (0, 1)),
    max_portions INTEGER NOT NULL CHECK (max_portions > 0),
    cutoff_time TEXT NOT NULL,
    reliability_score REAL NOT NULL DEFAULT 5.0 CHECK (reliability_score >= 0.0 AND reliability_score <= 5.0),
    no_show_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS food_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_description TEXT NOT NULL,
    total_portions INTEGER NOT NULL CHECK (total_portions > 0),
    has_trays INTEGER NOT NULL DEFAULT 0 CHECK (has_trays IN (0, 1)),
    pickup_location TEXT NOT NULL,
    hold_until TEXT NOT NULL,
    gate_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'CLAIMED', 'ON_THE_WAY', 'COMPLETED', 'EXPIRED')),
    claimed_by_shelter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TEXT,
    claim_expires_at TEXT,
    on_way_at TEXT,
    arrived_at TEXT,
    eta_minutes INTEGER,
    priority_release_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS no_show_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL REFERENCES food_batches(id) ON DELETE CASCADE,
    shelter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    penalty_applied REAL NOT NULL DEFAULT 0.5,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_food_batches_status ON food_batches(status);
  CREATE INDEX IF NOT EXISTS idx_food_batches_restaurant ON food_batches(restaurant_id);
`);

/**
 * Wraps a synchronous callback in an immediate SQLite transaction (`BEGIN IMMEDIATE`)
 * so concurrent write attempts serialize at the database level without double-bookings.
 */
db.transaction = (fn) => (...args) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(...args);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch (_) {
      // Ignore rollback error if transaction already aborted
    }
    throw err;
  }
};

db.dbPath = dbPath;

module.exports = db;
