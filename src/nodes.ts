import { type State, type Update } from "./graph.js";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  HELP,
  TOOL_CALL_REQUEST,
  OTHER,
  QUESTION,
  SUPPORT,
} from "../types/types.js";
import { extractStringFromAIMessage } from "../utils/helpers.js";
import { OpenAIToolSet } from "composio-core";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions.mjs";
import { v4 as uuidv4 } from "uuid";
import { DEBUG, ERROR, INFO, log, WARN } from "../utils/logger.js";
import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

const model = "gpt-4o-mini";

const toolset = new OpenAIToolSet();
const llm = new ChatOpenAI({
  model,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
});

export const processMessage = async (state: State): Promise<Update> => {
  log(DEBUG, "message in process message:", state.message);

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z.enum([SUPPORT, OTHER, TOOL_CALL_REQUEST]).describe(`
Categorize the user's message:
- ${SUPPORT}: Technical support, help with problems, or questions about AI.
- ${TOOL_CALL_REQUEST}: User asks the bot to perform tool action (e.g., "send an email", "summarize chat", "summarize google sheets").
- ${OTHER}: General conversation, spam, or off-topic messages.
`),
    }),
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert message analyzer AI. You need to categorize the message into
one of these categories:

- ${SUPPORT}: If the message asks for technical support, help with a problem, or questions about AIs and LLMs.
- ${TOOL_CALL_REQUEST}: If the message is a direct command or request for the bot to perform an action using external tools/services. Examples: "Summarize a document or Google Sheet", "Summarize the last hour of chat", "Send an email to devteam about this bug", "Create a Trello card for this feature request". Prioritize this if the user is asking the bot to *do* something beyond just answering.
- ${OTHER}: For general chit-chat, spam, off-topic messages, or anything not fitting ${SUPPORT} or ${TOOL_CALL_REQUEST}.
`,
    ],
    ["human", state.message.content],
  ]);

  return {
    messageChoice: res.type,
  };
};

export const processSupport = async (state: State): Promise<Update> => {
  log(DEBUG, "message in support:", state.message);

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z.enum([QUESTION, HELP]).describe(`
Type of support needed:
- ${QUESTION}: User asks a specific question seeking information or an answer.
- ${HELP}: User needs broader assistance, guidance, or reports an issue requiring intervention/troubleshooting.
`),
    }),
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `
You are a support ticket analyzer. Given a support message, categorize it as ${QUESTION} or ${HELP}.
- ${QUESTION}: For specific questions.
- ${HELP}: For requests for assistance, troubleshooting, or problem reports.
`,
    ],
    ["human", state.message.content],
  ]);

  return {
    supportTicket: {
      ...state.supportTicket,
      type: res.type,
    },
  };
};

export const processSupportHelp = async (state: State): Promise<Update> => {
  log(DEBUG, "message in support help:", state.message);

  return {
    supportTicket: {
      ...state.supportTicket,
    },
    finalAction: {
      type: "CREATE_EMBED",
      title: "🚨 Help Needed!",
      description: `A new request for help has been raised by **@${state.message.author}**.\n\n**Query:**\n> ${state.message.content}`,
      roleToPing: process.env.DISCORD_SUPPORT_MOD_ID,
    },
  };
};

export const processSupportQuestion = async (state: State): Promise<Update> => {
  log(DEBUG, "message in support question category:", state.message);

  const llm = new ChatOpenAI({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const systemPrompt = `
