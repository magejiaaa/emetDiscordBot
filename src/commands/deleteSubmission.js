const { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } = require('discord.js');
const { deleteSubmission } = require('../services/submissionService');
const { ephemeral, safeReply } = require('../utils/replies');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('投稿刪除')
    .setDescription('刪除自己的匿名投稿')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addStringOption((option) =>
      option
        .setName('投稿id')
        .setDescription('投稿成功時機器人給你的投稿 ID')
        .setRequired(true)
        .setMinLength(8)
        .setMaxLength(8),
    ),

  async execute(interaction) {
    const submissionId = interaction.options.getString('投稿id', true).trim().toUpperCase();

    try {
      const result = await deleteSubmission(interaction.client, submissionId, interaction.user.id);
      if (!result.ok) {
        return safeReply(interaction, ephemeral(result.reason));
      }

      return safeReply(interaction, `已刪除投稿 \`${result.id}\`。`);
    } catch (error) {
      console.error('Failed to delete submission:', error);
      return safeReply(interaction, ephemeral('刪除投稿失敗，請稍後再試或聯絡管理員。'));
    }
  },
};
