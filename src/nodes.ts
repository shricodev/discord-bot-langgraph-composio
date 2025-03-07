import { type State, type Update } from "./graph.js";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  CHAT_HISTORY_QUERY,
  HELP,
  OTHER,
  QUESTION,
  SUPPORT,
} from "../types/types.js";

const model = "gpt-3.5-turbo";

export const processMessage = async (state: State): Promise<Update> => {
  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    // don't need to be creative here.
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z.enum([SUPPORT, OTHER, CHAT_HISTORY_QUERY]).describe(`
The type of the message. It can be either ${OTHER}, ${SUPPORT}, or ${CHAT_HISTORY_QUERY}.
${CHAT_HISTORY_QUERY} is for when the user is asking about previous conversations
`),
    }),
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert message analyzer AI. You need to categorize the message into
one of these categories:

- ${SUPPORT}: When the message is asking for technical support or help with a problem.
- ${OTHER}: When the message is a spam or a general conversation or an off topic.
- ${CHAT_HISTORY_QUERY}: When the message is specifically asking about previous conversations. Also use this category when the user
  is trying to search or reference past conversations.

Be particularly attentive to messages that mention CopilotKit, AI Agents, LLMs, or refer to
previous messages/conversations or anything about AI.
`,
    ],
    ["human", state.message.content],
  ]);

  console.log("AI inferred:", res.type);

  return {
    messageChoice: res.type,
  };
};

export const processChatHistoryQuery = async (
  state: State,
): Promise<Update> => {
  console.log("Processing chat history query", state.message);

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
  });

  const previousMessages = state.previousMessages || [];

  const formattedPreviousMessages = previousMessages
    .map((msg) => `${msg.author}: ${msg.content}`)
    .join("\n");

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      isRelevantTopic: z
        .boolean()
        .describe(
          "Whether the query is about a permitted topic like AI, LLMs and CopilotKit",
        ),
      topicName: z.string().describe("The main topic of the query"),
      response: z
        .string()
        .describe("The response to the query based on chat history"),
    }),
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are a specialized support bot that ONLY responds to queries about AI Copilots,
with a focus on CopilotKit. If the query is not about AI Copilots or CopilotKit, indicate that
it's not a relevant topic. You should analyze the chat history to provide context-aware responses.

Permitted topics include:
- AI Copilots
- LLMs / AI Agents / AI
- LangChain / LangGraph
- CopilotKit

DO NOT respond to queries about other topics or personal matters not related to AI Copilots.

Here is the recent chat history for context:
${formattedPreviousMessages}
      `,
    ],
    ["human", state.message.content],
  ]);

  console.log("Chat history query analysis:", res);

  return {
    chatHistoryResponse: {
      isRelevantTopic: res.isRelevantTopic,
      topicName: res.topicName,
      response: res.isRelevantTopic
        ? res.response
        : "I'm sorry, I'm only able to help with AI and LLMs in general with main focus on CopilotKit.",
      relevantMessages: previousMessages.filter((msg) =>
        msg.content.toLowerCase().includes(res.topicName.toLowerCase()),
      ),
    },
  };
};

export const processSupport = async (state: State): Promise<Update> => {
  console.log("message in support category", state.message);

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z.enum([QUESTION, HELP]).describe(`
The type of the support ticket. It can be either ${QUESTION} or ${HELP}.
`),
    }),
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `
You are an expert support ticket analyzer AI. You are given a message and you need
to categorize the support message into either ${QUESTION} or ${HELP} category.

- ${QUESTION}: When the message is asking for support question.
- ${HELP}: When the message is asking for support help.
`,
    ],
    ["human", state.message.content],
  ]);

  console.log("AI inferred the support ticket as:", res.type);

  return {
    supportTicket: {
      ...state.supportTicket,
      type: res.type,
    },
  };
};

export const processOther = async (state: State): Promise<Update> => {
  console.log("message in other category", state.message);

  // for now do nothing here.
  // We can send some static output like "sorry, I can't help here"
  return {};
};

export const processSupportHelp = async (state: State): Promise<Update> => {
  console.log("message in support help category", state.message);

  // do something here, like create a support ticket
  // or open a thread tagging some mod
  return {};
};

export const processSupportQuestion = async (state: State): Promise<Update> => {
  console.log("message in support question category", state.message);
  // generate a generic answer from the llm first, then mention the mods
  // or open a thread

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const res = await llm.invoke([
    [
      "system",
      `
You are an expert support ticket analyzer AI. You are given a message and you need
to generate a answer to this help message.
`,
    ],
    ["human", state.message.content],
  ]);

  let llmResponse: string;
  if (Array.isArray(res.content)) {
    llmResponse = res.content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        return "";
      })
      .join(" ");
  } else if (typeof res.content === "string") {
    llmResponse = res.content;
  } else {
    llmResponse = "No valid response generated by the LLM.";
  }

  return {
    supportTicket: {
      ...state.supportTicket,
      question: {
        description: state.message.content,
        answer: llmResponse,
        links: [],
      },
    },
  };
};