You are a helpful AI assistant specializing in AI, and LLMs. Answer
the user's question concisely and accurately based on general knowledge in
these areas. If the question is outside this scope (e.g., personal advice,
non-technical topics), politely state you cannot answer. User's question:
`;

  const res = await llm.invoke([
    ["system", systemPrompt],
    ["human", state.message.content],
  ]);

  const llmResponse = extractStringFromAIMessage(res);
  return {
    supportTicket: {
      ...state.supportTicket,
      question: {
        description: state.message.content,
        answer: llmResponse,
      },
    },
    finalAction: {
      type: "REPLY",
      content: llmResponse,
    },
  };
};

export const processToolCall = async (state: State): Promise<Update> => {
  log(DEBUG, "message in tool call request category:", state.message);

  const structuredOutputType = z.object({
    service: z
      .string()
      .describe("The target service (e.g., 'email', 'discord')."),
    task: z
      .string()
      .describe(
        "A concise description of the task (e.g., 'send email to X', 'summarize recent chat', 'create task Y').",
      ),
    details: z
      .string()
      .optional()
      .describe(
        "Any specific details or parameters extracted from the message relevant to the task.",
      ),
  });

  const structuredLlm = llm.withStructuredOutput(structuredOutputType);

  let parsedActionDetails: z.infer<typeof structuredOutputType> = {
    service: "unknown",
    task: "perform a requested action",
  };

  try {
    const res = await structuredLlm.invoke([
      [
        "system",
        `Parse the user's request to identify an action. Extract the target service, a description of the task, and any relevant details or parameters.
      Examples:
      - "Remind me to check emails at 5 PM": service: calendar/reminder, task: set reminder, details: check emails at 5 PM
      - "Send a summary of this conversation to #general channel": service: discord, task: send summary to channel, details: channel #general
      - "Create a bug report for 'login fails on mobile'": service: project_manager, task: create bug report, details: title 'login fails on mobile'`,
      ],
      ["human", state.message.content],
    ]);

    parsedActionDetails = res;
    log(INFO, "initial parsing action details:", parsedActionDetails);
  } catch (error) {
    log(ERROR, "initial parsing error:", error);
    return {
      toolCallRequest: {
        actionLog: `Failed to parse user request: ${state.message.content}`,
        status: "failed",
      },
      finalAction: {
        type: "REPLY_IN_THREAD",
        content:
          "I'm sorry, I had trouble understanding that action. Could you please rephrase it?",
      },
    };
  }

  try {
    log(INFO, "fetching composio tools");
    const tools = await toolset.getTools({
      apps: ["GOOGLESHEETS"],
    });

    log(INFO, `fetched ${tools.length} tools. Errors if > 128 for OpenAI:`);

    if (tools.length === 0) {
      log(WARN, "no tools fetched from Composio. skipping...");
      return {
        toolCallRequest: {
          actionLog: `Service: ${parsedActionDetails.service}, Task: ${parsedActionDetails.task}. No composio tools found`,
          status: "failed",
        },
        finalAction: {
          type: "REPLY_IN_THREAD",
          content: "Couldn't find any tools to perform your action.",
        },
      };
    }

    log(DEBUG, "starting iterative tool execution loop");

    const conversationHistory: BaseMessage[] = [
      new SystemMessage(
        "You are a helpful assistant that performs tool calls. Your task is to understand the user's request and use the available tools to fulfill the request completely. You can use multiple tools in sequence to accomplish complex tasks. Always provide a brief, conversational summary of what you accomplished after using tools.",
      ),
      new HumanMessage(state.message.content),
    ];

    let totalToolsUsed = 0;
    let finalResponse: string | null = null;

    const maxIterations = 5;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      log(
        DEBUG,
        `Iteration ${iteration}: calling LLM with ${tools.length} tools`,
      );

      const llmResponse = await llm.invoke(conversationHistory, {
        tools: tools,
      });

      log(DEBUG, `Iteration ${iteration} LLM response:`, llmResponse);

      const toolCalls = llmResponse.tool_calls;

      if ((!toolCalls || toolCalls.length === 0) && llmResponse.content) {
        finalResponse =
          typeof llmResponse.content === "string"
            ? llmResponse.content
            : JSON.stringify(llmResponse.content);
        log(
          INFO,
          `Final response received after ${iteration} iterations:`,
          finalResponse,
        );
        break;
      }

      if (toolCalls && toolCalls.length > 0) {
        log(
          INFO,
          `Iteration ${iteration}: executing ${toolCalls.length} tool(s)`,
        );
        totalToolsUsed += toolCalls.length;

        conversationHistory.push(llmResponse);

        for (const toolCall of toolCalls) {
          log(
            INFO,
            `Executing tool: ${toolCall.name} with args:`,
            toolCall.args,
          );

          const composioCompatibleToolCall: ChatCompletionMessageToolCall = {
            id: toolCall.id || uuidv4(),
            type: "function",
            function: {
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.args),
            },
          };

          let toolOutputContent: string;
          try {
            const executionResult = await toolset.executeToolCall(
              composioCompatibleToolCall,
            );
            log(
              INFO,
              `Tool ${toolCall.name} execution result:`,
              executionResult,
            );
            toolOutputContent = JSON.stringify(executionResult);
          } catch (toolError) {
            log(ERROR, `Tool ${toolCall.name} execution error:`, toolError);
            const errorMessage =
              toolError instanceof Error
                ? toolError.message
                : String(toolError);

            toolOutputContent = `Error: ${errorMessage}`;
          }

          conversationHistory.push(
            new ToolMessage({
              content: toolOutputContent,
              tool_call_id: toolCall.id || uuidv4(),
            }),
          );
        }

        continue;
      }

      log(
        WARN,
        `Iteration ${iteration}: LLM provided no tool calls or content`,
      );
      break;
    }

    let userFriendlyResponse: string;

    if (totalToolsUsed > 0) {
      log(DEBUG, "Generating user-friendly summary using LLM");

      try {
        const summaryResponse = await llm.invoke([
          new SystemMessage(
            "You are tasked with creating a brief, friendly summary for a Discord user about what actions were just completed. Keep it conversational, under 2-3 sentences, and focus on what was accomplished rather than technical details. Start with phrases like 'Done!', 'Successfully completed', 'All set!', etc.",
          ),
          new HumanMessage(
            `The user requested: "${state.message.content}"

