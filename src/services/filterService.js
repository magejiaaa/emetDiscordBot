const { db } = require('../db/database');

const addChannelStmt = db.prepare(`
  INSERT OR IGNORE INTO filter_channels (guild_id, channel_id)
  VALUES (?, ?)
`);
const removeChannelStmt = db.prepare(`
  DELETE FROM filter_channels
  WHERE guild_id = ? AND channel_id = ?
`);
const isFilteredChannelStmt = db.prepare(`
  SELECT 1 FROM filter_channels
  WHERE guild_id = ? AND channel_id = ?
`);
const listChannelsStmt = db.prepare(`
  SELECT channel_id FROM filter_channels
  WHERE guild_id = ?
  ORDER BY created_at ASC
`);

const addWordStmt = db.prepare(`
  INSERT OR IGNORE INTO filter_words (guild_id, word, normalized_word)
  VALUES (?, ?, ?)
`);
const removeWordStmt = db.prepare(`
  DELETE FROM filter_words
  WHERE guild_id = ? AND normalized_word = ?
`);
const listWordsStmt = db.prepare(`
  SELECT word, normalized_word FROM filter_words
  WHERE guild_id = ?
  ORDER BY created_at ASC
`);

function normalizeWord(word) {
  return word.trim().toLocaleLowerCase();
}

function addChannel(guildId, channelId) {
  return addChannelStmt.run(guildId, channelId).changes > 0;
}

function removeChannel(guildId, channelId) {
  return removeChannelStmt.run(guildId, channelId).changes > 0;
}

function isFilteredChannel(guildId, channelId) {
  return Boolean(isFilteredChannelStmt.get(guildId, channelId));
}

function listChannels(guildId) {
  return listChannelsStmt.all(guildId).map((row) => row.channel_id);
}

function addWord(guildId, word) {
  const cleanWord = word.trim();
  if (!cleanWord) {
    return false;
  }

  return addWordStmt.run(guildId, cleanWord, normalizeWord(cleanWord)).changes > 0;
}

function removeWord(guildId, word) {
  return removeWordStmt.run(guildId, normalizeWord(word)).changes > 0;
}

function listWords(guildId) {
  return listWordsStmt.all(guildId);
}

function findMatchedWord(guildId, content) {
  const normalizedContent = content.toLocaleLowerCase();
  return listWords(guildId).find((row) => normalizedContent.includes(row.normalized_word)) || null;
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
