// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encodeStateToHash,
  decodeStateFromHash,
  writeStateToUrl,
  readStateFromUrl,
  onUrlStateChange,
  bindStateToUrl,
  type UrlStateBinding,
} from './urlState';

/** Clear the hash before and after each DOM test so cases do not leak state. */
beforeEach(() => {
  window.location.hash = '';
});
afterEach(() => {
  window.location.hash = '';
});

describe('encodeStateToHash / decodeStateFromHash – round-trip', () => {
  const cases: Array<{ name: string; value: unknown }> = [
    { name: 'number', value: 42 },
    { name: 'negative float', value: -3.14159 },
    { name: 'string', value: 'hello world' },
    { name: 'boolean', value: true },
    { name: 'null', value: null },
    { name: 'array of numbers', value: [1, 2, 3, 4, 5] },
    { name: 'vec3 tuple', value: [1.5, -2.25, 0] },
    { name: 'nested object', value: { p: [1, 2, 0], s: 0.5, flag: false } },
    { name: 'id→value map', value: { point: [0.1, 0.2, 0], slider: 7, zoom: { w: 10, h: 5.6 } } },
    { name: 'unicode', value: { label: 'σ² ≈ π — 角度' } },
    { name: 'empty object', value: {} },
    { name: 'empty array', value: [] },
    { name: 'empty string', value: '' },
  ];

  for (const { name, value } of cases) {
    it(`round-trips ${name} exactly`, () => {
      const encoded = encodeStateToHash(value);
      expect(decodeStateFromHash(encoded)).toEqual(value);
    });
  }

  it('tolerates a leading # on decode', () => {
    const encoded = encodeStateToHash({ a: 1 });
    expect(decodeStateFromHash(`#${encoded}`)).toEqual({ a: 1 });
  });
});

describe('encodeStateToHash – URL safety', () => {
  it('produces only URL-safe base64url characters', () => {
    const encoded = encodeStateToHash({
      s: 'needs+escaping/=&? characters #inside',
      arr: [1, 2, 3],
      u: 'σπ角',
    });
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]*$/);
  });

  it('needs no percent-escaping (encodeURIComponent is identity)', () => {
    const encoded = encodeStateToHash({ many: 'a/b+c=d?e#f&g ' });
    expect(encodeURIComponent(encoded)).toBe(encoded);
  });
});

describe('decodeStateFromHash – malformed input is safe', () => {
  const bad = ['', '#', '!!!', 'a', '@@@@', '####', '%%%%', 'has space', '🙂'];
  for (const input of bad) {
    it(`returns null for ${JSON.stringify(input)} without throwing`, () => {
      let result: unknown = 'sentinel';
      expect(() => {
        result = decodeStateFromHash(input);
      }).not.toThrow();
      expect(result).toBeNull();
    });
  }
});

describe('writeStateToUrl / readStateFromUrl', () => {
  it('writes the state to location.hash and reads it back', () => {
    writeStateToUrl({ zoom: 2, center: [1, 1, 0] });
    expect(window.location.hash.length).toBeGreaterThan(1);
    expect(readStateFromUrl()).toEqual({ zoom: 2, center: [1, 1, 0] });
  });

  it('the written hash is URL-safe', () => {
    writeStateToUrl({ msg: 'a+b/c=d?e#f' });
    expect(window.location.hash).toMatch(/^#[A-Za-z0-9\-_]*$/);
  });

  it('replace mode still updates the readable state', () => {
    writeStateToUrl({ v: 1 }, { replace: true });
    expect(readStateFromUrl()).toEqual({ v: 1 });
  });

  it('readStateFromUrl returns null when the hash is empty', () => {
    window.location.hash = '';
    expect(readStateFromUrl()).toBeNull();
  });
});

describe('onUrlStateChange', () => {
  it('fires with the decoded state on hashchange', () => {
    const cb = vi.fn();
    const off = onUrlStateChange(cb);

    writeStateToUrl({ n: 9 });
    window.dispatchEvent(new Event('hashchange'));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith({ n: 9 });
    off();
  });

  it('stops firing after unsubscribe', () => {
    const cb = vi.fn();
    const off = onUrlStateChange(cb);
    off();

    writeStateToUrl({ n: 1 });
    window.dispatchEvent(new Event('hashchange'));

    expect(cb).not.toHaveBeenCalled();
  });
});

describe('bindStateToUrl', () => {
  /** A fake control holding a single value, matching the real getter/setter shape. */
  function fakeControl(initial: unknown): {
    value: unknown;
    binding: (id: string) => UrlStateBinding;
  } {
    const state = { value: initial };
    return {
      get value() {
        return state.value;
      },
      binding: (id: string) => ({
        id,
        get: () => state.value,
        set: (v: unknown) => {
          state.value = v;
        },
      }),
    };
  }

  it('captures every binding into an id→value map', () => {
    const a = fakeControl([1, 2, 0]);
    const b = fakeControl(5);
    const controller = bindStateToUrl([a.binding('p'), b.binding('s')], { restoreOnBind: false });
    expect(controller.capture()).toEqual({ p: [1, 2, 0], s: 5 });
    controller.dispose();
  });

  it('save writes the captured state to the URL, restore applies it back', () => {
    const a = fakeControl([3, 4, 0]);
    const controller = bindStateToUrl([a.binding('p')], { restoreOnBind: false, listen: false });
    controller.save();

    // Mutate the control, then restore from the URL.
    a.binding('p').set([0, 0, 0]);
    const applied = controller.restore();

    expect(applied).toBe(true);
    expect(a.value).toEqual([3, 4, 0]);
    controller.dispose();
  });

  it('restoreOnBind applies the URL state to the controls at bind time', () => {
    writeStateToUrl({ p: [9, 9, 9] });
    const a = fakeControl([0, 0, 0]);
    const controller = bindStateToUrl([a.binding('p')], { listen: false });
    expect(a.value).toEqual([9, 9, 9]);
    controller.dispose();
  });

  it('follows hashchange when listening', () => {
    const a = fakeControl(0);
    const controller = bindStateToUrl([a.binding('s')], { restoreOnBind: false });

    writeStateToUrl({ s: 42 });
    window.dispatchEvent(new Event('hashchange'));

    expect(a.value).toBe(42);
    controller.dispose();

    // After dispose, a further change is ignored.
    writeStateToUrl({ s: 100 });
    window.dispatchEvent(new Event('hashchange'));
    expect(a.value).toBe(42);
  });

  it('restore returns false when the hash holds no matching state', () => {
    window.location.hash = '';
    const a = fakeControl(1);
    const controller = bindStateToUrl([a.binding('s')], { restoreOnBind: false, listen: false });
    expect(controller.restore()).toBe(false);
    controller.dispose();
  });
});
