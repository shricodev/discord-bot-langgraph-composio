import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  type Message,
  type MessageChoice,
  type SupportTicket,
} from "../types/types.js";
import {
  processMessage,
  processOther,
  processSupport,
  processSupportHelp,
  processSupportOther,
  processSupportQuestion,
} from "./nodes.js";
import { processMessageEdges, processSupportEdges } from "./edges.js";

const state = Annotation.Root({
  message: Annotation<Message>(),
  previousMessages: Annotation<Message[]>(),
  messageChoice: Annotation<MessageChoice>(),
  supportTicket: Annotation<SupportTicket>(),
});

export type State = typeof state.State;
export type Update = typeof state.Update;

export async function initializeGraph() {
  const workflow = new StateGraph(state);

  workflow
    .addNode("process-message", processMessage)
    .addNode("process-support", processSupport)
    .addNode("process-other", processOther)

    .addNode("process-support-question", processSupportQuestion)
    .addNode("process-support-help", processSupportHelp)
    .addNode("process-support-other", processSupportOther)

    .addEdge(START, "process-message")
    .addConditionalEdges("process-message", processMessageEdges)
    .addConditionalEdges("process-support", processSupportEdges)

    .addEdge("process-other", END)
    .addEdge("process-support-question", END)
    .addEdge("process-support-help", END)
    .addEdge("process-support-other", END);

  const graph = workflow.compile();

  // To get the graph in png
  Bun.write("graph/graph.png", await graph.getGraph().drawMermaidPng());

  return graph;
}
