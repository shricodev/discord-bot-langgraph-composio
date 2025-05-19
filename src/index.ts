import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { initializeGraph } from "./graph.js";
import { type Message } from "../types/types.js";
import { tryCatch } from "../utils/try-catch.js";

dotenv.config();

const graph = initializeGraph();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const discordIdRegex = /<@(\d+)>/g;

client.on(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID!);

  if (!channel || !channel.isTextBased()) {
    console.error("Invalid channel or channel type is not supported");
    return;
  }
});

client.on(Events.MessageCreate, async (readyClient) => {
  if (readyClient.author.bot) return;
  if (!readyClient.mentions.has(client.user?.id || "")) return;

  const userMessage = readyClient.content.replace(discordIdRegex, "").trim();

  const graphInput = {
    message: {
      author: readyClient.author.username,
      content: userMessage,
    } as Message,
  };

  try {
    const initialResponse = await readyClient.reply("Processing...");
    const finalState = await graph.invoke(graphInput);
    // console.log(finalState);

    if (finalState.supportTicket?.question?.answer) {
      await initialResponse.edit(finalState.supportTicket.question.answer);
      return;
    }

    await initialResponse.edit(
      "I'm not sure if I have a response to this request :(",
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    await readyClient.reply(
      "Sorry, I encountered an error while processing your request.",
    );
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
