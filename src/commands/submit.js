const crypto = require('node:crypto');
const {
  ActionRowBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { submissionGuildId } = require('../config');
const { createSubmission } = require('../services/submissionService');
const { ephemeral, safeReply } = require('../utils/replies');

function getImageAttachments(interaction) {
  return ['圖片1', '圖片2', '圖片3']
    .map((name) => interaction.options.getAttachment(name))
    .filter(Boolean);
}

function validateImageAttachments(attachments) {
  const invalid = attachments.find((attachment) => !attachment.contentType?.startsWith('image/'));
  if (invalid) {
    throw new Error(`附件 \`${invalid.name}\` 不是圖片，請只上傳圖片檔。`);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('投稿')
    .setDescription('私訊機器人送出匿名檢舉投稿')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addAttachmentOption((option) => option.setName('圖片1').setDescription('選填圖片 1').setRequired(false))
    .addAttachmentOption((option) => option.setName('圖片2').setDescription('選填圖片 2').setRequired(false))
    .addAttachmentOption((option) => option.setName('圖片3').setDescription('選填圖片 3').setRequired(false)),

  async execute(interaction) {
    const attachments = getImageAttachments(interaction);

    try {
      validateImageAttachments(attachments);
    } catch (error) {
      return safeReply(interaction, ephemeral(error.message));
    }

    const nonce = crypto.randomBytes(8).toString('hex');
    interaction.client.pendingSubmissions.set(nonce, {
      authorId: interaction.user.id,
      targetGuildId: interaction.guildId || submissionGuildId,
      attachmentUrls: attachments.map((attachment) => attachment.url),
      createdAt: Date.now(),
    });

    const modal = new ModalBuilder().setCustomId(`submit:${nonce}`).setTitle('匿名檢舉投稿');
    const blacklistNameInput = new TextInputBuilder()
      .setCustomId('blacklistName')
      .setLabel('黑名單名稱')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(100)
      .setRequired(true);
    const serverInput = new TextInputBuilder()
      .setCustomId('reportedServer')
      .setLabel('伺服器')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(100)
      .setRequired(true);
    const contentInput = new TextInputBuilder()
      .setCustomId('reportContent')
      .setLabel('檢舉內容')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(blacklistNameInput),
      new ActionRowBuilder().addComponents(serverInput),
      new ActionRowBuilder().addComponents(contentInput),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const [, nonce] = interaction.customId.split(':');
    const pending = interaction.client.pendingSubmissions.get(nonce);
    interaction.client.pendingSubmissions.delete(nonce);

    if (!pending || pending.authorId !== interaction.user.id) {
      return safeReply(interaction, ephemeral('投稿表單已過期，請重新執行 `/投稿`。'));
    }

    try {
      const result = await createSubmission(interaction.client, {
        authorId: interaction.user.id,
        targetGuildId: pending.targetGuildId,
        attachmentUrls: pending.attachmentUrls,
        blacklistName: interaction.fields.getTextInputValue('blacklistName').trim(),
        reportedServer: interaction.fields.getTextInputValue('reportedServer').trim(),
        reportContent: interaction.fields.getTextInputValue('reportContent').trim(),
      });

      return safeReply(interaction, {
        content: [
          `投稿成功，投稿 ID：\`${result.id}\``,
          '你可以用 `/投稿刪除 投稿ID` 刪除自己的投稿。',
        ].join('\n'),
      });
    } catch (error) {
      console.error('Failed to create submission:', error);
      return safeReply(interaction, ephemeral(error.message || '投稿失敗，請稍後再試。'));
    }
  },
};
