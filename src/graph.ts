import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  type FinalAction,
  type ToolCallRequestAction,
  type Message,
  type MessageChoice,
  type SupportTicket,
} from "../types/types.js";
import {
  processToolCall,
  processMessage,
  processOther,
  processSupport,
  processSupportHelp,
  processSupportQuestion,
} from "./nodes.js";
import { processMessageEdges, processSupportEdges } from "./edges.js";

const state = Annotation.Root({
  message: Annotation<Message>(),
  previousMessages: Annotation<Message[]>(),
  messageChoice: Annotation<MessageChoice>(),
  supportTicket: Annotation<SupportTicket>(),
  toolCallRequest: Annotation<ToolCallRequestAction>(),
  finalAction: Annotation<FinalAction>(),
});

export type State = typeof state.State;
export type Update = typeof state.Update;

export function initializeGraph() {
  const workflow = new StateGraph(state);

  workflow
    .addNode("process-message", processMessage)
    .addNode("process-support", processSupport)
    .addNode("process-other", processOther)

    .addNode("process-support-question", processSupportQuestion)
    .addNode("process-support-help", processSupportHelp)
    .addNode("process-tool-call", processToolCall)

    // Edges setup starts here....
    .addEdge(START, "process-message")

    .addConditionalEdges("process-message", processMessageEdges)
    .addConditionalEdges("process-support", processSupportEdges)

    .addEdge("process-other", END)
    .addEdge("process-support-question", END)
    .addEdge("process-support-help", END)
    .addEdge("process-tool-call", END);

  const graph = workflow.compile();

  // To get the graph in png
  // getGraph() is deprecated though
  // Bun.write("graph/graph.png", await graph.getGraph().drawMermaidPng());

  return graph;
}
