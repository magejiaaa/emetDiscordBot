const { MessageFlags } = require('discord.js');

async function safeReply(interaction, options) {
  const payload = typeof options === 'string' ? { content: options } : options;

  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.followUp(payload);
    }

    return await interaction.reply(payload);
  } catch (error) {
    console.error('Failed to reply to interaction:', error);
    return null;
  }
}

function ephemeral(content) {
  return {
    content,
    flags: MessageFlags.Ephemeral,
  };
}

module.exports = {
  safeReply,
  ephemeral,
};
