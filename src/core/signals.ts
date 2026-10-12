/**
 * Reactive signal graph - lazy, memoized, auto-tracked computed values.
 *
 * This is a small, synchronous, deterministic reactivity core in the style of
 * Motion Canvas signals (https://motioncanvas.io/docs/signals/): a computed
 * value "is only calculated when its value is requested", and "changing one
 * signal updates everything derived from it". It complements `ValueTracker`
 * and `alwaysRedraw`, which track a single animatable value, by adding a
 * general graph of derived values with automatic dependency tracking.
 *
 * Model:
 * - `createSignal(initial)` is a writable source. Reading it inside a
 *   computed or effect registers a dependency; writing it marks dependents
 *   dirty and runs any affected effects.
 * - `createComputed(fn)` is a derived signal. It runs `fn` lazily on first
 *   read, memoizes the result, and re-runs only after a tracked dependency
 *   changes (a dirty flag). It auto-tracks exactly the signals `fn` read on
 *   the last run, so conditional dependencies are handled correctly.
 * - `createEffect(fn)` runs `fn` immediately and re-runs it when a tracked
 *   dependency changes. Use it for side effects, such as pushing a signal
 *   value into a mobject.
 *
 * The graph is push-dirty, pull-value: writes push a dirty mark through the
 * graph, but a computed recomputes only when its value is pulled by a read.
 *
 * @example
 * ```typescript
 * const radius = createSignal(1);
 * const area = createComputed(() => Math.PI * radius() * radius());
 * area(); // PI
 * radius.set(2);
 * area(); // 4 * PI, recomputed on this read only
 * ```
 */

/**
 * A readable reactive value. Calling it returns the current value and, inside
 * a computed or effect, registers a dependency on it.
 */
export type Accessor<T> = () => T;

/**
 * A writable reactive value.
 */
export interface Signal<T> {
  /** Read the value. Registers a dependency when read inside a computed/effect. */
  (): T;
  /** Write a new value. A change (by `Object.is`) notifies dependents. */
  set(value: T): T;
  /** Read the value without registering a dependency. */
  peek(): T;
  /** Write a value derived from the previous value. */
  update(fn: (previous: T) => T): T;
}

/**
 * A read-only derived reactive value produced by {@link createComputed}.
 */
export interface Computed<T> {
  /** Read the (lazily computed, memoized) value; registers a dependency. */
  (): T;
  /** Read the value without registering a dependency. */
  peek(): T;
}

/**
 * A running effect produced by {@link createEffect}. Call `dispose` to stop it.
 */
export interface EffectHandle {
  /** Stop the effect and release its dependency links. */
  dispose(): void;
}

/**
 * The minimal surface the signal/tracker interop needs. `ValueTracker` and
 * any compatible numeric holder satisfy it, so the core module stays free of
 * a dependency on the mobject layer.
 */
export interface NumericValueHolder {
  /** Read the current numeric value. */
  getValue(): number;
  /** Write a new numeric value. */
  setValue(value: number): unknown;
}

/** Hard cap on effect-flush iterations, so a feedback cycle throws, not hangs. */
const MAX_FLUSH_ITERATIONS = 100000;

/** A node that other nodes can depend on (a signal or a computed). */
interface ReactiveSource {
  readonly observers: Set<ReactiveObserver>;
}

/** A node that depends on sources (a computed or an effect). */
interface ReactiveObserver {
  readonly sources: Set<ReactiveSource>;
  /** Mark stale because a dependency changed. */
  markStale(): void;
}

/** The observer whose dependencies are currently being recorded, if any. */
let activeObserver: ReactiveObserver | null = null;

/** Depth of the current `batch` nesting; `0` means effects flush eagerly. */
let batchDepth = 0;

/** Effects queued to run on the next flush. */
const pendingEffects = new Set<EffectNode>();

/** Register `source` as a dependency of the active observer, if there is one. */
function track(source: ReactiveSource): void {
  if (activeObserver !== null) {
    activeObserver.sources.add(source);
    source.observers.add(activeObserver);
  }
}

/** Remove every dependency link of `observer`, before it re-tracks or disposes. */
function unlink(observer: ReactiveObserver): void {
  for (const source of observer.sources) {
    source.observers.delete(observer);
  }
  observer.sources.clear();
}

/**
 * Run `fn` with `observer` as the active dependency collector, after clearing
 * the observer's old dependency links so only the signals read on this run are
 * tracked. Restores the previous active observer afterwards.
 */
function runTracked<T>(observer: ReactiveObserver, fn: () => T): T {
  unlink(observer);
  const previous = activeObserver;
  activeObserver = observer;
  try {
    return fn();
  } finally {
    activeObserver = previous;
  }
}

/** Run every pending effect until the queue drains, guarding against cycles. */
function flush(): void {
  let iterations = 0;
  while (pendingEffects.size > 0) {
    if (++iterations > MAX_FLUSH_ITERATIONS) {
      pendingEffects.clear();
      throw new Error('signals: effect flush exceeded iteration limit (likely a feedback cycle)');
    }
    const effect: EffectNode = pendingEffects.values().next().value as EffectNode;
    pendingEffects.delete(effect);
    effect.run();
  }
}

/** Propagate a change from `source` to its observers, then flush if not batched. */
function notify(source: ReactiveSource): void {
  for (const observer of [...source.observers]) {
    observer.markStale();
  }
  if (batchDepth === 0) {
    flush();
  }
}

