/**
 * Structured logger for manim-js.
 * Provides consistent logging interface for both browser and Node environments.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  ((typeof process !== 'undefined' && process.env?.LOG_LEVEL) as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug('[manim-js]', ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info('[manim-js]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn('[manim-js]', ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error('[manim-js]', ...args);
  },
};
