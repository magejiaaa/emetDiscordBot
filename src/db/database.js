const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { databasePath } = require('../config');

const resolvedPath = path.resolve(databasePath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      submission_channel_id TEXT,
      log_channel_id TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS filter_channels (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (guild_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS filter_words (
      guild_id TEXT NOT NULL,
      word TEXT NOT NULL,
      normalized_word TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
  `);
}

initializeDatabase();

module.exports = {
  db,
  initializeDatabase,
};
