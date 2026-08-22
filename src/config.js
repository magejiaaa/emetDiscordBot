require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const help = [
      `Missing required environment variable: ${name}`,
      '',
      'Create a .env file in the project root:',
      'DISCORD_TOKEN=your_bot_token_here',
      'CLIENT_ID=your_application_client_id_here',
      'SUBMISSION_GUILD_ID=your_target_server_id_here',
      'DATABASE_URL=postgresql://user:password@host:port/database',
      '',
      'You can find DISCORD_TOKEN and CLIENT_ID in the Discord Developer Portal.',
      'DATABASE_URL is provided by your PostgreSQL host, such as Railway.',
    ].join('\n');
    throw new Error(help);
  }
  return value;
}

module.exports = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('CLIENT_ID'),
  devGuildId: process.env.DEV_GUILD_ID || null,
  submissionGuildId: process.env.SUBMISSION_GUILD_ID || null,
  databaseUrl: process.env.DATABASE_URL || null,
};
