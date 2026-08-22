const filterService = require('../services/filterService');
const { sendGuildLog } = require('../services/logService');

async function notifyAuthor(message, matchedWord) {
  try {
    await message.author.send(
      [
        `你在「${message.guild.name}」的 <#${message.channelId}> 訊息包含被過濾的文字，因此已被移除。`,
        `命中詞：\`${matchedWord.word}\``,
      ].join('\n'),
    );
    return true;
  } catch (error) {
    console.error(`Failed to DM filtered user ${message.author.id}:`, error);
    return false;
  }
}

async function sendTemporaryFallback(message) {
  const warning = await message.channel
    .send(`${message.author} 你的訊息包含被過濾的文字，且機器人無法私訊你。`)
    .catch(() => null);

  if (warning) {
    setTimeout(() => {
      warning.delete().catch(() => {});
    }, 8000);
  }
}

async function handleMessageCreate(message) {
  if (!message.guild || message.author.bot) {
    return;
  }

  if (!(await filterService.isFilteredChannel(message.guildId, message.channelId))) {
    return;
  }

  const matchedWord = await filterService.findMatchedWord(message.guildId, message.content || '');
  if (!matchedWord) {
    return;
  }

  await message.delete().catch((error) => {
    console.error(`Failed to delete filtered message ${message.id}:`, error);
  });

  const dmSent = await notifyAuthor(message, matchedWord);
  if (!dmSent) {
    const logged = await sendGuildLog(
      message.client,
      message.guildId,
      `無法私訊被過濾的使用者 ${message.author}，頻道 <#${message.channelId}>，命中詞 \`${matchedWord.word}\`。`,
    );

    if (!logged) {
      await sendTemporaryFallback(message);
    }
  }

  await sendGuildLog(
    message.client,
    message.guildId,
    `已刪除 ${message.author} 在 <#${message.channelId}> 的過濾訊息，命中詞 \`${matchedWord.word}\`。`,
  );
}

module.exports = {
  name: 'messageCreate',
  execute: handleMessageCreate,
};
