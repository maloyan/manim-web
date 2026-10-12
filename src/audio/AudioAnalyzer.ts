/**
 * AudioAnalyzer - Audio-reactive animation driver for manim-web.
 *
 * Wraps a Web Audio `AnalyserNode` over an audio source (an `<audio>` /
 * media element, any `AudioNode`, or the existing {@link AudioManager}
 * output) and exposes frequency-spectrum reads. These reads drive mobject
 * properties each frame through the standard updater system, so an animation
 * can react to music or any live audio.
 *
 * This is impossible in file-based ManimCE and is browser-unique.
 *
 * Every Web Audio and DOM access is feature-detected. In Node, jsdom, or SSR
 * the class degrades to a no-op: reads return zeros and nothing throws.
 *
 * @example
 * ```ts
 * const audio = new AudioElement... // an <audio> element playing music
 * const analyzer = AudioAnalyzer.fromMediaElement(audioEl);
 *
 * const bass = new ValueTracker(0);
 * analyzer.bindToTracker(bass, () => analyzer.getBass(), { scale: 2 });
 *
 * const dot = new Dot();
 * dot.addUpdater((d) => d.setScale(1 + bass.getValue()));
 * ```
 */

import { logger } from '../utils/logger';
import type { Mobject, UpdaterFunction } from '../core/Mobject';
import type { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import type { AudioManager } from '../core/AudioManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default FFT size (power of two). Yields 1024 frequency bins. */
const DEFAULT_FFT_SIZE = 2048;
/** Default smoothing between consecutive analysis frames [0, 1]. */
const DEFAULT_SMOOTHING = 0.8;
/** Maximum byte value of a frequency or time-domain sample. */
const BYTE_MAX = 255;
/** Center value of an 8-bit time-domain sample (silence). */
const BYTE_CENTER = 128;

/** Default band edges in Hz for the bass / mid / treble helpers. */
const BASS_LOW_HZ = 20;
const BASS_HIGH_HZ = 250;
const MID_HIGH_HZ = 4000;
const TREBLE_HIGH_HZ = 20000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The subset of `AnalyserNode` the analyzer reads from.
 *
 * A real `AnalyserNode` satisfies this interface. Tests inject a stub that
 * implements only these members, so no real `AudioContext` is required.
 */
export interface SpectrumAnalyser {
  /** FFT window size (power of two). */
  readonly fftSize: number;
  /** Number of frequency bins (`fftSize / 2`). */
  readonly frequencyBinCount: number;
  /** The owning context; only its sample rate is read. */
  readonly context: Pick<BaseAudioContext, 'sampleRate'>;
  /** Fill `array` with the current byte frequency spectrum. */
  getByteFrequencyData(array: Uint8Array): void;
  /** Fill `array` with the current byte time-domain waveform. */
  getByteTimeDomainData(array: Uint8Array): void;
}

/** Options for constructing an {@link AudioAnalyzer}. */
export interface AudioAnalyzerOptions {
  /** FFT window size (power of two, 32..32768). Defaults to 2048. */
  fftSize?: number;
  /** Smoothing between frames [0, 1]. Defaults to 0.8. */
  smoothingTimeConstant?: number;
  /** Pre-built analyser to read from (dependency injection / testing). */
  analyser?: SpectrumAnalyser;
}

/** Options for mapping an audio read onto a {@link ValueTracker} value. */
export interface AudioReactiveBindOptions {
  /** Multiplier applied to the raw read. Defaults to 1. */
  scale?: number;
  /** Constant added after scaling. Defaults to 0. */
  offset?: number;
}

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

/**
 * Resolve the `AudioContext` constructor for this environment.
 * Returns `null` in Node, jsdom, and SSR so callers degrade without throwing.
 */
function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  if (typeof window !== 'undefined' && 'webkitAudioContext' in window) {
    return (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  }
  return null;
}

/** Whether the Web Audio analysis API is available in this environment. */
export function isAudioAnalysisSupported(): boolean {
  return getAudioContextCtor() !== null;
}

/** Clamp `value` to the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// AudioAnalyzer
// ---------------------------------------------------------------------------

/**
 * Reads a live frequency spectrum and feeds it into manim-web animations.
 */
export class AudioAnalyzer {
  private _analyser: SpectrumAnalyser | null = null;
  private readonly _fftSize: number;
  private readonly _smoothing: number;
  private _freqBuffer: Uint8Array;
  private _timeBuffer: Uint8Array;
  /** Context this analyzer created itself (closed on {@link dispose}). */
  private _ownedContext: AudioContext | null = null;

  constructor(options: AudioAnalyzerOptions = {}) {
    this._fftSize = options.fftSize ?? DEFAULT_FFT_SIZE;
    this._smoothing = clamp(options.smoothingTimeConstant ?? DEFAULT_SMOOTHING, 0, 1);
    this._freqBuffer = new Uint8Array(Math.max(1, Math.floor(this._fftSize / 2)));
    this._timeBuffer = new Uint8Array(this._fftSize);
    if (options.analyser) this._setAnalyser(options.analyser);
  }

  // --------------------------------------------------------------------------
  // Factories
  // --------------------------------------------------------------------------

  /**
   * Create an analyzer tapping an `<audio>` / `<video>` element.
   * The element stays audible (the analyser is wired to the destination).
   * No-op (silent, returns zeros) when Web Audio is unavailable.
   */
  static fromMediaElement(
    element: HTMLMediaElement,
    options?: AudioAnalyzerOptions,
  ): AudioAnalyzer {
    return new AudioAnalyzer(options).connectMediaElement(element);
  }

  /**
   * Create an analyzer tapping the master output of an {@link AudioManager}.
   * No-op (silent, returns zeros) when Web Audio is unavailable.
   */
  static fromAudioManager(manager: AudioManager, options?: AudioAnalyzerOptions): AudioAnalyzer {
    const analyzer = new AudioAnalyzer(options);
    if (!isAudioAnalysisSupported()) {
      logger.warn('AudioAnalyzer: Web Audio API unavailable; AudioManager not tapped.');
      return analyzer;
    }
    const analyser = analyzer._createAnalyser(manager.context);
    manager.connectOutput(analyser);
    analyzer._setAnalyser(analyser);
    return analyzer;
  }

  // --------------------------------------------------------------------------
  // Connection
  // --------------------------------------------------------------------------

  /**
   * Tap an `<audio>` / `<video>` element. Creates an owned `AudioContext`.
   * @returns this for chaining
   */
  connectMediaElement(element: HTMLMediaElement): this {
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      logger.warn('AudioAnalyzer: Web Audio API unavailable; media element not connected.');
      return this;
    }
    const ctx = new Ctor();
    this._ownedContext = ctx;
    const source = ctx.createMediaElementSource(element);
    const analyser = this._createAnalyser(ctx);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    this._setAnalyser(analyser);
    return this;
  }

  /**
   * Tap an existing `AudioNode` (for example a `BufferSource` or `GainNode`).
   * The node's own `AudioContext` is used; no new context is created.
   * @returns this for chaining
   */
  connectSource(node: AudioNode): this {
    const analyser = this._createAnalyser(node.context);
    node.connect(analyser);
    this._setAnalyser(analyser);
    return this;
  }

  // --------------------------------------------------------------------------
  // Spectrum reads
  // --------------------------------------------------------------------------

  /**
   * Fill `target` (or an internal buffer) with the byte frequency spectrum.
   * Returns a zero-filled buffer when no analyser is connected.
   * @returns The buffer that was written
   */
  getByteFrequencyData(target?: Uint8Array): Uint8Array {
    if (this._analyser) {
      this._analyser.getByteFrequencyData(this._freqBuffer);
    } else {
      this._freqBuffer.fill(0);
    }
    if (target) {
      target.set(this._freqBuffer.subarray(0, target.length));
      return target;
    }
    return this._freqBuffer;
  }

  /** Alias of {@link getByteFrequencyData} that returns the internal buffer. */
  getFrequencyData(): Uint8Array {
    return this.getByteFrequencyData();
  }

  /**
   * Average the normalized energy [0, 1] across the band `[lowHz, highHz]`.
   * Returns 0 when no analyser is connected or the band is empty.
   */
  getBand(lowHz: number, highHz: number): number {
    if (!this._analyser) return 0;
    this._analyser.getByteFrequencyData(this._freqBuffer);
    const bins = this._freqBuffer.length;
    const binWidth = this._analyser.context.sampleRate / this._analyser.fftSize;
    if (binWidth <= 0) return 0;
    const lo = clamp(Math.floor(lowHz / binWidth), 0, bins - 1);
    const hi = clamp(Math.ceil(highHz / binWidth), 0, bins - 1);
    if (hi < lo) return 0;
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += this._freqBuffer[i];
    return sum / (hi - lo + 1) / BYTE_MAX;
  }

  /** Normalized bass energy [0, 1] (20-250 Hz). */
  getBass(): number {
    return this.getBand(BASS_LOW_HZ, BASS_HIGH_HZ);
  }

  /** Normalized mid energy [0, 1] (250-4000 Hz). */
  getMid(): number {
    return this.getBand(BASS_HIGH_HZ, MID_HIGH_HZ);
  }

  /** Normalized treble energy [0, 1] (4000-20000 Hz). */
  getTreble(): number {
    return this.getBand(MID_HIGH_HZ, TREBLE_HIGH_HZ);
  }

  /**
   * Overall loudness as the RMS [0, 1] of the time-domain waveform.
   * Returns 0 when no analyser is connected.
   */
  getLevel(): number {
    if (!this._analyser) return 0;
    this._analyser.getByteTimeDomainData(this._timeBuffer);
    const length = this._timeBuffer.length;
    if (length === 0) return 0;
    let sumSquares = 0;
    for (let i = 0; i < length; i++) {
      const sample = (this._timeBuffer[i] - BYTE_CENTER) / BYTE_CENTER;
      sumSquares += sample * sample;
    }
    return Math.sqrt(sumSquares / length);
  }

  // --------------------------------------------------------------------------
  // Animation bindings
  // --------------------------------------------------------------------------

  /**
   * Drive a {@link ValueTracker} from an audio read each frame.
   *
   * Adds an updater to the tracker that sets its value to
   * `offset + read() * scale` on every `update(dt)`. Other mobjects follow the
   * tracker through their own updaters.
   *
   * @param tracker - The tracker to drive
   * @param read - Audio read to sample (defaults to {@link getLevel})
   * @param options - Scale and offset applied to the read
   * @returns The updater, so it can be removed with `tracker.removeUpdater`
   */
  bindToTracker(
    tracker: ValueTracker,
    read: () => number = () => this.getLevel(),
    options: AudioReactiveBindOptions = {},
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
   * Build an updater that maps the spectrum onto any mobject property.
   *
   * The returned updater passes the mobject, this analyzer, and `dt` to
   * `apply`, so `apply` can read bands and set any property. Add it with
   * `mobject.addUpdater(analyzer.createUpdater(...))`.
   */
  createUpdater<M extends Mobject>(
    apply: (mobject: M, analyzer: AudioAnalyzer, dt: number) => void,
  ): UpdaterFunction {
    return (mobject: Mobject, dt: number) => apply(mobject as M, this, dt);
  }

  // --------------------------------------------------------------------------
  // Introspection / lifecycle
  // --------------------------------------------------------------------------

  /** Whether an analyser is connected (reads return live data). */
  get connected(): boolean {
    return this._analyser !== null;
  }

  /** The number of frequency bins the spectrum reads produce. */
  get frequencyBinCount(): number {
    return this._analyser ? this._analyser.frequencyBinCount : this._freqBuffer.length;
  }

  /** The connected analyser, or `null` when unavailable. */
  get analyser(): SpectrumAnalyser | null {
    return this._analyser;
  }

  /** Release the owned `AudioContext`, if this analyzer created one. */
  dispose(): void {
    if (this._ownedContext && this._ownedContext.state !== 'closed') {
      this._ownedContext.close();
    }
    this._ownedContext = null;
    this._analyser = null;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Create and configure a real `AnalyserNode` on `ctx`. */
  private _createAnalyser(ctx: BaseAudioContext): AnalyserNode {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = this._fftSize;
    analyser.smoothingTimeConstant = this._smoothing;
    return analyser;
  }

  /** Adopt an analyser and resize the read buffers to match it. */
  private _setAnalyser(analyser: SpectrumAnalyser): void {
    this._analyser = analyser;
    if (this._freqBuffer.length !== analyser.frequencyBinCount) {
      this._freqBuffer = new Uint8Array(analyser.frequencyBinCount);
    }
    if (this._timeBuffer.length !== analyser.fftSize) {
      this._timeBuffer = new Uint8Array(analyser.fftSize);
    }
  }
}
