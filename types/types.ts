export const QUESTION = "QUESTION";

export const HELP = "HELP";
export const SUPPORT = "SUPPORT";
export const OTHER = "OTHER";

export type MessageChoice = typeof SUPPORT | typeof OTHER;
export type SupportChoice = typeof QUESTION | typeof HELP;

export type Message = {
  author: string;
  content: string;
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
