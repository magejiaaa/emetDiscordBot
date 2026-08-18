const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config');
const { buildCommandMap } = require('./commands');
const { initializeDatabase } = require('./db/database');
const interactionCreate = require('./events/interactionCreate');
const messageCreate = require('./events/messageCreate');
const ready = require('./events/ready');

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

initializeDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection(buildCommandMap());
client.pendingSubmissions = new Map();

client.once(ready.name, () => ready.execute(client));
client.on(interactionCreate.name, interactionCreate.execute);
client.on(messageCreate.name, messageCreate.execute);

setInterval(() => {
  const expiresAt = Date.now() - 15 * 60 * 1000;
  for (const [nonce, pending] of client.pendingSubmissions.entries()) {
    if (pending.createdAt < expiresAt) {
      client.pendingSubmissions.delete(nonce);
    }
  }
}, 5 * 60 * 1000).unref();

client.login(token);
