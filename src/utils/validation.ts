/**
 * Runtime validation helpers for constructor/options checks.
 */

/** Ensure `options` is a plain config object and not an unexpected class instance. */
export function assertIsPlainOptions(options: unknown, callerName = 'constructor'): void {
  if (options === undefined) return;
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`${callerName}: options must be a plain object`);
  }

  const anyOpt = options as Record<string, unknown>;

  // Heuristics to detect accidental passing of a Mobject/Animation instead of options.
  if (typeof anyOpt.interpolate === 'function') {
    throw new TypeError(
      `${callerName}: received an Animation instance as options. Did you swap arguments?`,
    );
  }
  if (typeof anyOpt.getPoints === 'function' || typeof anyOpt.add === 'function') {
    throw new TypeError(
      `${callerName}: received a Mobject-like instance as options. Did you swap arguments?`,
    );
  }
}

/** Ensure a required numeric option exists and is a finite number. */
export function assertNumberOption(
  obj: unknown,
  key: string | number,
  callerName = 'constructor',
): number {
  const val = obj && (obj as Record<string, unknown>)[key];
  if (typeof val !== 'number' || !isFinite(val)) {
    throw new TypeError(
      `${callerName}: required numeric option '${String(key)}' is missing or invalid`,
    );
  }
  return val as number;
}

/** Ensure a required string-or-string-array option exists. */
export function assertLatexOption(
  obj: unknown,
  key: string | number,
  callerName = 'constructor',
): string | string[] {
  const val = obj && (obj as Record<string, unknown>)[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.every((v) => typeof v === 'string')) return val as string[];
  throw new TypeError(
    `${callerName}: required option '${String(key)}' must be a string or string[]`,
  );
}

export default {};
