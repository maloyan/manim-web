/**
 * KeyboardInput — a general-purpose keyboard controller for interactive apps
 * and games.
 *
 * manim-web already has pointer interaction (`Clickable` / `Draggable` /
 * `Hoverable`) and a `StateMachine`, but no general keyboard primitive. This
 * controller tracks held keys, exposes per-frame edge queries (`wasPressed` /
 * `wasReleased`), derives a movement vector from arrow keys and WASD, and binds
 * a key to a `StateMachine` input or a `ValueTracker`. It makes the kind of
 * interactive software and games that plain Manim cannot do first-class in the
 * browser.
 *
 * All DOM access is feature-detected, so the controller is safe to construct
 * in Node, jsdom, or a headless render. Without a window the reads return
 * `false` or zero and never throw.
 *
 * @example
 * ```typescript
 * const keys = new KeyboardInput({ preventDefault: true });
 * // In the render loop, each frame:
 * function frame(dt: number): void {
 *   const [dx, dy] = keys.getDirectionVector();
 *   player.shift([dx * speed * dt, dy * speed * dt, 0]);
 *   if (keys.wasPressed('Space')) player.jump();
 *   keys.endFrame(); // clear the per-frame pressed/released edges
 * }
 * ```
 */

/** A per-key or wildcard callback. `key` is the normalized key name. */
export type KeyCallback = (key: string, event: KeyboardEvent) => void;

/** Unsubscribe from a callback registration. */
export type Unsubscribe = () => void;

/**
 * Minimal view of a `StateMachine` for binding. Both `StateMachine.setInput`
 * and `StateMachine.fire` match this, so no import of the class is needed.
 */
export interface StateMachineInputSink {
  setInput(name: string, value: boolean | number): unknown;
  fire(name: string): unknown;
}

/** Minimal view of a `ValueTracker` for binding. */
export interface ValueSink {
  setValue(value: number): unknown;
}

/** Options for a {@link KeyboardInput}. */
export interface KeyboardInputOptions {
  /**
   * Call `preventDefault()` on handled key events. `true` applies to every
   * key; an array restricts it to the listed (normalized) keys. Use it so game
   * keys such as the arrows and Space do not scroll the page. Default `false`.
   */
  preventDefault?: boolean | string[];
  /**
   * Attach the listeners immediately on construction. Set `false` to attach
   * later with {@link KeyboardInput.enable}. Default `true`.
   */
  autoEnable?: boolean;
}

/** Options for {@link KeyboardInput.bindValue}. */
export interface BindValueOptions {
  /** Value written to the tracker while the key is held. */
  heldValue: number;
  /** Value written when the key is released. Default `0`. */
  releasedValue?: number;
}

/** Aliases folded onto a single canonical, lowercase key name. */
const KEY_ALIASES: Record<string, string> = {
  ' ': 'space',
  spacebar: 'space',
  esc: 'escape',
  del: 'delete',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};

/**
 * Normalize a raw `KeyboardEvent.key` or a user query to a canonical,
 * lowercase name. `'ArrowUp'`, `'W'`, and `' '` become `'arrowup'`, `'w'`, and
 * `'space'`, so a held key reads back under any common spelling.
 * @param key - A raw key name.
 * @returns The canonical key name.
 */
export function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] ?? lower;
}

/** Keys that push the movement vector along +x / -x and +y / -y. */
const AXIS_KEYS = {
  right: ['arrowright', 'd'],
  left: ['arrowleft', 'a'],
  up: ['arrowup', 'w'],
  down: ['arrowdown', 's'],
};

/**
 * Resolve the DOM target for key events. An explicit target wins; otherwise
 * `window`, then `document`, then `null` for a headless environment.
 */
function resolveTarget(explicit?: EventTarget | null): EventTarget | null {
  if (explicit) return explicit;
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    return window;
  }
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    return document;
  }
  return null;
}

/**
 * Tracks keyboard state for interactive apps and games. Mirrors the
 * `Clickable` / `OrbitControls` lifecycle: construct, then
 * {@link enable} / {@link disable} / {@link dispose}.
 */
export class KeyboardInput {
  private readonly _target: EventTarget | null;
  private readonly _preventDefault: boolean | Set<string>;

  private readonly _down = new Set<string>();
  private readonly _pressed = new Set<string>();
  private readonly _released = new Set<string>();

  private readonly _downCallbacks = new Map<string, Set<KeyCallback>>();
  private readonly _upCallbacks = new Map<string, Set<KeyCallback>>();

