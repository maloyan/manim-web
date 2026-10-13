/**
 * URL-state permalinks for explorables.
 *
 * Turn the live state of an explorable (MovablePoint positions, Slider values,
 * PanZoom camera) into a compact, shareable URL and restore it on load. This is
 * the Desmos/Observable "share this view" behavior: one link reproduces the
 * reader's interactive state.
 *
 * The state is any JSON-serializable value. It is `JSON.stringify`-ed, encoded
 * as UTF-8 bytes, then written as an unpadded base64url string, so the result
 * is URL-safe (only `A-Z a-z 0-9 - _`) and needs no percent-escaping in a hash.
 *
 * Every `window` / `location` / `history` access is guarded, so each function
 * degrades to a no-op (or `null`) without throwing in a headless environment.
 */

/** Options for {@link bindStateToUrl}. */
export interface BindUrlStateOptions {
  /** Use `history.replaceState` (no new history entry) when saving. Default: true. */
  replace?: boolean;
  /** Apply the URL state to the controls immediately on bind. Default: true. */
  restoreOnBind?: boolean;
  /** Re-apply the URL state to the controls on every `hashchange`. Default: true. */
  listen?: boolean;
}

/**
 * One control's serializable state, keyed by a stable user-provided id.
 *
 * The controls (MovablePoint, Slider, PanZoomControls) have no registered scene
 * serializer for their interactive state, so a permalink captures a small
 * explicit `{ id: value }` map: `get` reads the live value, `set` restores it.
 */
export interface UrlStateBinding {
  /** Stable id used as the key in the encoded `{ id: value }` map. */
  id: string;
  /** Read the current JSON-serializable value of this control. */
  get: () => unknown;
  /** Apply a decoded value back to this control. */
  set: (value: unknown) => void;
}

/** Handle returned by {@link bindStateToUrl}. */
export interface UrlStateController {
  /** Read the current value of every binding into an `{ id: value }` map. */
  capture: () => Record<string, unknown>;
  /** Capture the current state and write it to the URL hash. */
  save: () => void;
  /**
   * Read the URL hash and apply it to the bindings. Returns `true` when a valid
   * state was found and applied, `false` otherwise.
   */
  restore: () => boolean;
  /** Stop listening for `hashchange` (when `listen` was enabled). */
  dispose: () => void;
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const BASE64URL_LOOKUP: Map<string, number> = (() => {
  const map = new Map<string, number>();
  for (let i = 0; i < BASE64URL_ALPHABET.length; i++) {
    map.set(BASE64URL_ALPHABET.charAt(i), i);
  }
  return map;
})();

/** Encode raw bytes as an unpadded base64url string. */
function bytesToBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const hasB1 = i + 1 < bytes.length;
    const hasB2 = i + 2 < bytes.length;
    const b1 = hasB1 ? bytes[i + 1] : 0;
    const b2 = hasB2 ? bytes[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    out += BASE64URL_ALPHABET.charAt((triple >> 18) & 0x3f);
    out += BASE64URL_ALPHABET.charAt((triple >> 12) & 0x3f);
    if (hasB1) out += BASE64URL_ALPHABET.charAt((triple >> 6) & 0x3f);
    if (hasB2) out += BASE64URL_ALPHABET.charAt(triple & 0x3f);
  }
  return out;
}

/** Decode an unpadded base64url string to bytes, or `null` when malformed. */
function base64UrlToBytes(input: string): Uint8Array | null {
  const len = input.length;
  // A base64 group never ends with a single leftover character.
  if (len % 4 === 1) return null;
  const bytes: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const groupLen = Math.min(4, len - i);
    const c0 = BASE64URL_LOOKUP.get(input.charAt(i));
    const c1 = BASE64URL_LOOKUP.get(input.charAt(i + 1));
    if (c0 === undefined || c1 === undefined) return null;
    const c2 = groupLen > 2 ? BASE64URL_LOOKUP.get(input.charAt(i + 2)) : 0;
    const c3 = groupLen > 3 ? BASE64URL_LOOKUP.get(input.charAt(i + 3)) : 0;
    if (c2 === undefined || c3 === undefined) return null;
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    bytes.push((triple >> 16) & 0xff);
    if (groupLen > 2) bytes.push((triple >> 8) & 0xff);
    if (groupLen > 3) bytes.push(triple & 0xff);
  }
  return Uint8Array.from(bytes);
}

/**
 * Encode a JSON-serializable state to a compact, URL-safe string.
 *
 * The result contains only `A-Z a-z 0-9 - _`, so it is safe to drop into a URL
 * hash without percent-escaping.
 *
 * @param state - Any JSON-serializable value.
 * @returns The base64url-encoded JSON.
 */
