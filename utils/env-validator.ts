import { log, ERROR } from "./logger.js";

export const OPENAI_API_KEY = "OPENAI_API_KEY";

export const DISCORD_BOT_TOKEN = "DISCORD_BOT_TOKEN";
export const DISCORD_BOT_GUILD_ID = "DISCORD_BOT_GUILD_ID";
export const DISCORD_BOT_CLIENT_ID = "DISCORD_BOT_CLIENT_ID";

export const COMPOSIO_API_KEY = "COMPOSIO_API_KEY";

export const validateEnvVars = (requiredEnvVars: string[]): void => {
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    log(
      ERROR,
      "missing required environment variables. please create a .env file and add the following:",
    );
    missingVars.forEach((envVar) => console.error(`- ${envVar}`));
    process.exit(1);
  }
};
