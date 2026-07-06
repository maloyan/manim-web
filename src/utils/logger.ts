/**
 * Structured logger for manim-web.
 * Provides consistent logging interface for both browser and Node environments.
 * Includes log sanitization to redact sensitive data (tokens, keys, emails).
 */

/** Severity of a log message. */
export type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * A single log event delivered to {@link onLog} listeners. Every field is a
 * primitive, so an entry is always safe to `JSON.stringify`.
 */
export interface LogEntry {
  /** Severity of the log call. */
  level: LogLevel;
  /** Sanitized, human-readable message built from all log arguments. */
  message: string;
  /** Unix epoch milliseconds (`Date.now()`) when the log call happened. */
  timestamp: number;
}

/** Callback invoked for every log message that passes the level filter. */
export type LogListener = (entry: LogEntry) => void;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const envLevel = typeof process !== "undefined"
  ? process.env?.LOG_LEVEL
  : undefined;
// An invalid LOG_LEVEL must not silently suppress all output — fall back to 'info'.
const currentLevel: LogLevel =
  envLevel && Object.prototype.hasOwnProperty.call(LOG_LEVELS, envLevel)
    ? (envLevel as LogLevel)
    : "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

// ---------------------------------------------------------------------------
// Log sanitization / scrubbing
// ---------------------------------------------------------------------------

const REDACTED = "[REDACTED]";

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
 * Object keys whose values are redacted regardless of the value's format.
 *
 * The {@link SENSITIVE_PATTERNS} above only catch secrets that *look* like
 * secrets (token prefixes, `key=value` assignments). A secret stored as a bare
 * object value — `{ apiKey: 'hunter2' }` — has no recognizable shape, so it is
 * caught here by the name of the key holding it.
 */
const SENSITIVE_KEY_PATTERN =
  /pass(?:word|wd)|secret|token|authorization|api[_-]?key|access[_-]?key|private[_-]?key|credential/i;

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
 *  - Plain objects and arrays are cloned with their string values scrubbed,
 *    and values under {@link SENSITIVE_KEY_PATTERN} keys fully redacted.
 *  - Circular references are replaced with `[Circular]`.
 *  - All other types are returned as-is.
 *
 * @param seen Objects on the *current* recursion path; used to detect cycles.
 *   Entries are removed on unwind so a value referenced twice (a diamond, not
 *   a cycle) is not mistaken for a circular reference.
 */
function sanitizeArg(
  arg: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof arg === "string") {
    return sanitizeString(arg);
  }

  // Errors carry their data (message/stack) in non-enumerable fields, so the
  // generic object walk below would render them as "{}". Convert to a
  // sanitized string that keeps the stack (or "Name: message" fallback).
  if (arg instanceof Error) {
    return sanitizeString(arg.stack ?? `${arg.name}: ${arg.message}`);
  }

  if (Array.isArray(arg)) {
    if (seen.has(arg)) return "[Circular]";
    seen.add(arg);
    try {
      return arg.map((value) => sanitizeArg(value, seen));
    } finally {
      seen.delete(arg);
    }
  }

  if (arg !== null && typeof arg === "object") {
    if (seen.has(arg)) return "[Circular]";
    seen.add(arg);
    try {
      const sanitized: Record<string, unknown> = {};
      for (
        const [key, value] of Object.entries(arg as Record<string, unknown>)
      ) {
        sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
          ? REDACTED
          : sanitizeArg(value, seen);
      }
      return sanitized;
    } finally {
      seen.delete(arg);
    }
  }

  return arg;
}

/** Sanitize an entire list of log arguments. */
function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => sanitizeArg(arg));
}

// ---------------------------------------------------------------------------
// Log-message callbacks  (issue #380)
// ---------------------------------------------------------------------------

const logListeners = new Set<LogListener>();

/**
 * Whether a listener notification is currently in flight. Guards against a
 * listener that itself calls `logger.*` triggering unbounded recursion.
 */
let notifying = false;

/**
 * Stringify a value without throwing on circular references or `BigInt`
 * values. The result is scrubbed by {@link buildMessage} before it reaches a
 * listener, so this only needs to be crash-safe, not redacted.
 */
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    const json = JSON.stringify(value, (_key, val: unknown) => {
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    });
    return json ?? String(value);
  } catch {
    return String(value);
  }
}

/** Render one raw log argument as a string for {@link LogEntry.message}. */
function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  // Errors carry their useful data (message/stack) in non-enumerable fields,
  // so a generic object walk would yield "{}". Handle them explicitly.
  if (arg instanceof Error) return arg.stack ?? `${arg.name}: ${arg.message}`;
  if (arg !== null && typeof arg === "object") return safeStringify(arg);
  return String(arg);
}

/**
 * Build a single sanitized message string from a list of log arguments.
 *
 * Non-`Error` arguments are run through {@link sanitizeArg} first so that
 * key-aware redaction applies to structured data; `Error` arguments keep their
 * stack via {@link formatArg}. The joined result is scrubbed once more so any
 * secret revealed by stringification is caught.
 */
function buildMessage(args: unknown[]): string {
  const parts = args.map((arg) =>
    arg instanceof Error ? formatArg(arg) : formatArg(sanitizeArg(arg))
  );
  return sanitizeString(parts.join(" "));
}

/**
 * Register a callback that receives every log message (at or above the active
 * `LOG_LEVEL`). The forwarded {@link LogEntry} is sanitized, so secrets are
 * never leaked to a remote endpoint.
 *
 * @returns An unsubscribe function that removes the listener.
 *
 * @example
 * ```ts
 * import { onLog } from 'manim-web';
 *
 * const stop = onLog((entry) =>
 *   fetch('/__log', { method: 'POST', body: JSON.stringify(entry) }),
 * );
 * // ...later
 * stop();
 * ```
 */
export function onLog(listener: LogListener): () => void {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

/** Remove all registered {@link onLog} listeners. */
export function clearLogListeners(): void {
  logListeners.clear();
}

/** Deliver a log entry to every listener, isolating failures and recursion. */
function notifyListeners(level: LogLevel, args: unknown[]): void {
  if (logListeners.size === 0 || notifying) return;
  notifying = true;
  const entry: LogEntry = {
    level,
    message: buildMessage(args),
    timestamp: Date.now(),
  };
  try {
    for (const listener of logListeners) {
      try {
        listener(entry);
      } catch (err) {
        // Report directly via console — never via `logger`, which would
        // recurse back into this function. Route the thrown value through the
        // same key-aware sanitize pipeline as a normal log argument: it may
        // carry secrets and this path skips the standard one.
        console.error("[manim-web] log listener threw:", buildMessage([err]));
      }
    }
  } finally {
    notifying = false;
  }
}

// ---------------------------------------------------------------------------
// Public logger
// ---------------------------------------------------------------------------

/** Write to the console (if the level passes) then notify {@link onLog} listeners. */
function emit(level: LogLevel, args: unknown[]): void {
  if (!shouldLog(level)) return;
  // Look up the console method dynamically so test spies are honored.
  console[level]("[manim-web]", ...sanitizeArgs(args));
  notifyListeners(level, args);
}

export const logger: Logger = {
  debug: (...args: unknown[]) => emit("debug", args),
  info: (...args: unknown[]) => emit("info", args),
  warn: (...args: unknown[]) => emit("warn", args),
  error: (...args: unknown[]) => emit("error", args),
};
