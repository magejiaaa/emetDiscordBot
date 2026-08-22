const { query } = require('../db/database');

function normalizeWord(word) {
  return word.trim().toLocaleLowerCase();
}

async function addChannel(guildId, channelId) {
  const result = await query(
    `
      INSERT INTO filter_channels (guild_id, channel_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [guildId, channelId],
  );
  return result.rowCount > 0;
}

async function removeChannel(guildId, channelId) {
  const result = await query(
    `
      DELETE FROM filter_channels
      WHERE guild_id = $1 AND channel_id = $2
    `,
    [guildId, channelId],
  );
  return result.rowCount > 0;
}

async function isFilteredChannel(guildId, channelId) {
  const result = await query(
    `
      SELECT 1 FROM filter_channels
      WHERE guild_id = $1 AND channel_id = $2
    `,
    [guildId, channelId],
  );
  return result.rowCount > 0;
}

async function listChannels(guildId) {
  const result = await query(
    `
      SELECT channel_id FROM filter_channels
      WHERE guild_id = $1
      ORDER BY created_at ASC
    `,
    [guildId],
  );
  return result.rows.map((row) => row.channel_id);
}

async function addWord(guildId, word) {
  const cleanWord = word.trim();
  if (!cleanWord) {
    return false;
  }

  const result = await query(
    `
      INSERT INTO filter_words (guild_id, word, normalized_word)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `,
    [guildId, cleanWord, normalizeWord(cleanWord)],
  );
  return result.rowCount > 0;
}

async function removeWord(guildId, word) {
  const result = await query(
    `
      DELETE FROM filter_words
      WHERE guild_id = $1 AND normalized_word = $2
    `,
    [guildId, normalizeWord(word)],
  );
  return result.rowCount > 0;
}

async function listWords(guildId) {
  const result = await query(
    `
      SELECT word, normalized_word FROM filter_words
      WHERE guild_id = $1
      ORDER BY created_at ASC
    `,
    [guildId],
  );
  return result.rows;
}

async function findMatchedWord(guildId, content) {
  const normalizedContent = content.toLocaleLowerCase();
  const words = await listWords(guildId);
  return words.find((row) => normalizedContent.includes(row.normalized_word)) || null;
}

module.exports = {
  addChannel,
  removeChannel,
  isFilteredChannel,
  listChannels,
  addWord,
  removeWord,
  listWords,
  findMatchedWord,
};
