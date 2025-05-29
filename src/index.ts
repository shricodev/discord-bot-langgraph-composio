import dotenv from "dotenv";
import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  type Interaction,
} from "discord.js";
import { initializeGraph } from "./graph.js";
import { type Message as ChatMessage } from "../types/types.js";
import { ERROR, INFO, log } from "../utils/logger.js";
import {
  DISCORD_BOT_TOKEN,
  DISCORD_BOT_GUILD_ID,
  OPENAI_API_KEY,
  validateEnvVars,
  DISCORD_BOT_CLIENT_ID,
  COMPOSIO_API_KEY,
} from "../utils/env-validator.js";

dotenv.config();

const requiredEnvVars = [
  DISCORD_BOT_CLIENT_ID,
  DISCORD_BOT_TOKEN,
  DISCORD_BOT_GUILD_ID,

  OPENAI_API_KEY,

  COMPOSIO_API_KEY,
];
validateEnvVars(requiredEnvVars);

const graph = initializeGraph();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// use a map to store history per channel to make it work properly with all the
// channels and not for one specific channel.
const channelHistories = new Map<string, ChatMessage[]>();

client.on(Events.ClientReady, async (readyClient) => {
  log(INFO, `logged in as ${readyClient.user.tag}. ready to process commands!`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "ask") return;

  const userPrompt = interaction.options.getString("prompt", true);
  const user = interaction.user;
  const channelId = interaction.channelId;

  if (!channelHistories.has(channelId)) channelHistories.set(channelId, []);

  const messageHistory = channelHistories.get(channelId)!;

  const currentUserMessage: ChatMessage = {
    author: user.username,
    content: userPrompt,
  };

  const graphInput = {
    message: currentUserMessage,
    previousMessages: [...messageHistory],
  };

  messageHistory.push(currentUserMessage);
  if (messageHistory.length > 20) messageHistory.shift();

  try {
    await interaction.reply({
      content: "Hmm... processing your request! 🐀",
    });

    const finalState = await graph.invoke(graphInput);

    if (!finalState.finalAction) {
      log(ERROR, "no final action found");
      await interaction.editReply({
        content: "I'm sorry, I couldn't process your request.",
      });
      return;
    }

    const userPing = `<@${user.id}>`;
    const action = finalState.finalAction;

    const quotedPrompt = `🗣️ "${userPrompt}"`;

    switch (action.type) {
      case "REPLY":
        await interaction.editReply({
          content: `${userPing}\n\n${quotedPrompt}\n\n${action.content}`,
        });
        break;

      case "REPLY_IN_THREAD":
        if (!interaction.channel || !("threads" in interaction.channel)) {
          await interaction.editReply({
            content: "Cannot create a thread in this channel",
          });
          return;
        }

        try {
          const thread = await interaction.channel.threads.create({
            name: `Action: ${userPrompt.substring(0, 50)}...`,
            autoArchiveDuration: 60,
          });

          await thread.send(
            `${userPing}\n\n${quotedPrompt}\n\n${action.content}`,
          );
          await interaction.editReply({
            content: `I've created a thread for you: ${thread.url}`,
          });
        } catch (threadError) {
          log(ERROR, "failed to create or reply in thread:", threadError);
          await interaction.editReply({
            content: `${userPing}\n\n${quotedPrompt}\n\nI tried to create a thread but failed. Here is your response:\n\n${action.content}`,
          });
        }
        break;

      case "CREATE_EMBED": {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(action.title)
          .setDescription(action.description)
          .setTimestamp()
          .setFooter({ text: "Support System" });

        const rolePing = action.roleToPing ? `<@${action.roleToPing}>` : "";

        await interaction.editReply({
          content: `${userPing} ${rolePing}`,
          embeds: [embed],
        });
        break;
      }
    }
  } catch (error) {
    log(ERROR, "generating AI response or processing graph:", error);
    const errorMessage =
      "sorry, I encountered an error while processing your request.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

const token = process.env.DISCORD_BOT_TOKEN!;
client.login(token);
