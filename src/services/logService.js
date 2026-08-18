const { getSettings } = require('./settingsService');

async function sendGuildLog(client, guildId, content) {
  const settings = getSettings(guildId);
  if (!settings?.log_channel_id) {
    return false;
  }

  try {
    const channel = await client.channels.fetch(settings.log_channel_id);
    if (!channel?.isTextBased()) {
      return false;
    }

    await channel.send({ content });
    return true;
  } catch (error) {
    console.error(`Failed to send guild log for ${guildId}:`, error);
    return false;
  }
}

module.exports = {
  sendGuildLog,
};
