/**
 * DekhLaw — Database Configuration
 *
 * Default: SQLite (zero-setup, works instantly for development & small deployments)
 * Production: Set DB_TYPE=postgres in .env and fill PG_* vars → auto-switches.
 *
 * All tables are created automatically on first run.
 */

const path = require('path');

let db;

// ─── SQLite ───────────────────────────────────────────────────────────────────

function sqliteSetup() {
  const Database = require('better-sqlite3');
  const file     = process.env.SQLITE_PATH || path.join(__dirname, '../dekhlaw.db');
  db             = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log(`📂 SQLite DB at: ${file}`);
  return db;
}

// ─── PostgreSQL ───────────────────────────────────────────────────────────────

async function pgSetup() {
  const { Pool } = require('pg');
  const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.PG_HOST     || 'localhost',
        port:     process.env.PG_PORT     || 5432,
        database: process.env.PG_DB       || 'dekhlaw',
        user:     process.env.PG_USER     || 'postgres',
        password: process.env.PG_PASSWORD || '',
      };

  // Improved SSL for services like Neon/Supabase/Heroku
  if (process.env.PG_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);
  await pool.query('SELECT 1'); // test connection
  console.log('🐘 Connected to PostgreSQL');
  return pool;
}

// ─── Schema Creation (SQLite and PostgreSQL compatible syntax) ───────────────

const SCHEMA_SQL = `
-- ── Users (citizens who seek legal help) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT    NOT NULL,
  phone         TEXT    NOT NULL UNIQUE,
  email         TEXT             UNIQUE,
  city          TEXT,
  profile_photo TEXT,
  whatsapp      INTEGER DEFAULT 1,
  token_hash    TEXT,
  is_verified   INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Lawyers ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyers (
  id                   SERIAL PRIMARY KEY,
  full_name            TEXT    NOT NULL,
  phone                TEXT    NOT NULL UNIQUE,
  email                TEXT             UNIQUE,
  city                 TEXT,
  state                TEXT,
  practice_area        TEXT,
  years_experience     TEXT,
  bar_council_number   TEXT    NOT NULL UNIQUE,
  court_of_practice    TEXT,
  password_hash        TEXT,
  profile_photo        TEXT,
  bio                  TEXT,
  languages            TEXT,
  whatsapp             INTEGER DEFAULT 1,
  is_verified          INTEGER DEFAULT 0,
  is_active            INTEGER DEFAULT 1,
  verification_doc     TEXT,
  rating               REAL    DEFAULT 0,
  total_ratings        INTEGER DEFAULT 0,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── SOS Requests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_requests (
  id             SERIAL PRIMARY KEY,
  name           TEXT    NOT NULL,
  phone          TEXT    NOT NULL,
  city           TEXT    NOT NULL,
  legal_issue    TEXT    NOT NULL,
  description    TEXT,
  status         TEXT    DEFAULT 'pending',
  assigned_lawyer_id INTEGER REFERENCES lawyers(id),
  user_id        INTEGER REFERENCES users(id),
  fee_collected  INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Contact Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  message    TEXT NOT NULL,
  is_read    INTEGER DEFAULT 0,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Lawyer Verifications (admin queue) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lawyer_verifications (
  id          SERIAL PRIMARY KEY,
  lawyer_id   INTEGER NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Search Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
  id           SERIAL PRIMARY KEY,
  city         TEXT,
  practice_area TEXT,
  results_count INTEGER,
  ip           TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Admin Users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// SQLite specific tweaks (replacing SERIAL with INTEGER PRIMARY KEY AUTOINCREMENT)
const SQLITE_SCHEMA = SCHEMA_SQL
  .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, "TEXT DEFAULT (datetime('now'))")
  .replace(/TIMESTAMP/g, 'TEXT');

// ─── Export ───────────────────────────────────────────────────────────────────

const dbConfig = {
  _client: null,
  _type: null,

  async connect() {
    let type = (process.env.DB_TYPE || 'sqlite').toLowerCase();
    if (type === 'postgresql' || type === 'pg') type = 'postgres';
    this._type = type;

    if (type === 'postgres') {
      this._client = await pgSetup();
      // Auto-run schema for Postgres
      try {
        await this._client.query(SCHEMA_SQL);
        
        // --- Self-healing Migration: Add password_hash if missing ---
        try {
          await this._client.query(`
            DO $$ 
            BEGIN 
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lawyers' AND column_name='password_hash') THEN
                ALTER TABLE lawyers ADD COLUMN password_hash TEXT;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lawyers' AND column_name='verification_doc') THEN
                ALTER TABLE lawyers ADD COLUMN verification_doc TEXT;
              END IF;
            END $$;
          `);
        } catch (migErr) {
          console.error('⚠️ Schema migration warning:', migErr.message);
        }

        console.log('✅ Postgres schema ready.');
      } catch (err) {
        console.error('⚠️ Postgres schema init error (non-fatal):', err.message);
      }
    } else {
      this._client = sqliteSetup();
      this._client.exec(SQLITE_SCHEMA);
      console.log('✅ SQLite schema ready.');
    }

    return this._client;
  },

  get client() {
    if (!this._client) throw new Error('Database not connected. Call db.connect() first.');
    return this._client;
  },

  get type() {
    return this._type;
  },

  // Helper to convert '?' placeholders to '$1, $2...' for PostgreSQL
  _convertSql(sql) {
    if (this._type === 'sqlite') return sql;
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  },

  // Unified run: insert / update / delete
  async run(sql, params = []) {
    const convertedSql = this._convertSql(sql);
    try {
      if (this._type === 'sqlite') {
        return this._client.prepare(sql).run(...params);
      }
      const result = await this._client.query(convertedSql, params);
      // For PostgreSQL, the inserted ID is usually in rows[0].id if RETURNING id was used
      const lastInsertRowid = result.rows && result.rows[0] ? (result.rows[0].id || result.rows[0].lastinsertrowid || null) : null;
      return { lastInsertRowid, changes: result.rowCount };
    } catch (err) {
      console.error(`❌ DB Query Error [${this._type}]:`, err.message);
      console.error(`   SQL: ${convertedSql}`);
      console.error(`   Params:`, params);
      throw err;
    }
  },

  // Unified get: single row
  async get(sql, params = []) {
    const convertedSql = this._convertSql(sql);
    if (this._type === 'sqlite') {
      return this._client.prepare(sql).get(...params);
    }
    const res = await this._client.query(convertedSql, params);
    return res.rows[0];
  },

  // Unified all: multiple rows
  async all(sql, params = []) {
    const convertedSql = this._convertSql(sql);
    if (this._type === 'sqlite') {
      return this._client.prepare(sql).all(...params);
    }
    const res = await this._client.query(convertedSql, params);
    return res.rows;
  },
};

module.exports = dbConfig;
