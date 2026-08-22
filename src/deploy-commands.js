const { REST, Routes } = require('discord.js');
const { clientId, devGuildId, token } = require('./config');
const { commands } = require('./commands');

const dmCommandNames = new Set(['投稿', '投稿刪除']);

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  const payload = commands.map((command) => command.data.toJSON());

  if (devGuildId) {
    const guildPayload = commands
      .filter((command) => !dmCommandNames.has(command.data.name))
      .map((command) => command.data.toJSON());

    await rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: guildPayload });
    console.log(`Deployed ${guildPayload.length} guild commands to ${devGuildId}.`);

    const dmPayload = commands
      .filter((command) => dmCommandNames.has(command.data.name))
      .map((command) => command.data.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: dmPayload });
    console.log(`Deployed ${dmPayload.length} global DM commands.`);
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: payload });
  console.log(`Deployed ${payload.length} global commands.`);
}

deployCommands().catch((error) => {
  console.error('Failed to deploy commands:', error);
  process.exitCode = 1;
});
