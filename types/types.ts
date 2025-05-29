export const QUESTION = "QUESTION";
export const HELP = "HELP";
export const SUPPORT = "SUPPORT";
export const OTHER = "OTHER";
export const TOOL_CALL_REQUEST = "TOOL_CALL_REQUEST";

export type FinalAction =
  | { type: "REPLY"; content: string }
  | { type: "REPLY_IN_THREAD"; content: string }
  | {
      type: "CREATE_EMBED";
      title: string;
      description: string;
      roleToPing?: string;
    };

export type MessageChoice =
  | typeof SUPPORT
  | typeof OTHER
  | typeof TOOL_CALL_REQUEST;

export type SupportTicketType = typeof QUESTION | typeof HELP;

export type Message = {
  author: string;
  content: string;
};

export type SupportTicketQuestion = {
  description: string;
  answer: string;
};

export type SupportTicket = {
  type?: SupportTicketType;
  question?: SupportTicketQuestion;
};

export type ToolCallRequestAction = {
  // actionLog is not intended to be shown to the end-user.
  // This is solely for logging purpose.
  actionLog: string;
  status: "success" | "failed" | "acknowledged";
};
