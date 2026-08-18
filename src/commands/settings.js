const {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { setLogChannel, setSubmissionChannel } = require('../services/settingsService');
const { ephemeral, safeReply } = require('../utils/replies');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('設定')
    .setDescription('管理機器人的伺服器設定')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('投稿頻道')
        .setDescription('設定匿名投稿輸出頻道')
        .addChannelOption((option) =>
          option
            .setName('頻道')
            .setDescription('投稿要發布到哪個頻道')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('日誌頻道')
        .setDescription('設定管理日誌頻道')
        .addChannelOption((option) =>
          option
            .setName('頻道')
            .setDescription('過濾、投稿刪除與錯誤提示要記錄到哪個頻道')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('頻道', true);

    if (subcommand === '投稿頻道') {
      setSubmissionChannel(interaction.guildId, channel.id);
      return safeReply(interaction, ephemeral(`已設定匿名投稿頻道為 ${channel}。`));
    }

    if (subcommand === '日誌頻道') {
      setLogChannel(interaction.guildId, channel.id);
      return safeReply(interaction, ephemeral(`已設定日誌頻道為 ${channel}。`));
    }

    return safeReply(interaction, ephemeral('未知的設定項目。'));
  },
};
