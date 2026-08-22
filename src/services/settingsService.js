const { query } = require('../db/database');

async function getSettings(guildId) {
  const result = await query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
  return result.rows[0] || null;
}

async function setSubmissionChannel(guildId, channelId) {
  await query(
    `
      INSERT INTO guild_settings (guild_id, submission_channel_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT(guild_id) DO UPDATE SET
        submission_channel_id = EXCLUDED.submission_channel_id,
        updated_at = NOW()
    `,
    [guildId, channelId],
  );
}

async function setLogChannel(guildId, channelId) {
  await query(
    `
      INSERT INTO guild_settings (guild_id, log_channel_id, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT(guild_id) DO UPDATE SET
        log_channel_id = EXCLUDED.log_channel_id,
        updated_at = NOW()
    `,
    [guildId, channelId],
  );
}

async function listGuildsWithSubmissionChannels() {
  const result = await query(`
    SELECT guild_id, submission_channel_id
    FROM guild_settings
    WHERE submission_channel_id IS NOT NULL
  `);
  return result.rows;
}

module.exports = {
  getSettings,
  setSubmissionChannel,
  setLogChannel,
  listGuildsWithSubmissionChannels,
};
