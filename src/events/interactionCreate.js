const announce = require('../commands/announce');
const submit = require('../commands/submit');
const { ephemeral, safeReply } = require('../utils/replies');

async function handleInteractionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      console.log(
        `Interaction received: /${interaction.commandName} from ${interaction.user.tag} in ${interaction.guildId || 'DM'}`,
      );

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return safeReply(interaction, ephemeral('找不到這個指令處理器。'));
      }

      return await command.execute(interaction);
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('announce:')) {
        return await announce.handleModal(interaction);
      }

      if (interaction.customId.startsWith('submit:')) {
        return await submit.handleModal(interaction);
      }
    }
  } catch (error) {
    console.error('Unhandled interaction error:', error);
    if (interaction.isRepliable()) {
      await safeReply(interaction, ephemeral('指令執行時發生錯誤，請稍後再試。'));
    }
  }

  return null;
}

module.exports = {
  name: 'interactionCreate',
  execute: handleInteractionCreate,
};