export function encodeStateToHash(state: unknown): string {
  const json = JSON.stringify(state);
  // `JSON.stringify(undefined)` is `undefined`; encode it as the literal null.
  const text = typeof json === 'string' ? json : 'null';
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64Url(bytes);
}

/**
 * Decode a hash string produced by {@link encodeStateToHash} back to its state.
 *
 * A leading `#` is tolerated. A malformed or empty hash yields `null` and never
 * throws.
 *
 * @param hash - The encoded string, with or without a leading `#`.
 * @returns The decoded state, or `null` when the hash is empty or invalid.
 */
export function decodeStateFromHash(hash: string): unknown {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw.length === 0) return null;
  const bytes = base64UrlToBytes(raw);
  if (bytes === null) return null;
  try {
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** The current `Location`, or `null` when there is no DOM. */
function getLocation(): Location | null {
  return typeof window !== 'undefined' && window.location ? window.location : null;
}

/** The current `History`, or `null` when there is no DOM. */
function getHistory(): History | null {
  return typeof window !== 'undefined' && window.history ? window.history : null;
}

/** Options for {@link writeStateToUrl}. */
export interface WriteStateOptions {
  /**
   * Replace the current history entry instead of pushing a new one. A replace
   * does not create a back-button step and does not fire `hashchange`.
   * Default: false.
   */
  replace?: boolean;
}

/**
 * Write a state to `location.hash`. No-op when there is no DOM.
 *
 * @param state - Any JSON-serializable value.
 * @param options - `replace` to overwrite the current history entry.
 */
export function writeStateToUrl(state: unknown, options: WriteStateOptions = {}): void {
  const loc = getLocation();
  if (!loc) return;
  const encoded = encodeStateToHash(state);
  const hash = `#${encoded}`;
  if (options.replace) {
    const history = getHistory();
    if (history && typeof history.replaceState === 'function') {
      history.replaceState(history.state ?? null, '', hash);
      return;
    }
  }
  loc.hash = encoded;
}

/**
 * Read and decode the state from the current `location.hash`.
 *
 * @returns The decoded state, or `null` when there is no DOM, no hash, or the
 * hash is invalid.
 */
export function readStateFromUrl(): unknown {
  const loc = getLocation();
  if (!loc) return null;
  return decodeStateFromHash(loc.hash);
}

/**
 * Listen for `hashchange` and call `cb` with the newly decoded state.
 *
 * @param cb - Called with the decoded state (or `null`) on every hash change.
 * @returns An unsubscribe function. A no-op when there is no DOM.
 */
export function onUrlStateChange(cb: (state: unknown) => void): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => undefined;
  }
  const handler = (): void => cb(readStateFromUrl());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

/** Read every binding's live value into an `{ id: value }` map. */
function captureBindings(bindings: readonly UrlStateBinding[]): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const binding of bindings) state[binding.id] = binding.get();
  return state;
}

/** Apply a decoded `{ id: value }` map to the bindings whose id is present. */
function applyBindings(bindings: readonly UrlStateBinding[], state: unknown): boolean {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return false;
  const record = state as Record<string, unknown>;
  let applied = false;
  for (const binding of bindings) {
    if (Object.prototype.hasOwnProperty.call(record, binding.id)) {
      binding.set(record[binding.id]);
      applied = true;
    }
  }
  return applied;
}

/**
 * Bind a set of explorable controls to the URL hash.
 *
 * Each binding exposes a stable id, a getter and a setter. On bind the current
 * URL state is applied to the controls (so a shared link restores the view),
 * and `save()` captures the controls back into the URL. When `listen` is on,
 * the controls also follow back/forward navigation through `hashchange`.
 *
 * @param bindings - One {@link UrlStateBinding} per control.
 * @param options - Bind-time behavior (replace, restoreOnBind, listen).
 * @returns A {@link UrlStateController} to capture, save, restore and dispose.
 *
 * @example
 * ```ts
 * const controller = bindStateToUrl([
 *   { id: 'p', get: () => point.getPoint(), set: (v) => point.setPoint(v) },
 *   { id: 's', get: () => slider.getValue(), set: (v) => slider.setValue(v as number) },
 * ]);
 * // after a drag:
 * controller.save();
 * ```
 */
export function bindStateToUrl(
  bindings: readonly UrlStateBinding[],
  options: BindUrlStateOptions = {},
): UrlStateController {
  const { replace = true, restoreOnBind = true, listen = true } = options;

  const capture = (): Record<string, unknown> => captureBindings(bindings);
  const save = (): void => writeStateToUrl(capture(), { replace });
  const restore = (): boolean => applyBindings(bindings, readStateFromUrl());

  let unsubscribe: (() => void) | null = null;
  if (restoreOnBind) restore();
  if (listen) unsubscribe = onUrlStateChange((state) => applyBindings(bindings, state));

  const dispose = (): void => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  return { capture, save, restore, dispose };
}
