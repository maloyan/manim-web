/**
 * GamepadInput — a general-purpose gamepad controller for interactive apps and
 * games, built on the Web Gamepad API.
 *
 * manim-web already has a {@link KeyboardInput} for keyboard-driven games. A
 * gamepad is the other half of game input, and the Web Gamepad API is a
 * browser-unique capability that file-based ManimCE cannot offer. This
 * controller is the sibling of {@link KeyboardInput}: the same lifecycle
 * (`enable` / `disable` / `dispose`), the same per-frame edge queries
 * (`wasButtonPressed` / `wasButtonReleased`), a movement vector from the d-pad
 * or left stick, and the same `StateMachine` / `ValueTracker` bindings.
 *
 * The Gamepad API is poll-based: button state arrives in a snapshot, not as
 * events. So {@link GamepadInput.poll} (aliased by {@link GamepadInput.update})
 * reads the live snapshot each frame and computes the press / release edges.
 * Call it once per frame before reading state.
 *
 * All navigator and DOM access is feature-detected, so the controller is safe
 * to construct in Node, jsdom, or a headless render. Without `getGamepads` the
 * reads return `false` or zero and nothing throws. Tests inject a fake snapshot
 * through the `getGamepads` seam, so no real hardware is required.
 *
 * @example
 * ```typescript
 * const pad = new GamepadInput({ preventStickDrift: 0.15 });
 * // In the render loop, each frame:
 * function frame(dt: number): void {
 *   pad.poll(); // read the snapshot and compute edges
 *   const [dx, dy] = pad.getDirectionVector();
 *   player.shift([dx * speed * dt, dy * speed * dt, 0]);
 *   if (pad.wasButtonPressed('A')) player.jump();
 * }
 * ```
 */

import { logger } from '../utils/logger';
import type {
  StateMachineInputSink,
  ValueSink,
  Unsubscribe,
  BindValueOptions,
} from './KeyboardInput';

// ---------------------------------------------------------------------------
// Structural device types (dependency-injection seam)
// ---------------------------------------------------------------------------

/**
 * The subset of a `GamepadButton` the controller reads. A real `GamepadButton`
 * satisfies this, and a test stub implements only these two fields.
 */
export interface GamepadButtonLike {
  /** Whether the button is pressed. */
  readonly pressed: boolean;
  /** The analog value in `[0, 1]` (triggers), or `0` / `1` for a plain button. */
  readonly value: number;
}

/**
 * The subset of a `Gamepad` the controller reads. A real `Gamepad` satisfies
 * this shape, so `navigator.getGamepads()` feeds the controller directly, and a
 * test injects a plain object with the same fields.
 */
export interface GamepadLike {
  /** The pad's index in the snapshot array. */
  readonly index: number;
  /** The device id, when the pad exposes one. */
  readonly id?: string;
  /** Whether the pad is connected. Absent is treated as connected. */
  readonly connected?: boolean;
  /** The W3C mapping name, typically `'standard'`. */
  readonly mapping?: string;
  /** The button states, indexed by the standard-mapping order. */
  readonly buttons: ReadonlyArray<GamepadButtonLike>;
  /** The axis values in `[-1, 1]`, indexed by the standard-mapping order. */
  readonly axes: ReadonlyArray<number>;
}

/**
 * The snapshot source. Returns one entry per pad slot; a slot is `null` when no
 * pad is connected there. `navigator.getGamepads()` matches this signature.
 */
export type GamepadSource = () => ReadonlyArray<GamepadLike | null>;

/** A gamepad button callback. `button` is the resolved button index. */
export type GamepadButtonCallback = (button: number, gamepad: GamepadLike | null) => void;

// ---------------------------------------------------------------------------
// Standard mapping constants
// ---------------------------------------------------------------------------

/**
 * The W3C standard-gamepad button name → index map. Use a name
 * (`'A'`, `'dpadUp'`, `'LT'`) in any query instead of a raw index.
 * @see https://www.w3.org/TR/gamepad/#remapping
 */
export const STANDARD_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  select: 8,
  start: 9,
  L3: 10,
  R3: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
  guide: 16,
} as const;

/** The standard-mapping axis indices for the two sticks. */
export const STANDARD_AXES = {
  leftX: 0,
  leftY: 1,
  rightX: 2,
  rightY: 3,
} as const;

