export const DEBUG = "DEBUG";
export const INFO = "INFO";
export const WARN = "WARN";
export const ERROR = "ERROR";

export type LogLevel = typeof DEBUG | typeof INFO | typeof WARN | typeof ERROR;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function log(level: LogLevel, message: string, ...data: any[]) {
  const timestamp = new Date().toLocaleString();
  const prefix = `[${timestamp}] [${level}]`;

  switch (level) {
    case ERROR:
      console.error(prefix, message, ...data);
      break;
    case WARN:
      console.warn(prefix, message, ...data);
      break;
    default:
      console.log(prefix, message, ...data);
  }
}
