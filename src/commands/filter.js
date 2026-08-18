const {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const filterService = require('../services/filterService');
const { ephemeral, safeReply } = require('../utils/replies');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('過濾')
    .setDescription('管理指定頻道文字過濾')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('頻道新增')
        .setDescription('新增要過濾的頻道')
        .addChannelOption((option) =>
          option
            .setName('頻道')
            .setDescription('要啟用文字過濾的頻道')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('頻道移除')
        .setDescription('移除要過濾的頻道')
        .addChannelOption((option) =>
          option
            .setName('頻道')
            .setDescription('要停用文字過濾的頻道')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('詞新增')
        .setDescription('新增過濾詞')
        .addStringOption((option) =>
          option.setName('詞').setDescription('要阻擋的文字').setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('詞移除')
        .setDescription('移除過濾詞')
        .addStringOption((option) =>
          option.setName('詞').setDescription('要移除的文字').setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('列表').setDescription('列出目前過濾設定')),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '頻道新增') {
      const channel = interaction.options.getChannel('頻道', true);
      const added = filterService.addChannel(guildId, channel.id);
      return safeReply(interaction, ephemeral(`${added ? '已新增' : '已存在'}過濾頻道：${channel}`));
    }

    if (subcommand === '頻道移除') {
      const channel = interaction.options.getChannel('頻道', true);
      const removed = filterService.removeChannel(guildId, channel.id);
      return safeReply(interaction, ephemeral(`${removed ? '已移除' : '原本未設定'}過濾頻道：${channel}`));
    }

    if (subcommand === '詞新增') {
      const word = interaction.options.getString('詞', true);
      const added = filterService.addWord(guildId, word);
      return safeReply(interaction, ephemeral(`${added ? '已新增' : '已存在'}過濾詞：\`${word.trim()}\``));
    }

    if (subcommand === '詞移除') {
      const word = interaction.options.getString('詞', true);
      const removed = filterService.removeWord(guildId, word);
      return safeReply(interaction, ephemeral(`${removed ? '已移除' : '找不到'}過濾詞：\`${word.trim()}\``));
    }

    const channels = filterService.listChannels(guildId);
    const words = filterService.listWords(guildId).map((row) => row.word);
    const content = [
      `過濾頻道：${channels.length ? channels.map((id) => `<#${id}>`).join('、') : '尚未設定'}`,
      `過濾詞：${words.length ? words.map((word) => `\`${word}\``).join('、') : '尚未設定'}`,
    ].join('\n');

    return safeReply(interaction, ephemeral(content));
  },
};
