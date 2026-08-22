const {
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const filterService = require('../services/filterService');
const { getSettings, setLogChannel, setSubmissionChannel } = require('../services/settingsService');
const { ephemeral, safeReply } = require('../utils/replies');

const MAX_LIST_ITEMS = 20;

function formatChannelList(channelIds) {
  if (!channelIds.length) {
    return '尚未設定';
  }

  const visibleChannels = channelIds.slice(0, MAX_LIST_ITEMS).map((channelId) => `<#${channelId}>`);
  const remainingCount = channelIds.length - visibleChannels.length;

  if (remainingCount > 0) {
    visibleChannels.push(`另外 ${remainingCount} 個`);
  }

  return visibleChannels.join('、');
}

function formatWordList(words) {
  if (!words.length) {
    return '尚未設定';
  }

  const visibleWords = words.slice(0, MAX_LIST_ITEMS).map((word) => `\`${word.replaceAll('`', "'")}\``);
  const remainingCount = words.length - visibleWords.length;

  if (remainingCount > 0) {
    visibleWords.push(`另外 ${remainingCount} 個`);
  }

  return visibleWords.join('、');
}

function formatTimestamp(value) {
  if (!value) {
    return '尚未更新';
  }

  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  return Number.isNaN(timestamp) ? '尚未更新' : `<t:${timestamp}:F>`;
}

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
    )
    .addSubcommand((subcommand) => subcommand.setName('查看').setDescription('查看目前所有設定')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '查看') {
      const guildId = interaction.guildId;
      const settings = await getSettings(guildId);
      const filterChannels = await filterService.listChannels(guildId);
      const filterWords = (await filterService.listWords(guildId)).map((row) => row.word);

      const content = [
        '**目前設定**',
        `匿名投稿頻道：${settings?.submission_channel_id ? `<#${settings.submission_channel_id}>` : '尚未設定'}`,
        `日誌頻道：${settings?.log_channel_id ? `<#${settings.log_channel_id}>` : '尚未設定'}`,
        `過濾頻道：${formatChannelList(filterChannels)}`,
        `過濾詞：${formatWordList(filterWords)}`,
        `設定更新時間：${formatTimestamp(settings?.updated_at)}`,
      ].join('\n');

      return safeReply(interaction, ephemeral(content));
    }

    const channel = interaction.options.getChannel('頻道', true);

    if (subcommand === '投稿頻道') {
      await setSubmissionChannel(interaction.guildId, channel.id);
      return safeReply(interaction, ephemeral(`已設定匿名投稿頻道為 ${channel}。`));
    }

    if (subcommand === '日誌頻道') {
      await setLogChannel(interaction.guildId, channel.id);
      return safeReply(interaction, ephemeral(`已設定日誌頻道為 ${channel}。`));
    }

    return safeReply(interaction, ephemeral('未知的設定項目。'));
  },
};