/** Button-name aliases folded onto a canonical standard-mapping name. */
const BUTTON_ALIASES: Record<string, keyof typeof STANDARD_BUTTONS> = {
  cross: 'A',
  circle: 'B',
  square: 'X',
  triangle: 'Y',
  l1: 'LB',
  r1: 'RB',
  l2: 'LT',
  r2: 'RT',
  back: 'select',
  view: 'select',
  menu: 'start',
  home: 'guide',
  up: 'dpadUp',
  down: 'dpadDown',
  left: 'dpadLeft',
  right: 'dpadRight',
};

/** Lowercased canonical button names, for case-insensitive lookup. */
const CANONICAL_BY_LOWER: Record<string, number> = Object.fromEntries(
  Object.entries(STANDARD_BUTTONS).map(([name, index]) => [name.toLowerCase(), index]),
);

/**
 * Resolve a button name or index to a standard-mapping index.
 * @param button - A button index, or a name in any common spelling.
 * @returns The index, or `-1` when the name is unknown.
 */
export function resolveButton(button: number | string): number {
  if (typeof button === 'number') return button;
  const lower = button.toLowerCase();
  const aliased = BUTTON_ALIASES[lower];
  if (aliased) return STANDARD_BUTTONS[aliased];
  return CANONICAL_BY_LOWER[lower] ?? -1;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Options for a {@link GamepadInput}. */
export interface GamepadInputOptions {
  /**
   * Which pad slot to read. By default the first connected pad in the snapshot
   * is used, so a single controller just works.
   */
  gamepadIndex?: number;
  /**
   * Stick deadzone in `[0, 1]`. An axis whose magnitude is below this reads as
   * `0`, so a resting stick does not drift. Default `0.1`.
   */
  deadzone?: number;
  /**
   * Attach the connection listeners immediately on construction. Set `false` to
   * attach later with {@link GamepadInput.enable}. Default `true`.
   */
  autoEnable?: boolean;
}

// ---------------------------------------------------------------------------
// Environment guards
// ---------------------------------------------------------------------------

/**
 * Resolve the snapshot source for this environment. An injected source wins;
 * otherwise `navigator.getGamepads` is bound when present, else `null` for a
 * headless environment.
 */
function resolveGetGamepads(explicit?: GamepadSource | null): GamepadSource | null {
  if (explicit) return explicit;
  if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
    return () => navigator.getGamepads();
  }
  return null;
}

/**
 * Resolve the DOM target for `gamepadconnected` / `gamepaddisconnected` events.
 * These fire on `window`; returns `null` when no window is present.
 */
function resolveEventTarget(explicit?: EventTarget | null): EventTarget | null {
  if (explicit) return explicit;
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    return window;
  }
  return null;
}

/** Whether the Web Gamepad API is available in this environment. */
export function isGamepadSupported(): boolean {
  return resolveGetGamepads() !== null;
}

// ---------------------------------------------------------------------------
// GamepadInput
// ---------------------------------------------------------------------------

/**
 * Reads live gamepad state for interactive apps and games. Mirrors
 * {@link KeyboardInput}: construct, then
 * {@link enable} / {@link disable} / {@link dispose}, and {@link poll} once a
 * frame.
 */
export class GamepadInput {
  private readonly _getGamepads: GamepadSource | null;
  private readonly _eventTarget: EventTarget | null;
  private readonly _gamepadIndex?: number;
  private readonly _deadzone: number;

  private readonly _down = new Set<number>();
  private readonly _pressed = new Set<number>();
  private readonly _released = new Set<number>();
  private _axes: number[] = [];
  private _buttonValues: number[] = [];

  private readonly _downCallbacks = new Map<number | 'any', Set<GamepadButtonCallback>>();
  private readonly _upCallbacks = new Map<number | 'any', Set<GamepadButtonCallback>>();

  private _enabled = false;
  private readonly _onConnect: (event: Event) => void;
  private readonly _onDisconnect: (event: Event) => void;

