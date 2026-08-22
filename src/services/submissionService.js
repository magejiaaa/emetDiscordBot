const crypto = require('node:crypto');
const { EmbedBuilder } = require('discord.js');
const { query } = require('../db/database');
const { getSettings, listGuildsWithSubmissionChannels } = require('./settingsService');
const { sendGuildLog } = require('./logService');

function createSubmissionId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function resolveTargetGuildId(requestedGuildId) {
  const cleanRequestedGuildId = requestedGuildId?.trim();

  if (cleanRequestedGuildId) {
    const settings = await getSettings(cleanRequestedGuildId);
    if (!settings?.submission_channel_id) {
      throw new Error('找不到這個伺服器的投稿頻道設定，請確認伺服器 ID 或請管理員先設定 `/設定 投稿頻道`。');
    }
    return cleanRequestedGuildId;
  }

  const configuredGuilds = await listGuildsWithSubmissionChannels();
  if (configuredGuilds.length === 0) {
    throw new Error('目前沒有任何伺服器設定匿名投稿頻道，請先請管理員使用 `/設定 投稿頻道`。');
  }

  if (configuredGuilds.length > 1) {
    const guildList = configuredGuilds.map((row) => `- ${row.guild_id}`).join('\n');
    throw new Error(`目前有多個伺服器可投稿，請在 /投稿 填入目標伺服器 ID：\n${guildList}`);
  }

  return configuredGuilds[0].guild_id;
}

function buildSubmissionMessage({ id, blacklistName, reportedServer, reportContent, attachmentUrls }) {
  const embed = new EmbedBuilder()
    .setTitle('匿名檢舉投稿')
    .setColor(0xef4444)
    .addFields(
      { name: '投稿 ID', value: id, inline: true },
      { name: '黑名單名稱', value: blacklistName.slice(0, 1024), inline: true },
      { name: '伺服器', value: reportedServer.slice(0, 1024), inline: true },
      { name: '檢舉內容', value: reportContent.slice(0, 1024) },
    )
    .setTimestamp();

  if (attachmentUrls.length > 0) {
    embed.setImage(attachmentUrls[0]);
  }

  const extraImages = attachmentUrls.slice(1).map((url, index) => `圖片 ${index + 2}: ${url}`).join('\n');

  return {
    content: extraImages || null,
    embeds: [embed],
  };
}

async function createSubmission(client, payload) {
  const targetGuildId = await resolveTargetGuildId(payload.targetGuildId);
  const settings = await getSettings(targetGuildId);
  const targetChannel = await client.channels.fetch(settings.submission_channel_id);

  if (!targetChannel?.isTextBased()) {
    throw new Error('投稿頻道不是文字頻道，請管理員重新設定。');
  }

  const id = createSubmissionId();
  const messagePayload = buildSubmissionMessage({
    id,
    blacklistName: payload.blacklistName,
    reportedServer: payload.reportedServer,
    reportContent: payload.reportContent,
    attachmentUrls: payload.attachmentUrls,
  });
  const message = await targetChannel.send(messagePayload);

  await query(
    `
      INSERT INTO submissions (
        id,
        author_id,
        target_guild_id,
        target_channel_id,
        message_id,
        blacklist_name,
        reported_server,
        report_content,
        attachment_urls
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      id,
      payload.authorId,
      targetGuildId,
      targetChannel.id,
      message.id,
      payload.blacklistName,
      payload.reportedServer,
      payload.reportContent,
      JSON.stringify(payload.attachmentUrls),
    ],
  );

  await sendGuildLog(client, targetGuildId, `匿名投稿已發布：投稿 ID \`${id}\`，訊息 ID \`${message.id}\``);

  return {
    id,
    targetGuildId,
    channelId: targetChannel.id,
    messageId: message.id,
  };
}

async function deleteSubmission(client, submissionId, requesterId) {
  const submissionResult = await query('SELECT * FROM submissions WHERE id = $1', [submissionId.toUpperCase()]);
  const submission = submissionResult.rows[0];

  if (!submission || submission.deleted_at) {
    return { ok: false, reason: '找不到這筆投稿，或它已經被刪除了。' };
  }

  if (submission.author_id !== requesterId) {
    return { ok: false, reason: '你只能刪除自己的投稿。' };
  }

  const channel = await client.channels.fetch(submission.target_channel_id);
  if (!channel?.isTextBased()) {
    return { ok: false, reason: '找不到原投稿頻道，請聯絡管理員。' };
  }

  const message = await channel.messages.fetch(submission.message_id).catch(() => null);
  if (message) {
    await message.edit({
      content: '投稿者已刪除',
      embeds: [],
      components: [],
    });
  }

  await query(
    `
      UPDATE submissions
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [submission.id],
  );
  await sendGuildLog(client, submission.target_guild_id, `匿名投稿已由投稿者刪除：投稿 ID \`${submission.id}\``);

  return { ok: true, id: submission.id };
}

module.exports = {
  createSubmission,
  deleteSubmission,
};
