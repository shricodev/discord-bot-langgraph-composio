import { END } from "@langchain/langgraph";
import { type State } from "./graph.js";
import { QUESTION, OTHER, SUPPORT } from "../types/types.js";

export const processMessageEdges = (
  state: State,
): "process-support" | "process-other" | "__end__" => {
  switch (state.messageChoice) {
    case SUPPORT:
      return "process-support";
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