  /**
   * Create a GamepadInput.
   * @param options - Behavior options.
   * @param getGamepads - Snapshot source. Defaults to `navigator.getGamepads`,
   *   or `null` when no Gamepad API is present. Tests inject a fake here.
   * @param eventTarget - Target for connection events. Defaults to `window`.
   */
  constructor(
    options: GamepadInputOptions = {},
    getGamepads?: GamepadSource | null,
    eventTarget?: EventTarget | null,
  ) {
    this._getGamepads = resolveGetGamepads(getGamepads);
    this._eventTarget = resolveEventTarget(eventTarget);
    this._gamepadIndex = options.gamepadIndex;
    this._deadzone = options.deadzone ?? 0.1;

    this._onConnect = this._handleConnect.bind(this);
    this._onDisconnect = this._handleDisconnect.bind(this);

    if (options.autoEnable ?? true) {
      this.enable();
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Whether the controller is enabled (connection listeners attached). */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /** Whether a Gamepad API snapshot source is available. */
  get hasSource(): boolean {
    return this._getGamepads !== null;
  }

  /** Whether a DOM target for connection events is available. */
  get hasTarget(): boolean {
    return this._eventTarget !== null;
  }

  /**
   * Attach the `gamepadconnected` / `gamepaddisconnected` listeners. A no-op
   * when already enabled. Polling works even without a DOM target.
   */
  enable(): void {
    if (this._enabled) return;
    if (this._eventTarget) {
      this._eventTarget.addEventListener('gamepadconnected', this._onConnect);
      this._eventTarget.addEventListener('gamepaddisconnected', this._onDisconnect);
    }
    this._enabled = true;
  }

  /**
   * Detach the connection listeners and clear all held and edge state, so no
   * button stays stuck. Reads return defaults until {@link enable} is called.
   */
  disable(): void {
    if (this._eventTarget) {
      this._eventTarget.removeEventListener('gamepadconnected', this._onConnect);
      this._eventTarget.removeEventListener('gamepaddisconnected', this._onDisconnect);
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

  /** Clear held buttons, both edge sets, and the cached axes and values. */
  clear(): void {
    this._down.clear();
    this._pressed.clear();
    this._released.clear();
    this._axes = [];
    this._buttonValues = [];
  }

  // --------------------------------------------------------------------------
  // Per-frame polling
  // --------------------------------------------------------------------------

  /**
   * Read the live gamepad snapshot and compute the press / release edges. Call
   * once per frame before reading state. The edges stay readable until the next
   * {@link poll}, so {@link wasButtonPressed} is true for exactly one frame.
   *
   * When no pad is present, any held button is released and the state resets,
   * so a disconnect never leaves a button stuck.
   */
  poll(): void {
    this._pressed.clear();
    this._released.clear();

    const pad = this._readActivePad();
    if (!pad) {
      this._releaseAll();
      this._axes = [];
      this._buttonValues = [];
      return;
    }

    const buttons = pad.buttons;
    for (let i = 0; i < buttons.length; i += 1) {
      const pressed = buttons[i]?.pressed ?? false;
      const wasDown = this._down.has(i);
      if (pressed && !wasDown) {
        this._down.add(i);
        this._pressed.add(i);
        this._emit(this._downCallbacks, i, pad);
      } else if (!pressed && wasDown) {
        this._down.delete(i);
        this._released.add(i);
        this._emit(this._upCallbacks, i, pad);
      }
    }
    // A button that vanished from the snapshot counts as released.
    for (const i of [...this._down]) {
      if (i >= buttons.length) {
        this._down.delete(i);
        this._released.add(i);
        this._emit(this._upCallbacks, i, pad);
      }
    }

    this._axes = [...pad.axes];
    this._buttonValues = buttons.map((b) => b?.value ?? 0);
  }

  /**
   * Alias of {@link poll} for render-loop compatibility with
   * {@link KeyboardInput}.
   * @param _dt - Delta time (seconds), accepted but not used.
   */
  update(_dt = 0): void {
    this.poll();
  }

  // --------------------------------------------------------------------------
  // Button reads
  // --------------------------------------------------------------------------

  /**
   * Whether the button is held right now (as of the last {@link poll}).
   * @param button - A button index, or a name (`'A'`, `'dpadUp'`, `'LT'`).
   */
  isButtonDown(button: number | string): boolean {
    const index = resolveButton(button);
    return index >= 0 && this._down.has(index);
  }

  /** Whether any button is held right now. */
  anyButtonDown(): boolean {
    return this._down.size > 0;
  }

  /**
   * Whether the button went down on the last {@link poll}. True for exactly one
   * frame after a 0→1 transition.
   * @param button - A button index or name.
   */
  wasButtonPressed(button: number | string): boolean {
    const index = resolveButton(button);
    return index >= 0 && this._pressed.has(index);
  }

  /**
   * Whether the button came up on the last {@link poll}. True for exactly one
   * frame after a 1→0 transition.
   * @param button - A button index or name.
   */
  wasButtonReleased(button: number | string): boolean {
    const index = resolveButton(button);
    return index >= 0 && this._released.has(index);
  }

  /**
   * The analog value `[0, 1]` of a button (triggers vary; plain buttons read
   * `0` or `1`).
   * @param button - A button index or name.
   */
  getButtonValue(button: number | string): number {
    const index = resolveButton(button);
    if (index < 0) return 0;
    return this._buttonValues[index] ?? 0;
  }

  // --------------------------------------------------------------------------
  // Axis reads
  // --------------------------------------------------------------------------

  /**
   * The raw value `[-1, 1]` of an axis, with the deadzone applied so a resting
   * stick reads `0`. The API convention is used verbatim: for the vertical
   * stick axes, up is negative.
   * @param index - The axis index (see {@link STANDARD_AXES}).
   * @param deadzone - Override the instance deadzone for this read.
   */
  getAxis(index: number, deadzone: number = this._deadzone): number {
    return this._applyDeadzone(this._axes[index] ?? 0, deadzone);
  }

  /**
   * The left stick as `[x, y]`, deadzone applied, with up as `+y` (the API's
   * downward vertical axis is flipped to match {@link KeyboardInput}).
   */
  getLeftStick(): [number, number] {
    // Subtract from 0 (not unary minus) so a zero axis stays +0, never -0.
    return [this.getAxis(STANDARD_AXES.leftX), 0 - this.getAxis(STANDARD_AXES.leftY)];
  }

  /** The right stick as `[x, y]`, deadzone applied, with up as `+y`. */
  getRightStick(): [number, number] {
    return [this.getAxis(STANDARD_AXES.rightX), 0 - this.getAxis(STANDARD_AXES.rightY)];
  }

  /**
   * A normalized movement direction `[x, y]`, up is `+y`. The d-pad wins when
   * any d-pad button is held; otherwise the left stick is used. A neutral input
   * stays `[0, 0]`.
   */
  getDirectionVector(): [number, number] {
    const dpadX =
      (this.isButtonDown('dpadRight') ? 1 : 0) - (this.isButtonDown('dpadLeft') ? 1 : 0);
    const dpadY = (this.isButtonDown('dpadUp') ? 1 : 0) - (this.isButtonDown('dpadDown') ? 1 : 0);
    if (dpadX !== 0 || dpadY !== 0) return normalize(dpadX, dpadY);

    const [sx, sy] = this.getLeftStick();
    return normalize(sx, sy);
  }

  // --------------------------------------------------------------------------
  // Connection introspection
  // --------------------------------------------------------------------------

  /** The connected pads in the current snapshot (empty when headless). */
  getConnectedGamepads(): GamepadLike[] {
    if (!this._getGamepads) return [];
    try {
      return [...this._getGamepads()].filter(
        (pad): pad is GamepadLike => pad != null && (pad.connected ?? true),
      );
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Event callbacks
  // --------------------------------------------------------------------------

  /**
   * Register a button-down callback, fired by {@link poll} on a 0→1 edge.
   * @param button - A button index or name, or `'any'` for every button.
   * @param callback - Called with the button index and the pad.
   * @returns An unsubscribe function.
   */
  onButtonDown(button: number | string, callback: GamepadButtonCallback): Unsubscribe {
    return this._addCallback(this._downCallbacks, button, callback);
  }

  /**
   * Register a button-up callback, fired by {@link poll} on a 1→0 edge.
   * @param button - A button index or name, or `'any'` for every button.
   * @param callback - Called with the button index and the pad.
   * @returns An unsubscribe function.
   */
  onButtonUp(button: number | string, callback: GamepadButtonCallback): Unsubscribe {
    return this._addCallback(this._upCallbacks, button, callback);
  }

  // --------------------------------------------------------------------------
  // StateMachine / ValueTracker bindings
  // --------------------------------------------------------------------------

  /**
   * Hold a `StateMachine` bool input to match a button: `true` while held,
   * `false` on release.
   * @param machine - The `StateMachine` (or any {@link StateMachineInputSink}).
   * @param inputName - The bool input name.
   * @param button - The button to track.
   * @returns An unsubscribe function.
   */
  bindBool(
    machine: StateMachineInputSink,
    inputName: string,
    button: number | string,
  ): Unsubscribe {
    const stopDown = this.onButtonDown(button, () => machine.setInput(inputName, true));
    const stopUp = this.onButtonUp(button, () => machine.setInput(inputName, false));
    return () => {
      stopDown();
      stopUp();
    };
  }

  /**
   * Fire a `StateMachine` trigger input on each button-down.
   * @param machine - The `StateMachine` (or any {@link StateMachineInputSink}).
   * @param triggerName - The trigger input name.
   * @param button - The button to track.
   * @returns An unsubscribe function.
   */
  bindTrigger(
    machine: StateMachineInputSink,
    triggerName: string,
    button: number | string,
  ): Unsubscribe {
    return this.onButtonDown(button, () => machine.fire(triggerName));
  }

  /**
   * Drive a `ValueTracker` from a button: `heldValue` while held,
   * `releasedValue` on release.
   * @param tracker - The `ValueTracker` (or any {@link ValueSink}).
   * @param button - The button to track.
   * @param options - The held and released values.
   * @returns An unsubscribe function.
   */
  bindValue(tracker: ValueSink, button: number | string, options: BindValueOptions): Unsubscribe {
    const released = options.releasedValue ?? 0;
    const stopDown = this.onButtonDown(button, () => tracker.setValue(options.heldValue));
    const stopUp = this.onButtonUp(button, () => tracker.setValue(released));
    return () => {
      stopDown();
      stopUp();
    };
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Read the active pad from the snapshot, honoring the `gamepadIndex` option. */
  private _readActivePad(): GamepadLike | null {
    if (!this._getGamepads) return null;
    let pads: ReadonlyArray<GamepadLike | null>;
    try {
      pads = this._getGamepads() ?? [];
    } catch {
      return null;
    }
    if (this._gamepadIndex != null) return pads[this._gamepadIndex] ?? null;
    for (const pad of pads) {
      if (pad && (pad.connected ?? true)) return pad;
    }
    return null;
  }

  /** Release every held button, emitting up callbacks, on a disconnect. */
  private _releaseAll(): void {
    if (this._down.size === 0) return;
    for (const index of [...this._down]) {
      this._released.add(index);
      this._emit(this._upCallbacks, index, null);
    }
    this._down.clear();
  }

  /** Apply the deadzone: magnitudes below `deadzone` read as `0`. */
  private _applyDeadzone(value: number, deadzone: number): number {
    return Math.abs(value) < deadzone ? 0 : value;
  }

  private _addCallback(
    registry: Map<number | 'any', Set<GamepadButtonCallback>>,
    button: number | string,
    callback: GamepadButtonCallback,
  ): Unsubscribe {
    const key = this._callbackKey(button);
    const set = registry.get(key) ?? new Set<GamepadButtonCallback>();
    set.add(callback);
    registry.set(key, set);
    return () => {
      set.delete(callback);
      if (set.size === 0) registry.delete(key);
    };
  }

  /** Resolve a callback registration key, warning on an unknown button name. */
  private _callbackKey(button: number | string): number | 'any' {
    if (button === 'any') return 'any';
    const index = resolveButton(button);
    if (index < 0) {
      logger.warn(`[manim-web] GamepadInput: unknown button "${String(button)}".`);
    }
    return index;
  }

  private _emit(
    registry: Map<number | 'any', Set<GamepadButtonCallback>>,
    button: number,
    pad: GamepadLike | null,
  ): void {
    registry.get(button)?.forEach((cb) => cb(button, pad));
    registry.get('any')?.forEach((cb) => cb(button, pad));
  }

  /** Log a connected pad. The snapshot is still read fresh each {@link poll}. */
  private _handleConnect(event: Event): void {
    const gamepadEvent: Partial<GamepadEvent> = event;
    const pad = gamepadEvent.gamepad;
    logger.info(`[manim-web] GamepadInput: gamepad connected (index ${pad?.index ?? '?'}).`);
  }

  /** Log a disconnected pad. {@link poll} releases its held buttons. */
  private _handleDisconnect(event: Event): void {
    const gamepadEvent: Partial<GamepadEvent> = event;
    const pad = gamepadEvent.gamepad;
    logger.info(`[manim-web] GamepadInput: gamepad disconnected (index ${pad?.index ?? '?'}).`);
  }
}

/** Normalize a 2D vector to unit length; a zero vector stays `[0, 0]`. */
function normalize(x: number, y: number): [number, number] {
  const length = Math.hypot(x, y);
  if (length === 0) return [0, 0];
  return [x / length, y / length];
}

/**
 * Factory for a {@link GamepadInput}.
 * @param options - Behavior options.
 * @param getGamepads - Snapshot source.
 * @param eventTarget - Target for connection events.
 * @returns A new GamepadInput.
 */
export function makeGamepadInput(
  options?: GamepadInputOptions,
  getGamepads?: GamepadSource | null,
  eventTarget?: EventTarget | null,
): GamepadInput {
  return new GamepadInput(options, getGamepads, eventTarget);
}
