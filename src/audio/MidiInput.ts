/**
 * MidiInput - Web MIDI input driver for manim-web.
 *
 * Wraps `navigator.requestMIDIAccess()` so a MIDI keyboard or controller can
 * drive mobject properties and {@link ValueTracker}s each frame. The driver
 * parses raw MIDI status bytes (note-on, note-off, control change, pitch bend)
 * and keeps the latest state, which the updater system reads every frame. An
 * animation can therefore react to a live performance.
 *
 * This is impossible in file-based ManimCE and is browser-unique. It mirrors
 * {@link AudioAnalyzer}: the same feature-detection, the same `bindToTracker` /
 * `createUpdater` bindings, and the same degrade-to-no-op contract.
 *
 * Every Web MIDI and DOM access is feature-detected. In Node, jsdom, or SSR the
 * class degrades to a no-op: reads return zeros or null and nothing throws.
 *
 * @example
 * ```ts
 * const midi = new MidiInput();
 * await midi.connect();
 *
 * const level = new ValueTracker(0);
 * // Mod wheel (CC 1) drives the tracker.
 * midi.bindToTracker(level, () => midi.getControl(1));
 *
 * const dot = new Dot();
 * dot.addUpdater((d) => d.setScale(1 + level.getValue()));
 * ```
 */

