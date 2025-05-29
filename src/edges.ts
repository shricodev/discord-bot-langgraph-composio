import { END } from "@langchain/langgraph";
import { type State } from "./graph.js";
import { QUESTION, OTHER, SUPPORT, TOOL_CALL_REQUEST } from "../types/types.js";
import { log, WARN } from "../utils/logger.js";

export const processMessageEdges = (
  state: State,
): "process-support" | "process-other" | "process-tool-call" | "__end__" => {
  if (!state.messageChoice) {
    log(WARN, "state.messageChoice is undefined. Returning...");
    return END;
  }

  switch (state.messageChoice) {
    case SUPPORT:
      return "process-support";
    case TOOL_CALL_REQUEST:
      return "process-tool-call";
    case OTHER:
      return "process-other";
    default:
      log(WARN, "unknown message choice. Returning...");
      return END;
  }
};

export const processSupportEdges = (
  state: State,
): "process-support-question" | "process-support-help" | "__end__" => {
  if (!state.supportTicket?.type) {
    log(WARN, "state.supportTicket.type is undefined. Returning...");
    return END;
  }

  return state.supportTicket.type === QUESTION
    ? "process-support-question"
    : "process-support-help";
};
