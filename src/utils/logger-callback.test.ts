import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, onLog, clearLogListeners, type LogEntry } from './logger';

// ---------------------------------------------------------------------------
// onLog — log-message callback subscription (issue #380)
// ---------------------------------------------------------------------------

describe('onLog', () => {
  beforeEach(() => {
    // Silence console so test output stays pristine.
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    clearLogListeners();
    vi.restoreAllMocks();
  });

  it('delivers a structured entry to a registered listener', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.info('hello world');

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].message).toBe('hello world');
    expect(typeof entries[0].timestamp).toBe('number');
    expect(entries[0].timestamp).toBeGreaterThan(0);
  });

  it('joins multiple arguments into the message', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.warn('count is', 42, { ok: true });

    expect(entries[0].level).toBe('warn');
    expect(entries[0].message).toBe('count is 42 {"ok":true}');
  });

  it('stops delivering after unsubscribe', () => {
    const entries: LogEntry[] = [];
    const unsubscribe = onLog((entry) => entries.push(entry));

    logger.info('first');
    unsubscribe();
    logger.info('second');

    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe('first');
  });

  it('notifies every registered listener', () => {
    const a: LogEntry[] = [];
    const b: LogEntry[] = [];
    onLog((entry) => a.push(entry));
    onLog((entry) => b.push(entry));

    logger.error('boom');

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });

  it('isolates a throwing listener so others still fire and logging survives', () => {
    const received: LogEntry[] = [];
    onLog(() => {
      throw new Error('listener exploded');
    });
    onLog((entry) => received.push(entry));

    expect(() => logger.info('still works')).not.toThrow();
    expect(received).toHaveLength(1);
    expect(received[0].message).toBe('still works');
  });

  it('sanitizes sensitive data in the forwarded message', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.info('Auth: ' + 'Bearer ' + 'abc123XYZtoken456');

    expect(entries[0].message).toContain('[REDACTED]');
    expect(entries[0].message).not.toContain('abc123XYZtoken456');
  });

  it('respects the log-level filter (debug suppressed at default level)', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.debug('verbose detail');

    expect(entries).toHaveLength(0);
  });

  it('serializes Error arguments with a useful message', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.error(new Error('something failed'));

    expect(entries[0].message).toContain('something failed');
  });

  it('emits to listeners only after writing to the console', () => {
    let consoleCalledWhenListenerFired = false;
    onLog(() => {
      consoleCalledWhenListenerFired =
        (console.info as ReturnType<typeof vi.fn>).mock.calls.length > 0;
    });

    logger.info('ordering check');

    expect(consoleCalledWhenListenerFired).toBe(true);
  });

  it('does not recurse when a listener calls the logger', () => {
    let calls = 0;
    onLog(() => {
      calls += 1;
      if (calls < 5) logger.info('re-entrant call');
    });

    expect(() => logger.info('start')).not.toThrow();
    expect(calls).toBe(1);
  });

  it('handles circular objects without throwing', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;

    expect(() => logger.info('cycle:', circular)).not.toThrow();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toContain('cycle:');
  });

  it('redacts object values stored under sensitive keys', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    logger.info({ api_key: 'secretvalue123', label: 'safe-to-show' });

    expect(entries[0].message).not.toContain('secretvalue123');
    expect(entries[0].message).toContain('[REDACTED]');
    expect(entries[0].message).toContain('safe-to-show');
  });

  it('renders shared (non-circular) references without a false [Circular]', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    const shared = { value: 7 };
    logger.info({ a: shared, b: shared });

    expect(entries[0].message).not.toContain('[Circular]');
    // Both occurrences of the shared object should be rendered.
    expect(entries[0].message.match(/7/g)).toHaveLength(2);
  });

  it('sanitizes secrets when reporting a thrown listener error', () => {
    const errorSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    onLog(() => {
      throw new Error('listener leak: ' + 'Bearer ' + 'abc123XYZtoken456');
    });

    logger.info('trigger');

    const reported = errorSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join(' ');
    expect(reported).toContain('[REDACTED]');
    expect(reported).not.toContain('abc123XYZtoken456');
  });

  it('redacts structured secrets in a non-Error thrown listener value', () => {
    const errorSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    onLog(() => {
      throw { apiKey: 'hunter2plaintext' };
    });

    logger.info('trigger');

    const reported = errorSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join(' ');
    expect(reported).not.toContain('hunter2plaintext');
    expect(reported).toContain('[REDACTED]');
  });

  it('clearLogListeners removes all listeners', () => {
    const entries: LogEntry[] = [];
    onLog((entry) => entries.push(entry));

    clearLogListeners();
    logger.info('after clear');

    expect(entries).toHaveLength(0);
  });
});
