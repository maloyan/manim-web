/**
 * Structured logger for manim-web.
 * Provides consistent logging interface for both browser and Node environments.
 * Includes log sanitization to redact sensitive data (tokens, keys, emails).
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

// ---------------------------------------------------------------------------
// Log sanitization / scrubbing
// ---------------------------------------------------------------------------

const REDACTED = '[REDACTED]';

/**
 * Patterns that indicate sensitive data. Each regex is applied globally to
 * every string argument before it reaches the console.
 *
 * Covered categories:
 *  - Bearer / token authorization headers
 *  - JSON Web Tokens (three base64url segments separated by dots)
 *  - Common API key formats (aws, github, stripe, generic hex/base64 keys)
 *  - Email addresses
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  // Bearer tokens  (e.g. "Bearer eyJhb...")
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,

  // JWT tokens  (header.payload.signature, each part base64url)
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,

  // AWS access key IDs  (starts with AKIA, 20 uppercase alphanumeric chars)
  /AKIA[0-9A-Z]{16}/g,

  // GitHub tokens  (ghp_, gho_, ghu_, ghs_, ghr_ prefixed)
  /gh[pousr]_[A-Za-z0-9_]{36,}/g,

  // Stripe keys  (sk_live_, sk_test_, pk_live_, pk_test_)
  /[sp]k_(live|test)_[A-Za-z0-9]{24,}/g,

  // Generic API key assignment patterns  (key=..., token=..., secret=..., password=...)
  /(?:api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|secret[_-]?key|password)\s*[:=]\s*['"]?[A-Za-z0-9\-._~+/]{8,}['"]?/gi,

  // Email addresses
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
];

/**
 * Sanitize a single string by replacing all sensitive patterns with a
 * redaction placeholder.
 */
function sanitizeString(value: string): string {
  let result = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset lastIndex for stateful (global) regexes
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  return result;
}

/**
 * Recursively sanitize a single log argument.
 *  - Strings are scrubbed directly.
 *  - Plain objects and arrays are shallow-cloned with their string values scrubbed.
 *  - All other types are returned as-is.
 */
function sanitizeArg(arg: unknown): unknown {
  if (typeof arg === 'string') {
    return sanitizeString(arg);
  }

  if (Array.isArray(arg)) {
    return arg.map(sanitizeArg);
  }

  if (arg !== null && typeof arg === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(arg as Record<string, unknown>)) {
      sanitized[key] = sanitizeArg(value);
    }
    return sanitized;
  }

  return arg;
}

/** Sanitize an entire list of log arguments. */
function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map(sanitizeArg);
}

// ---------------------------------------------------------------------------
// Public logger
// ---------------------------------------------------------------------------

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug('[manim-web]', ...sanitizeArgs(args));
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info('[manim-web]', ...sanitizeArgs(args));
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn('[manim-web]', ...sanitizeArgs(args));
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error('[manim-web]', ...sanitizeArgs(args));
  },
};