I used ${totalToolsUsed} tools across ${iteration} iterations to complete their request. ${finalResponse ? `My final response was: ${finalResponse}` : "The task was completed successfully."}

Generate a brief, friendly summary of what was accomplished.`,
          ),
        ]);

        userFriendlyResponse =
          typeof summaryResponse.content === "string"
            ? summaryResponse.content
            : `Done! I've completed your request using ${totalToolsUsed} action${totalToolsUsed > 1 ? "s" : ""}.`;

        log(INFO, "Generated user-friendly summary:", userFriendlyResponse);
      } catch (summaryError) {
        log(ERROR, "Failed to generate summary:", summaryError);
        userFriendlyResponse = `All set! I've completed your request using ${totalToolsUsed} action${totalToolsUsed > 1 ? "s" : ""}.`;
      }
    } else {
      userFriendlyResponse =
        finalResponse ||
        `I understood your request about '${parsedActionDetails.task}' but couldn't find the right tools to complete it.`;
    }

    const actionLog = `Service: ${parsedActionDetails.service}, Task: ${parsedActionDetails.task}. Used ${totalToolsUsed} tools across ${iteration} iterations.`;

    return {
      toolCallRequest: {
        actionLog,
        status: totalToolsUsed > 0 ? "success" : "acknowledged",
      },
      finalAction: {
        type: "REPLY_IN_THREAD",
        content: userFriendlyResponse,
      },
    };
  } catch (error) {
    log(ERROR, "processing tool call with Composio:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      toolCallRequest: {
        actionLog: `Error during tool call (Service: ${parsedActionDetails.service}, Task: ${parsedActionDetails.task}). Error: ${errorMessage}`,
        status: "failed",
      },
      finalAction: {
        type: "REPLY_IN_THREAD",
        content: "Sorry, I encountered an error while processing your request.",
      },
    };
  }
};

export const processOther = async (state: State): Promise<Update> => {
  log(DEBUG, "message in other category:", state.message);

  const response =
    "This seems to be a general message. I'm here to help with technical support or perform specific actions if you ask. How can I assist you with those?";

  return {
    finalAction: {
      type: "REPLY_IN_THREAD",
      content: response,
    },
  };
};
