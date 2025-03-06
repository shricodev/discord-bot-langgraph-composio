import { END } from "@langchain/langgraph";
import { type State } from "./graph.js";
import { QUESTION, OTHER, SUPPORT, HELP } from "../types/types.js";

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

export const processSupportEdges = (state: State) => {
  if (state.supportTicket.type === QUESTION) return "process-support-question";
  if (state.supportTicket.type === HELP) return "process-support-help";

  return "process-support-other";
};
