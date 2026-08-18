const {
  ActionRowBuilder,
  ChannelType,
  InteractionContextType,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { ephemeral, safeReply } = require('../utils/replies');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('公告')
    .setDescription('由機器人發送 Markdown 公告')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addChannelOption((option) =>
      option
        .setName('頻道')
        .setDescription('公告要發布到哪個頻道')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('頻道', true);
    const modal = new ModalBuilder()
      .setCustomId(`announce:${interaction.guildId}:${channel.id}`)
      .setTitle('發送公告');

    const contentInput = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('公告內容，支援 Discord Markdown')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(1)
      .setMaxLength(2000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(contentInput));
    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    const [, guildId, channelId] = interaction.customId.split(':');

    if (interaction.guildId !== guildId) {
      return safeReply(interaction, ephemeral('公告表單來源不正確，請重新執行 `/公告`。'));
    }

    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      return safeReply(interaction, ephemeral('找不到公告頻道，請重新選擇頻道。'));
    }

    const content = interaction.fields.getTextInputValue('content');
    await channel.send({ content });
    return safeReply(interaction, ephemeral(`公告已發送到 ${channel}。`));
  },
};
