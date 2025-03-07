export const QUESTION = "QUESTION";

export const HELP = "HELP";
export const SUPPORT = "SUPPORT";
export const OTHER = "OTHER";
export const CHAT_HISTORY_QUERY = "CHAT_HISTORY_QUERY";

export type MessageChoice =
  | typeof SUPPORT
  | typeof CHAT_HISTORY_QUERY
  | typeof OTHER;
export type SupportChoice = typeof QUESTION | typeof HELP;

export type Message = {
  author: string;
  content: string;
};

export type ChatHistoryResponse = {
  isRelevantTopic: boolean;
  topicName: string;
  response: string;
  relevantMessages: Message[];
};

export type SupportTicket = {
  userName: string;
  type: SupportChoice;
  help?: {
    description: string;
  };
  question?: {
    description: string;
    answer?: string;
    links: string[];
  };
};
