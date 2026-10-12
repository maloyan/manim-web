// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  encodeStateToHash,
  decodeStateFromHash,
  writeStateToUrl,
  readStateFromUrl,
  onUrlStateChange,
  bindStateToUrl,
} from './urlState';

/**
 * In the node environment there is no `window` / `location` / `history`, so the
 * DOM-touching functions must degrade to a no-op or `null` without throwing.
 * The pure encode/decode codec must still work.
 */
describe('urlState – headless (no DOM)', () => {
  it('has no window global in this environment', () => {
    expect(typeof window).toBe('undefined');
  });

  it('encode/decode still round-trips without a DOM', () => {
    const state = { p: [1, 2, 0], s: 0.5 };
    expect(decodeStateFromHash(encodeStateToHash(state))).toEqual(state);
  });

  it('readStateFromUrl returns null', () => {
    expect(readStateFromUrl()).toBeNull();
  });

  it('writeStateToUrl does not throw', () => {
    expect(() => writeStateToUrl({ a: 1 })).not.toThrow();
    expect(() => writeStateToUrl({ a: 1 }, { replace: true })).not.toThrow();
  });

  it('onUrlStateChange returns a no-op unsubscribe and never fires', () => {
    const cb = vi.fn();
    let off: (() => void) | undefined;
    expect(() => {
      off = onUrlStateChange(cb);
    }).not.toThrow();
    expect(() => off?.()).not.toThrow();
    expect(cb).not.toHaveBeenCalled();
  });

  it('bindStateToUrl degrades: capture works, save/restore do not throw', () => {
    let value: unknown = 5;
    const controller = bindStateToUrl([{ id: 's', get: () => value, set: (v) => (value = v) }]);
    expect(controller.capture()).toEqual({ s: 5 });
    expect(() => controller.save()).not.toThrow();
    expect(controller.restore()).toBe(false);
    expect(() => controller.dispose()).not.toThrow();
  });
});
