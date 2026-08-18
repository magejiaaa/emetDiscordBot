# Discord Server Manager Bot

Node.js + discord.js + SQLite bot with:

- DM anonymous submissions through slash commands and modals
- User-owned submission deletion
- Per-channel text filtering
- Bot announcements with Markdown
- Discord slash-command based server configuration

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN`, `CLIENT_ID`, and `SUBMISSION_GUILD_ID`.

3. In the Discord Developer Portal, enable:

   - `Message Content Intent`
   - `Server Members Intent` is not required for this bot

4. Invite the bot with these permissions:

   - Send Messages
   - Manage Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Slash Commands

5. Deploy commands:

   ```bash
   npm run deploy-commands
   ```

6. Start the bot:

   ```bash
   npm start
   ```

## Commands

- `/設定 投稿頻道` sets the anonymous submission output channel.
- `/設定 日誌頻道` sets moderation/error log channel.
- `/過濾 頻道新增|頻道移除|詞新增|詞移除|列表` manages filtered channels and words.
- `/公告 頻道` opens a modal and posts Markdown as the bot.
- `/投稿` works in bot DM and in servers. It opens a modal for required report fields and accepts up to 3 optional images.
- `/投稿刪除 投稿ID` works in bot DM and in servers, and deletes only the caller's own submission.

DM submissions are posted to the server configured by `SUBMISSION_GUILD_ID`. That server must also have a submission channel set with `/設定 投稿頻道`.

If `DEV_GUILD_ID` is set, `npm run deploy-commands` deploys all commands to that guild for fast testing and also deploys the DM commands globally, because Discord bot DMs cannot use guild-only commands.
