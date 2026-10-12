import { describe, it, expect, vi } from 'vitest';
import {
  createSignal,
  createComputed,
  createEffect,
  batch,
  untrack,
  bindSignalToTracker,
  trackerToSignal,
} from './signals';

/**
 * A minimal numeric holder that mimics the ValueTracker surface the signal
 * interop relies on. Avoids importing a mobject into a core-level test.
 */
function makeTracker(initial: number): {
  getValue(): number;
  setValue(value: number): unknown;
} {
  let value = initial;
  return {
    getValue: () => value,
    setValue: (next: number) => {
      value = next;
    },
  };
}

describe('createSignal', () => {
  it('returns the initial value when read', () => {
    const count = createSignal(5);
    expect(count()).toBe(5);
  });

  it('updates the value with set', () => {
    const count = createSignal(0);
    count.set(3);
    expect(count()).toBe(3);
  });

  it('transforms the value with update', () => {
    const count = createSignal(10);
    count.update((prev) => prev * 2);
    expect(count()).toBe(20);
  });

  it('peek reads without tracking', () => {
    const count = createSignal(7);
    const fn = vi.fn(() => count.peek());
    const derived = createComputed(fn);
    expect(derived()).toBe(7);
    count.set(99);
    // peek created no dependency, so the computed stays memoized.
    expect(derived()).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('createComputed', () => {
  it('reflects its source signals', () => {
    const a = createSignal(2);
    const b = createSignal(3);
    const sum = createComputed(() => a() + b());
    expect(sum()).toBe(5);
  });

  it('updates when a source changes', () => {
    const a = createSignal(2);
    const doubled = createComputed(() => a() * 2);
    expect(doubled()).toBe(4);
    a.set(10);
    expect(doubled()).toBe(20);
  });

  it('is LAZY: the compute fn does not run until the value is read', () => {
    const a = createSignal(1);
    const fn = vi.fn(() => a() + 1);
    createComputed(fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('is LAZY after a dependency change too (no eager recompute)', () => {
    const a = createSignal(1);
    const fn = vi.fn(() => a() + 1);
    const c = createComputed(fn);
    expect(c()).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
    a.set(5);
    // Still not re-run until read again.
    expect(fn).toHaveBeenCalledTimes(1);
    expect(c()).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('is MEMOIZED: reading twice without a dep change runs the fn once', () => {
    const a = createSignal(4);
    const fn = vi.fn(() => a() * 3);
    const c = createComputed(fn);
    expect(c()).toBe(12);
    expect(c()).toBe(12);
    expect(c()).toBe(12);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not recompute when a dependency is set to an equal value', () => {
    const a = createSignal(4);
    const fn = vi.fn(() => a() * 3);
    const c = createComputed(fn);
    expect(c()).toBe(12);
    a.set(4); // same value, Object.is equal
    expect(c()).toBe(12);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('tracks only signals actually read (conditional dependencies)', () => {
    const toggle = createSignal(true);
    const a = createSignal(1);
    const b = createSignal(100);
    const fn = vi.fn(() => (toggle() ? a() : b()));
    const c = createComputed(fn);

    expect(c()).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);

    // b is NOT a dependency while toggle is true -> no recompute.
    b.set(200);
    expect(c()).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);

    // Flip the branch; now b becomes a dependency and a does not.
    toggle.set(false);
    expect(c()).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);

    // a is no longer tracked -> no recompute.
    a.set(999);
    expect(c()).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);

    // b is tracked again now.
    b.set(300);
    expect(c()).toBe(300);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('chains computeds (derived of derived) lazily and correctly', () => {
    const a = createSignal(1);
    const b = createComputed(() => a() + 1);
    const cFn = vi.fn(() => b() * 10);
    const c = createComputed(cFn);
    expect(c()).toBe(20);
    a.set(2);
    expect(c()).toBe(30);
    expect(cFn).toHaveBeenCalledTimes(2);
  });

  it('throws on a direct computed cycle', () => {
    // A computed that reads itself must be detected, not loop forever.
    const selfRef: { read: () => number } = { read: () => 0 };
    const c = createComputed((): number => selfRef.read());
    selfRef.read = () => c();
    expect(() => c()).toThrow();
  });
});

describe('createEffect', () => {
  it('runs immediately once', () => {
    const fn = vi.fn();
    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs when a tracked dependency changes', () => {
    const a = createSignal(0);
    const seen: number[] = [];
    createEffect(() => {
      seen.push(a());
    });
    a.set(1);
    a.set(2);
    expect(seen).toEqual([0, 1, 2]);
  });

  it('does not re-run after dispose', () => {
    const a = createSignal(0);
    const fn = vi.fn(() => a());
    const effect = createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    effect.dispose();
    a.set(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs when any upstream signal of a computed changes', () => {
    const a = createSignal(1);
    const b = createComputed(() => a() * 2);
    const seen: number[] = [];
    createEffect(() => {
      seen.push(b());
    });
    a.set(5);
    expect(seen).toEqual([2, 10]);
  });
});

describe('batch', () => {
  it('coalesces multiple writes into a single effect run', () => {
    const a = createSignal(0);
    const b = createSignal(0);
    const fn = vi.fn(() => a() + b());
    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    batch(() => {
      a.set(1);
      b.set(2);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(a() + b()).toBe(3);
  });

  it('returns the inner value', () => {
    expect(batch(() => 42)).toBe(42);
  });
});

describe('untrack', () => {
  it('reads without registering a dependency', () => {
    const a = createSignal(1);
    const fn = vi.fn(() => untrack(() => a()));
    const c = createComputed(fn);
    expect(c()).toBe(1);
    a.set(5);
    expect(c()).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('ValueTracker interop', () => {
  it('bindSignalToTracker propagates signal changes to the tracker', () => {
    const tracker = makeTracker(0);
    const value = createSignal(5);
    bindSignalToTracker(value, tracker);
    // Bind runs an effect immediately, so the initial value propagates.
    expect(tracker.getValue()).toBe(5);
    value.set(42);
    expect(tracker.getValue()).toBe(42);
  });

  it('bindSignalToTracker stops propagating after dispose', () => {
    const tracker = makeTracker(0);
    const value = createSignal(1);
    const binding = bindSignalToTracker(value, tracker);
    value.set(2);
    expect(tracker.getValue()).toBe(2);
    binding.dispose();
    value.set(99);
    expect(tracker.getValue()).toBe(2);
  });

  it('trackerToSignal seeds from the tracker and writes through on set', () => {
    const tracker = makeTracker(7);
    const signal = trackerToSignal(tracker);
    expect(signal()).toBe(7);
    signal.set(13);
    expect(signal()).toBe(13);
    expect(tracker.getValue()).toBe(13);
  });

  it('trackerToSignal drives a computed and a tracker together', () => {
    const tracker = makeTracker(2);
    const signal = trackerToSignal(tracker);
    const doubled = createComputed(() => signal() * 2);
    expect(doubled()).toBe(4);
    signal.set(5);
    expect(doubled()).toBe(10);
    expect(tracker.getValue()).toBe(5);
  });
});
