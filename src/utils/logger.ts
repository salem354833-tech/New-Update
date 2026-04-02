import type { LogContext } from '@/types';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatMessage('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(formatMessage('error', message, context));
  },

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, context));
    }
  },
};