  private _enabled = false;
  private readonly _onKeyDown: (event: KeyboardEvent) => void;
  private readonly _onKeyUp: (event: KeyboardEvent) => void;

  /**
   * Create a KeyboardInput.
   * @param options - Behavior options.
   * @param domTarget - Event target for key events. Defaults to `window` (or
   *   `document`), or `null` when no DOM is present.
   */
  constructor(options: KeyboardInputOptions = {}, domTarget?: EventTarget | null) {
    this._target = resolveTarget(domTarget);
    this._preventDefault = Array.isArray(options.preventDefault)
      ? new Set(options.preventDefault.map(normalizeKey))
      : (options.preventDefault ?? false);

    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);

    if (options.autoEnable ?? true) {
      this.enable();
    }
  }

  /** Whether the listeners are attached. */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /** Whether a DOM target is available. `false` in a headless environment. */
  get hasTarget(): boolean {
    return this._target !== null;
  }

  /**
   * Attach the key listeners. A no-op when already enabled or headless.
   */
  enable(): void {
    if (this._enabled || !this._target) return;
    this._target.addEventListener('keydown', this._onKeyDown as EventListener);
    this._target.addEventListener('keyup', this._onKeyUp as EventListener);
    this._enabled = true;
  }

  /**
   * Detach the key listeners and clear all held and edge state, so no key stays
   * stuck. Reads return defaults until {@link enable} is called again.
   */
  disable(): void {
    if (this._target) {
      this._target.removeEventListener('keydown', this._onKeyDown as EventListener);
      this._target.removeEventListener('keyup', this._onKeyUp as EventListener);
    }
    this._enabled = false;
    this.clear();
  }

  /**
   * Detach listeners and drop every registered callback. Use when the
   * controller is no longer needed.
   */
  dispose(): void {
    this.disable();
    this._downCallbacks.clear();
    this._upCallbacks.clear();
  }

  /** Clear held keys and both per-frame edge sets. */
  clear(): void {
    this._down.clear();
    this._pressed.clear();
    this._released.clear();
  }

  /**
   * Whether the key is held right now.
   * @param key - A key name in any common spelling (`'ArrowUp'`, `'w'`, `' '`).
   */
  isKeyDown(key: string): boolean {
    return this._down.has(normalizeKey(key));
  }

  /** Whether any key is held right now. */
  anyKeyDown(): boolean {
    return this._down.size > 0;
  }

  /**
   * Whether the key went down during the current frame. Cleared by
   * {@link update} / {@link endFrame}. Key auto-repeat does not re-fire it.
   * @param key - A key name in any common spelling.
   */
  wasPressed(key: string): boolean {
    return this._pressed.has(normalizeKey(key));
  }

  /**
   * Whether the key came up during the current frame. Cleared by
   * {@link update} / {@link endFrame}.
   * @param key - A key name in any common spelling.
   */
  wasReleased(key: string): boolean {
    return this._released.has(normalizeKey(key));
  }

  /**
   * The raw movement axes from the arrow keys and WASD, each component in
   * `{-1, 0, 1}`. Up is +y and right is +x; opposite keys cancel.
   * @returns `[x, y]`.
   */
  getAxis(): [number, number] {
    const x = (this._anyDown(AXIS_KEYS.right) ? 1 : 0) - (this._anyDown(AXIS_KEYS.left) ? 1 : 0);
    const y = (this._anyDown(AXIS_KEYS.up) ? 1 : 0) - (this._anyDown(AXIS_KEYS.down) ? 1 : 0);
    return [x, y];
  }

  /**
   * The movement vector from {@link getAxis}, normalized to unit length so a
   * diagonal is not faster than a straight line. A zero axis stays `[0, 0]`.
   * @returns `[x, y]`.
   */
  getDirectionVector(): [number, number] {
    const [x, y] = this.getAxis();
    const length = Math.hypot(x, y);
    if (length === 0) return [0, 0];
    return [x / length, y / length];
  }

  /**
   * Register a key-down callback. Repeated auto-repeat events do not re-fire it.
   * @param key - A key name, or `'any'` for every key.
   * @param callback - Called with the normalized key and the event.
   * @returns An unsubscribe function.
   */
  onKeyDown(key: string, callback: KeyCallback): Unsubscribe {
    return this._addCallback(this._downCallbacks, key, callback);
  }

  /**
   * Register a key-up callback.
   * @param key - A key name, or `'any'` for every key.
   * @param callback - Called with the normalized key and the event.
   * @returns An unsubscribe function.
   */
  onKeyUp(key: string, callback: KeyCallback): Unsubscribe {
    return this._addCallback(this._upCallbacks, key, callback);
  }

  /**
   * Hold a `StateMachine` bool input to match a key: `true` while held, `false`
   * on release.
   * @param machine - The `StateMachine` (or any {@link StateMachineInputSink}).
   * @param inputName - The bool input name.
   * @param key - The key to track.
   * @returns An unsubscribe function.
   */
  bindBool(machine: StateMachineInputSink, inputName: string, key: string): Unsubscribe {
    const stopDown = this.onKeyDown(key, () => machine.setInput(inputName, true));
    const stopUp = this.onKeyUp(key, () => machine.setInput(inputName, false));
    return () => {
      stopDown();
      stopUp();
    };
  }

  /**
   * Fire a `StateMachine` trigger input on each key-down.
   * @param machine - The `StateMachine` (or any {@link StateMachineInputSink}).
   * @param triggerName - The trigger input name.
   * @param key - The key to track.
   * @returns An unsubscribe function.
   */
  bindTrigger(machine: StateMachineInputSink, triggerName: string, key: string): Unsubscribe {
    return this.onKeyDown(key, () => machine.fire(triggerName));
  }

  /**
   * Drive a `ValueTracker` from a key: `heldValue` while held, `releasedValue`
   * on release.
   * @param tracker - The `ValueTracker` (or any {@link ValueSink}).
   * @param key - The key to track.
   * @param options - The held and released values.
   * @returns An unsubscribe function.
   */
  bindValue(tracker: ValueSink, key: string, options: BindValueOptions): Unsubscribe {
    const released = options.releasedValue ?? 0;
    const stopDown = this.onKeyDown(key, () => tracker.setValue(options.heldValue));
    const stopUp = this.onKeyUp(key, () => tracker.setValue(released));
    return () => {
      stopDown();
      stopUp();
    };
  }

  /**
   * Clear the per-frame pressed and released edge sets. Call once per frame
   * after reading {@link wasPressed} / {@link wasReleased}.
   * @param _dt - Delta time (seconds), accepted for render-loop compatibility.
   */
  update(_dt = 0): void {
    this.endFrame();
  }

  /** Alias of {@link update} that clears the per-frame edge sets. */
  endFrame(): void {
    this._pressed.clear();
    this._released.clear();
  }

  private _anyDown(keys: string[]): boolean {
    return keys.some((k) => this._down.has(k));
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    const key = normalizeKey(event.key);
    this._maybePreventDefault(event, key);
    // Ignore OS auto-repeat so `wasPressed` and callbacks fire once per press.
    if (event.repeat || this._down.has(key)) return;
    this._down.add(key);
    this._pressed.add(key);
    this._emit(this._downCallbacks, key, event);
  }

  private _handleKeyUp(event: KeyboardEvent): void {
    const key = normalizeKey(event.key);
    this._maybePreventDefault(event, key);
    this._down.delete(key);
    this._released.add(key);
    this._emit(this._upCallbacks, key, event);
  }

  private _maybePreventDefault(event: KeyboardEvent, key: string): void {
    const pd = this._preventDefault;
    if (pd === true || (pd instanceof Set && pd.has(key))) {
      event.preventDefault();
    }
  }

  private _addCallback(
    registry: Map<string, Set<KeyCallback>>,
    key: string,
    callback: KeyCallback,
  ): Unsubscribe {
    const name = key === 'any' ? 'any' : normalizeKey(key);
    const set = registry.get(name) ?? new Set<KeyCallback>();
    set.add(callback);
    registry.set(name, set);
    return () => {
      set.delete(callback);
      if (set.size === 0) registry.delete(name);
    };
  }

  private _emit(registry: Map<string, Set<KeyCallback>>, key: string, event: KeyboardEvent): void {
    registry.get(key)?.forEach((cb) => cb(key, event));
    registry.get('any')?.forEach((cb) => cb(key, event));
  }
}

/**
 * Factory for a {@link KeyboardInput}.
 * @param options - Behavior options.
 * @param domTarget - Event target for key events.
 * @returns A new KeyboardInput.
 */
export function makeKeyboardInput(
  options?: KeyboardInputOptions,
  domTarget?: EventTarget | null,
): KeyboardInput {
  return new KeyboardInput(options, domTarget);
}