import { logger } from '../utils/logger';
import type { Mobject, UpdaterFunction } from '../core/Mobject';
import type { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** High-nibble mask that isolates a MIDI status (drops the channel). */
const STATUS_MASK = 0xf0;
/** Status for a note-on message (`0x90`). */
const STATUS_NOTE_ON = 0x90;
/** Status for a note-off message (`0x80`). */
const STATUS_NOTE_OFF = 0x80;
/** Status for a control-change message (`0xB0`). */
const STATUS_CONTROL_CHANGE = 0xb0;
/** Status for a pitch-bend message (`0xE0`). */
const STATUS_PITCH_BEND = 0xe0;

/** Maximum 7-bit MIDI data value (velocity, controller value). */
const MIDI_DATA_MAX = 127;
/** Shift that moves the pitch-bend most-significant byte into place. */
const PITCH_MSB_SHIFT = 7;
/** Low 7-bit mask applied to each pitch-bend data byte. */
const SEVEN_BIT_MASK = 0x7f;
/** Center of the 14-bit pitch-bend range (no bend). */
const PITCH_BEND_CENTER = 8192;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single MIDI message as delivered to a listener. Only `data` is read.
 *
 * A real `MIDIMessageEvent` satisfies this interface. Tests inject a stub that
 * implements only `data`, so no real `MIDIAccess` is required.
 */
export interface MidiMessageLike {
  /** The raw MIDI data bytes, or `null` for an empty message. */
  readonly data: Uint8Array | null;
}

/**
 * The subset of a `MIDIInput` port the driver uses: a settable message handler
 * and an optional device name.
 */
export interface MidiInputLike {
  /** Handler invoked for each incoming MIDI message, or `null` to detach. */
  onmidimessage: ((event: MidiMessageLike) => void) | null;
  /** The device name, when the port exposes one. */
  readonly name?: string | null;
}

/**
 * The subset of a `MIDIAccess` the driver uses: the input ports and an optional
 * device-change hook. The real `MIDIAccess` is adapted onto this shape, and
 * tests inject a fake that implements it directly.
 */
export interface MidiAccessLike {
  /** The available MIDI input ports. */
  readonly inputs: Iterable<MidiInputLike>;
  /** Handler invoked when a device connects or disconnects, or `null`. */
  onstatechange?: (() => void) | null;
}

/** Options for constructing a {@link MidiInput}. */
export interface MidiInputOptions {
  /** Pre-resolved MIDI access to bind immediately (dependency injection). */
  access?: MidiAccessLike;
}

/** Options for {@link MidiInput.connect}. */
export interface MidiConnectOptions {
  /** Pre-resolved MIDI access to bind instead of calling the browser. */
  access?: MidiAccessLike;
  /** Request system-exclusive access. Defaults to `false`. */
  sysex?: boolean;
}

/** Options for mapping a MIDI read onto a {@link ValueTracker} value. */
export interface MidiBindOptions {
  /** Multiplier applied to the raw read. Defaults to 1. */
  scale?: number;
  /** Constant added after scaling. Defaults to 0. */
  offset?: number;
}

/** Listener for note-on events. `velocity` is normalized to `[0, 1]`. */
export type MidiNoteListener = (note: number, velocity: number) => void;
/** Listener for note-off events. */
export type MidiNoteOffListener = (note: number) => void;
/** Listener for control-change events. `value` is normalized to `[0, 1]`. */
export type MidiControlListener = (controller: number, value: number) => void;

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

/** Signature of `navigator.requestMIDIAccess`, bound to the navigator. */
type RequestMidiAccess = (options?: MIDIOptions) => Promise<MIDIAccess>;

/**
 * Resolve `navigator.requestMIDIAccess` for this environment.
 * Returns `null` in Node, jsdom, and SSR so callers degrade without throwing.
 */
function getRequestMidiAccess(): RequestMidiAccess | null {
  if (typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function') {
    return navigator.requestMIDIAccess.bind(navigator);
  }
  return null;
}

/** Whether the Web MIDI API is available in this environment. */
export function isMidiSupported(): boolean {
  return getRequestMidiAccess() !== null;
}

/** Clamp `value` to the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Adapt a real `MIDIAccess` onto the {@link MidiAccessLike} shape the driver
 * binds to. Each real input is wrapped so a handler assignment forwards to the
 * device, and the real `data` bytes reach the driver unchanged.
 */
function adaptMidiAccess(access: MIDIAccess): MidiAccessLike {
  const inputs: MidiInputLike[] = [];
  access.inputs.forEach((input: MIDIInput) => {
    let handler: ((event: MidiMessageLike) => void) | null = null;
    inputs.push({
      get name(): string | null {
        return input.name;
      },
      get onmidimessage(): ((event: MidiMessageLike) => void) | null {
        return handler;
      },
      set onmidimessage(next: ((event: MidiMessageLike) => void) | null) {
        handler = next;
        input.onmidimessage = next ? (ev: MIDIMessageEvent): void => next({ data: ev.data }) : null;
      },
    });
  });
  let stateChange: (() => void) | null = null;
  return {
    inputs,
    get onstatechange(): (() => void) | null {
      return stateChange;
    },
    set onstatechange(next: (() => void) | null) {
      stateChange = next;
      access.onstatechange = next ? (): void => next() : null;
    },
  };
}

// ---------------------------------------------------------------------------
// MidiInput
// ---------------------------------------------------------------------------

/**
 * Reads live MIDI input and feeds it into manim-web animations.
 */
export class MidiInput {
  private _access: MidiAccessLike | null = null;
  /** Latest velocity `[0, 1]` per note number; absence means the note is off. */
  private readonly _notes = new Map<number, number>();
  /** Latest value `[0, 1]` per control-change (CC) number. */
  private readonly _controls = new Map<number, number>();
  /** Latest pitch-bend value in `[-1, 1]` (0 = centered). */
  private _pitchBend = 0;
  /** Names of the currently attached input ports. */
  private _inputNames: string[] = [];

  private readonly _noteOnListeners = new Set<MidiNoteListener>();
  private readonly _noteOffListeners = new Set<MidiNoteOffListener>();
  private readonly _controlListeners = new Set<MidiControlListener>();

  constructor(options: MidiInputOptions = {}) {
    if (options.access) this._bind(options.access);
  }

  // --------------------------------------------------------------------------
  // Connection
  // --------------------------------------------------------------------------

  /**
   * Request MIDI access and attach to every input port.
   *
   * Uses an injected access when one is given (constructor or `options`);
   * otherwise calls `navigator.requestMIDIAccess()`. A no-op that resolves to
   * `this` when the Web MIDI API is unavailable.
   *
   * @returns this (resolved) for chaining
   */
  async connect(options: MidiConnectOptions = {}): Promise<this> {
    const injected = options.access ?? this._access;
    if (injected) {
      this._bind(injected);
      return this;
    }
    const request = getRequestMidiAccess();
    if (!request) {
      logger.warn('MidiInput: Web MIDI API unavailable; no device connected.');
      return this;
    }
    const access = await request({ sysex: options.sysex ?? false });
    this._bind(adaptMidiAccess(access));
    return this;
  }

  /** The names of the attached input ports (empty when disconnected). */
  getInputNames(): string[] {
    return [...this._inputNames];
  }

  // --------------------------------------------------------------------------
  // State reads
  // --------------------------------------------------------------------------

  /**
   * The latest velocity `[0, 1]` of a note, or `null` when the note is off.
   * @param note - MIDI note number (0..127)
   */
  getNote(note: number): number | null {
    const velocity = this._notes.get(note);
    return velocity === undefined ? null : velocity;
  }

  /**
   * Whether a note is currently held down.
   * @param note - MIDI note number (0..127)
   */
  isNoteOn(note: number): boolean {
    return this._notes.has(note);
  }

  /**
   * The latest value `[0, 1]` of a control-change (CC) number.
   * Returns 0 when the controller has not been seen.
   * @param controller - MIDI CC number (0..127)
   */
  getControl(controller: number): number {
    return this._controls.get(controller) ?? 0;
  }

  /** The latest pitch-bend value in `[-1, 1]` (0 = centered). */
  getPitchBend(): number {
    return this._pitchBend;
  }

  // --------------------------------------------------------------------------
  // Event callbacks
  // --------------------------------------------------------------------------

  /**
   * Register a note-on listener.
   * @returns An unsubscribe function that removes the listener.
   */
  onNoteOn(listener: MidiNoteListener): () => void {
    this._noteOnListeners.add(listener);
    return () => this._noteOnListeners.delete(listener);
  }

  /**
   * Register a note-off listener.
   * @returns An unsubscribe function that removes the listener.
   */
  onNoteOff(listener: MidiNoteOffListener): () => void {
    this._noteOffListeners.add(listener);
    return () => this._noteOffListeners.delete(listener);
  }

  /**
   * Register a control-change listener.
   * @returns An unsubscribe function that removes the listener.
   */
  onControlChange(listener: MidiControlListener): () => void {
    this._controlListeners.add(listener);
    return () => this._controlListeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // Animation bindings
  // --------------------------------------------------------------------------

  /**
   * Drive a {@link ValueTracker} from a MIDI read each frame.
   *
   * Adds an updater to the tracker that sets its value to
   * `offset + read() * scale` on every `update(dt)`. Other mobjects follow the
   * tracker through their own updaters.
   *
   * @param tracker - The tracker to drive
   * @param read - MIDI read to sample (defaults to {@link getPitchBend})
   * @param options - Scale and offset applied to the read
   * @returns The updater, so it can be removed with `tracker.removeUpdater`
   */
  bindToTracker(
    tracker: ValueTracker,
    read: () => number = () => this.getPitchBend(),
    options: MidiBindOptions = {},
  ): UpdaterFunction {
    const scale = options.scale ?? 1;
    const offset = options.offset ?? 0;
    const updater: UpdaterFunction = () => {
      tracker.setValue(offset + read() * scale);
    };
    tracker.addUpdater(updater);
    return updater;
  }

  /**
   * Build an updater that maps the MIDI state onto any mobject property.
   *
   * The returned updater passes the mobject, this driver, and `dt` to `apply`,
   * so `apply` can read notes or controls and set any property. Add it with
   * `mobject.addUpdater(midi.createUpdater(...))`.
   */
  createUpdater<M extends Mobject>(
    apply: (mobject: M, midi: MidiInput, dt: number) => void,
  ): UpdaterFunction {
    return (mobject: Mobject, dt: number) => apply(mobject as M, this, dt);
  }

  // --------------------------------------------------------------------------
  // Introspection / lifecycle
  // --------------------------------------------------------------------------

  /** Whether an access is bound (reads reflect live input). */
  get connected(): boolean {
    return this._access !== null;
  }

  /** Detach from every input port and reset the state. */
  dispose(): void {
    if (this._access) {
      for (const input of this._access.inputs) input.onmidimessage = null;
      if ('onstatechange' in this._access) this._access.onstatechange = null;
    }
    this._access = null;
    this._inputNames = [];
    this._notes.clear();
    this._controls.clear();
    this._pitchBend = 0;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Adopt an access, attach to its inputs, and follow device changes. */
  private _bind(access: MidiAccessLike): void {
    this._access = access;
    this._attachInputs(access);
    if ('onstatechange' in access) {
      access.onstatechange = () => this._attachInputs(access);
    }
  }

  /** Route every input's messages into {@link _handleMessage}. */
  private _attachInputs(access: MidiAccessLike): void {
    const names: string[] = [];
    for (const input of access.inputs) {
      input.onmidimessage = (event: MidiMessageLike): void => this._handleMessage(event.data);
      if (input.name != null) names.push(input.name);
    }
    this._inputNames = names;
  }

  /** Parse one raw MIDI message and update the state plus listeners. */
  private _handleMessage(data: Uint8Array | null): void {
    if (!data || data.length < 1) return;
    const status = data[0] & STATUS_MASK;
    if (status === STATUS_NOTE_ON) {
      if (data.length < 3) return;
      // A note-on with zero velocity is a note-off by convention.
      if (data[2] === 0) this._noteOff(data[1]);
      else this._noteOn(data[1], data[2] / MIDI_DATA_MAX);
    } else if (status === STATUS_NOTE_OFF) {
      if (data.length < 2) return;
      this._noteOff(data[1]);
    } else if (status === STATUS_CONTROL_CHANGE) {
      if (data.length < 3) return;
      const value = data[2] / MIDI_DATA_MAX;
      this._controls.set(data[1], value);
      for (const listener of this._controlListeners) listener(data[1], value);
    } else if (status === STATUS_PITCH_BEND) {
      if (data.length < 3) return;
      const raw = ((data[2] & SEVEN_BIT_MASK) << PITCH_MSB_SHIFT) | (data[1] & SEVEN_BIT_MASK);
      this._pitchBend = clamp((raw - PITCH_BEND_CENTER) / PITCH_BEND_CENTER, -1, 1);
    }
  }

  /** Record a held note and notify note-on listeners. */
  private _noteOn(note: number, velocity: number): void {
    this._notes.set(note, velocity);
    for (const listener of this._noteOnListeners) listener(note, velocity);
  }

  /** Release a note and notify note-off listeners. */
  private _noteOff(note: number): void {
    this._notes.delete(note);
    for (const listener of this._noteOffListeners) listener(note);
  }
}
