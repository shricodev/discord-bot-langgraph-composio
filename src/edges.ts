import { END } from "@langchain/langgraph";
import { type State } from "./graph.js";
import {
  QUESTION,
  OTHER,
  SUPPORT,
  CHAT_HISTORY_QUERY,
} from "../types/types.js";

export const processMessageEdges = (
  state: State,
):
  | "process-support"
  | "process-other"
  | "process-chat-history-query"
  | "__end__" => {
  switch (state.messageChoice) {
    case SUPPORT:
      return "process-support";
    case CHAT_HISTORY_QUERY:
      return "process-chat-history-query";
    case OTHER:
      return "process-other";

    default:
      return END;
  }
};

export const processSupportEdges = (
  state: State,
): "process-support-question" | "process-support-help" => {
  return state.supportTicket.type === QUESTION
    ? "process-support-question"
    : "process-support-help";
};
