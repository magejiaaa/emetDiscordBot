const { Pool } = require('pg');
const { databaseUrl } = require('../config');

if (!databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function query(text, params = []) {
  return pool.query(text, params);
}

async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      submission_channel_id TEXT,
      log_channel_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS filter_channels (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS filter_words (
      guild_id TEXT NOT NULL,
      word TEXT NOT NULL,
      normalized_word TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, normalized_word)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      target_guild_id TEXT NOT NULL,
      target_channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      blacklist_name TEXT NOT NULL,
      reported_server TEXT NOT NULL,
      report_content TEXT NOT NULL,
      attachment_urls TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `);
}

async function initializeDatabase() {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await createTables();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.error(`Database initialization failed, retrying (${attempt}/${maxAttempts}):`, error);
      await sleep(2000 * attempt);
    }
  }
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  closeDatabase,
  initializeDatabase,
  query,
};
