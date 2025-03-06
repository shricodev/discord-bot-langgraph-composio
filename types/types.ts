export const QUESTION = "QUESTION";

export const HELP = "HELP";
export const SUPPORT = "SUPPORT";
export const OTHER = "OTHER";

export type MessageChoice = typeof SUPPORT | typeof OTHER;
export type SupportChoice = typeof QUESTION | typeof HELP | typeof OTHER;

export type Message = {
  author: string;
  content: string;
};

export type SupportTicket = {
  userId: string;
  type: SupportChoice;
  help?: {
    description: string;
  };
  question?: {
    title: string;
    answer?: string;
    links: string[];
    ansFound: boolean;
  };
};
