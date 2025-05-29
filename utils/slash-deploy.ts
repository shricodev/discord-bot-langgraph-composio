import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { log, INFO, ERROR } from "./logger.js";
import {
  DISCORD_BOT_TOKEN,
  DISCORD_BOT_GUILD_ID,
  OPENAI_API_KEY,
  DISCORD_BOT_CLIENT_ID,
  validateEnvVars,
} from "./env-validator.js";

dotenv.config();

const requiredEnvVars = [
  DISCORD_BOT_TOKEN,
  DISCORD_BOT_GUILD_ID,
  DISCORD_BOT_CLIENT_ID,
  OPENAI_API_KEY,
];
validateEnvVars(requiredEnvVars);

const commands = [
  {
    name: "ask",
    description: "Ask the AI assistant a question or give it a command.",
    options: [
      {
        name: "prompt",
        type: 3,
        description: "Your question or command for the bot",
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN!,
);

(async () => {
  try {
    log(INFO, "deploying slash(/) commands");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_BOT_CLIENT_ID!,
        process.env.DISCORD_BOT_GUILD_ID!,
      ),
      {
        body: commands,
      },
    );

    log(INFO, "slash(/) commands deployed");
  } catch (error) {
    log(ERROR, "deploying slash(/) commands:", error);
  }
})();
