const {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { ephemeral, safeReply } = require('../utils/replies');

const MESSAGE_LINK_PATTERN =
  /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)$/;

function parseMessageLink(link) {
  const match = link.trim().match(MESSAGE_LINK_PATTERN);
  return match?.groups || null;
}

function editEphemeralReply(interaction, content) {
  return interaction.editReply({ content });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('轉發')
    .setDescription('透過機器人轉發伺服器內的訊息')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('訊息連結')
        .setDescription('要轉發的伺服器訊息連結')
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName('目標頻道')
        .setDescription('要轉發到哪個頻道')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    ),

  async execute(interaction) {
    const link = interaction.options.getString('訊息連結', true);
    const targetChannel = interaction.options.getChannel('目標頻道', true);
    const parsedLink = parseMessageLink(link);

    if (!parsedLink) {
      return safeReply(interaction, ephemeral('訊息連結格式不正確，請複製 Discord 訊息連結後再試一次。'));
    }

    if (parsedLink.guildId !== interaction.guildId) {
      return safeReply(interaction, ephemeral('只能轉發目前伺服器內的訊息。'));
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sourceChannel = await interaction.guild.channels.fetch(parsedLink.channelId);
    if (!sourceChannel?.isTextBased()) {
      return editEphemeralReply(interaction, '找不到來源訊息頻道，或機器人沒有讀取該頻道的權限。');
    }

    if (!targetChannel?.isTextBased()) {
      return editEphemeralReply(interaction, '目標頻道不可傳送文字訊息。');
    }

    let message;
    try {
      message = await sourceChannel.messages.fetch(parsedLink.messageId);
    } catch (error) {
      return editEphemeralReply(
        interaction,
        '找不到來源訊息，請確認連結正確且機器人有讀取歷史訊息權限。',
      );
    }

    try {
      await message.forward(targetChannel);
    } catch (error) {
      console.error('Failed to forward message:', error);
      return editEphemeralReply(
        interaction,
        '轉發失敗。可能是機器人沒有讀取來源內容或傳送到目標頻道的權限，或這則訊息類型不支援官方轉發。',
      );
    }

    return editEphemeralReply(interaction, `已轉發訊息到 ${targetChannel}。`);
  },
};