/** Writable source node backing {@link createSignal}. */
class SignalNode<T> implements ReactiveSource {
  readonly observers = new Set<ReactiveObserver>();
  private value: T;

  constructor(initial: T) {
    this.value = initial;
  }

  read(): T {
    track(this);
    return this.value;
  }

  peek(): T {
    return this.value;
  }

  write(next: T): T {
    if (!Object.is(this.value, next)) {
      this.value = next;
      notify(this);
    }
    return next;
  }
}

/** Derived source + observer node backing {@link createComputed}. */
class ComputedNode<T> implements ReactiveSource, ReactiveObserver {
  readonly observers = new Set<ReactiveObserver>();
  readonly sources = new Set<ReactiveSource>();
  private value!: T;
  private dirty = true;
  private computing = false;
  private readonly fn: () => T;

  constructor(fn: () => T) {
    this.fn = fn;
  }

  markStale(): void {
    if (this.dirty) {
      return;
    }
    this.dirty = true;
    // Propagate the dirty mark downstream without recomputing (stays lazy).
    for (const observer of [...this.observers]) {
      observer.markStale();
    }
  }

  private recompute(): void {
    if (this.computing) {
      throw new Error('signals: cyclic dependency detected in createComputed');
    }
    this.computing = true;
    try {
      this.value = runTracked(this, this.fn);
    } finally {
      this.computing = false;
    }
    this.dirty = false;
  }

  read(): T {
    if (this.dirty) {
      this.recompute();
    }
    track(this);
    return this.value;
  }

  peek(): T {
    if (this.dirty) {
      this.recompute();
    }
    return this.value;
  }
}

/** Observer node backing {@link createEffect}. */
class EffectNode implements ReactiveObserver {
  readonly sources = new Set<ReactiveSource>();
  private disposed = false;
  private readonly fn: () => void;

  constructor(fn: () => void) {
    this.fn = fn;
  }

  markStale(): void {
    if (!this.disposed) {
      pendingEffects.add(this);
    }
  }

  run(): void {
    if (this.disposed) {
      return;
    }
    runTracked(this, this.fn);
  }

  dispose(): void {
    this.disposed = true;
    pendingEffects.delete(this);
    unlink(this);
  }
}

/**
 * Create a writable signal.
 *
 * @param initial - The starting value.
 * @returns A callable signal: `s()` reads, `s.set(v)` writes.
 */
export function createSignal<T>(initial: T): Signal<T> {
  const node = new SignalNode<T>(initial);
  const accessor = (() => node.read()) as Signal<T>;
  accessor.set = (value: T) => node.write(value);
  accessor.peek = () => node.peek();
  accessor.update = (fn: (previous: T) => T) => node.write(fn(node.peek()));
  return accessor;
}

/**
 * Create a derived signal. The function runs lazily on first read, memoizes
 * its result, auto-tracks the signals it reads, and recomputes only after one
 * of those tracked signals changes.
 *
 * @param fn - The derivation. It may read any signals or computeds.
 * @returns A read-only computed accessor.
 */
export function createComputed<T>(fn: () => T): Computed<T> {
  const node = new ComputedNode<T>(fn);
  const accessor = (() => node.read()) as Computed<T>;
  accessor.peek = () => node.peek();
  return accessor;
}

/**
 * Create an effect. It runs once immediately, tracks the signals it reads, and
 * re-runs whenever one of those tracked signals changes.
 *
 * @param fn - The side effect to run.
 * @returns A handle whose `dispose` stops further runs.
 */
export function createEffect(fn: () => void): EffectHandle {
  const node = new EffectNode(fn);
  node.run();
  return { dispose: () => node.dispose() };
}

/**
 * Batch writes so dependent effects run once after the block, not per write.
 *
 * @param fn - The block that performs the writes.
 * @returns The value the block returns.
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      flush();
    }
  }
}

/**
 * Read signals inside `fn` without registering them as dependencies.
 *
 * @param fn - The block to run untracked.
 * @returns The value the block returns.
 */
export function untrack<T>(fn: () => T): T {
  const previous = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = previous;
  }
}

/**
 * Bind a signal to a numeric holder such as a `ValueTracker`: whenever the
 * signal changes, the holder's value is updated. The initial value propagates
 * immediately.
 *
 * @param source - A readable signal (or any accessor) of a number.
 * @param target - The holder to drive (for example a `ValueTracker`).
 * @returns A handle whose `dispose` stops the binding.
 */
export function bindSignalToTracker(
  source: Accessor<number>,
  target: NumericValueHolder,
): EffectHandle {
  return createEffect(() => {
    target.setValue(source());
  });
}

/**
 * Wrap a numeric holder such as a `ValueTracker` as a writable signal. The
 * signal is seeded from the holder's current value, and writing the signal
 * writes through to the holder.
 *
 * @param target - The holder to wrap (for example a `ValueTracker`).
 * @returns A signal that mirrors writes into the holder.
 */
export function trackerToSignal(target: NumericValueHolder): Signal<number> {
  const signal = createSignal(target.getValue());
  const writeThrough = signal.set;
  signal.set = (value: number) => {
    target.setValue(value);
    return writeThrough(value);
  };
  signal.update = (fn: (previous: number) => number) => signal.set(fn(signal.peek()));
  return signal;
}
