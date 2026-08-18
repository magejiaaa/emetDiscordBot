const { db } = require('../db/database');

const getSettingsStmt = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
const upsertSubmissionChannelStmt = db.prepare(`
  INSERT INTO guild_settings (guild_id, submission_channel_id, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(guild_id) DO UPDATE SET
    submission_channel_id = excluded.submission_channel_id,
    updated_at = CURRENT_TIMESTAMP
`);
const upsertLogChannelStmt = db.prepare(`
  INSERT INTO guild_settings (guild_id, log_channel_id, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(guild_id) DO UPDATE SET
    log_channel_id = excluded.log_channel_id,
    updated_at = CURRENT_TIMESTAMP
`);
const configuredGuildsStmt = db.prepare(`
  SELECT guild_id, submission_channel_id
  FROM guild_settings
  WHERE submission_channel_id IS NOT NULL
`);

function getSettings(guildId) {
  return getSettingsStmt.get(guildId) || null;
}

function setSubmissionChannel(guildId, channelId) {
  upsertSubmissionChannelStmt.run(guildId, channelId);
}

function setLogChannel(guildId, channelId) {
  upsertLogChannelStmt.run(guildId, channelId);
}

function listGuildsWithSubmissionChannels() {
  return configuredGuildsStmt.all();
}

module.exports = {
  getSettings,
  setSubmissionChannel,
  setLogChannel,
  listGuildsWithSubmissionChannels,
};
