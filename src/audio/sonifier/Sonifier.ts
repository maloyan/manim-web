/**
 * Sonifier - map a data series to sound with the Web Audio API.
 *
 * `play` schedules a series as stepped pitch (and optional gain and pan) on
 * one oscillator. `bindToTracker` makes a live {@link ValueTracker} value
 * drive the pitch every frame, so sound follows an animation.
 *
 * v1 is browser playback only. Muxing the audio into exported video is not
 * supported yet.
 *
 * Every Web Audio access is feature-detected. In Node, jsdom, or SSR the
 * class is a no-op and never throws at import or construct time.
 *
 * @example
 * ```ts
 * const sonifier = new Sonifier({ minFrequency: 220, maxFrequency: 880 });
 * sonifier.play(lorenzX, { totalDuration: 8 });
 *
 * const t = new ValueTracker(0);
 * sonifier.bindToTracker(t, { domain: [0, 10] });
 * ```
 */

import type { UpdaterFunction } from '../../core/Mobject';
import type { ValueTracker } from '../../mobjects/value-tracker/ValueTracker';
import {
  dataDomain,
  dataToFrequency,
  dataToGain,
  dataToPan,
  type DataDomain,
  type SonifierScale,
} from './mapping';

/** Oscillator waveform. */
export type SonifierWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** Default seconds per sample when no duration is given. */
const DEFAULT_STEP_SECONDS = 0.1;
/** Default constant gain, low enough to avoid clipping and loud surprises. */
const DEFAULT_GAIN = 0.2;
/** Time constant (seconds) for smoothing live pitch changes. */
const LIVE_SMOOTHING = 0.02;

interface ParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  setTargetAtTime(value: number, time: number, timeConstant: number): unknown;
}

interface NodeLike {
  connect(destination: unknown): unknown;
  disconnect(): void;
}

type OscillatorLike = NodeLike & {
  type: string;
  frequency: ParamLike;
  start(when?: number): void;
  stop(when?: number): void;
};
type GainLike = NodeLike & { gain: ParamLike };
type PannerLike = NodeLike & { pan: ParamLike };

/**
 * The subset of `AudioContext` the Sonifier uses. A real `AudioContext`
 * satisfies it. Tests inject a stub, so no real audio is needed.
 */
export interface SonifierContextLike {
  readonly currentTime: number;
  readonly state?: string;
  readonly destination: unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  createStereoPanner?(): PannerLike;
  resume?(): unknown;
  close?(): unknown;
}

/** Options shared by the Sonifier constructor, `play`, and `bindToTracker`. */
export interface SonifierMappingOptions {
  /** Data range mapped onto the sound range. `play` defaults to the series min and max. */
  domain?: DataDomain;
  /** Lowest frequency in Hz. Defaults to 220. */
  minFrequency?: number;
  /** Highest frequency in Hz. Defaults to 880. */
  maxFrequency?: number;
  /** Frequency scale. Defaults to `linear`. */
  scale?: SonifierScale;
  /** Oscillator waveform. Defaults to `sine`. */
  waveform?: SonifierWaveform;
  /** Constant gain in `[0, 1]`. Defaults to 0.2. Ignored when `gainRange` is set. */
  gain?: number;
  /** When set, the data value also drives gain across `[minGain, maxGain]`. */
  gainRange?: [number, number];
  /** When true, the data value also drives stereo pan from left to right. */
  pan?: boolean;
}

/** Constructor options. */
export interface SonifierOptions extends SonifierMappingOptions {
  /** Inject a context (testing, or to share one). Otherwise one is created lazily. */
  context?: SonifierContextLike;
}

/** Options for {@link Sonifier.play}. */
export interface SonifierPlayOptions extends SonifierMappingOptions {
  /** Seconds per sample. Defaults to 0.1. Ignored when `totalDuration` is set. */
  durationPerStep?: number;
  /** Total seconds for the whole series. Overrides `durationPerStep`. */
  totalDuration?: number;
}

/** Handle for a playing sonification. */
export interface SonifierPlayback {
  /** Total length in seconds. */
  readonly duration: number;
  /** Stop playback now. Safe to call more than once. */
  stop(): void;
}

/** Handle for a tracker binding. */
export interface SonifierBinding {
  /** The updater added to the tracker. */
  readonly updater: UpdaterFunction;
  /** Remove the updater and silence the voice. Safe to call more than once. */
  stop(): void;
}

function getAudioContextCtor(): (new () => SonifierContextLike) | null {
  if (typeof AudioContext !== 'undefined') {
    return AudioContext;
  }
  if (typeof window !== 'undefined' && 'webkitAudioContext' in window) {
    return (window as unknown as { webkitAudioContext: new () => SonifierContextLike })
      .webkitAudioContext;
  }
  return null;
}

/** Whether Web Audio is available in this environment. */
export function isSonificationSupported(): boolean {
  return getAudioContextCtor() !== null;
}

interface Voice {
  osc: OscillatorLike;
  gain: GainLike;
  panner: PannerLike | null;
  teardown(): void;
}

/** Maps data to sound and plays it. */
export class Sonifier {
  private _ctx: SonifierContextLike | null;
  private _ownsContext = false;
  private readonly _defaults: SonifierMappingOptions;
  private readonly _voices = new Set<Voice>();

  constructor(options: SonifierOptions = {}) {
    const { context, ...defaults } = options;
    this._ctx = context ?? null;
    this._defaults = defaults;
  }

  /** Lazily create the context. Returns null when Web Audio is missing. */
  private _ensureContext(): SonifierContextLike | null {
    if (!this._ctx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return null;
      try {
        this._ctx = new Ctor();
        this._ownsContext = true;
      } catch {
        return null;
      }
    }
    if (this._ctx.state === 'suspended') this._ctx.resume?.();
    return this._ctx;
  }

  private _createVoice(
    ctx: SonifierContextLike,
    waveform: SonifierWaveform,
    withPan: boolean,
  ): Voice {
    const osc = ctx.createOscillator();
    osc.type = waveform;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = withPan && ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }
    const voice: Voice = {
      osc,
      gain,
      panner,
      teardown: () => {
        if (!this._voices.delete(voice)) return;
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
        osc.disconnect();
        gain.disconnect();
        panner?.disconnect();
      },
    };
    this._voices.add(voice);
    return voice;
  }

  /**
   * Play a data series as stepped pitch.
   *
   * @returns A handle with the total duration and a `stop` method. In an
   * environment without Web Audio the handle is a no-op with the same duration.
   */
  play(series: ReadonlyArray<number>, options: SonifierPlayOptions = {}): SonifierPlayback {
    const opts = { ...this._defaults, ...options };
    const n = series.length;
    let step = Math.max(0, options.durationPerStep ?? DEFAULT_STEP_SECONDS);
    if (options.totalDuration !== undefined) {
      step = n > 0 ? Math.max(0, options.totalDuration) / n : 0;
    }
    const duration = step * n;
    const silent: SonifierPlayback = { duration, stop: () => undefined };
    if (n === 0) return silent;

    const ctx = this._ensureContext();
    if (!ctx) return silent;

    const domain = opts.domain ?? dataDomain(series);
    const voice = this._createVoice(ctx, opts.waveform ?? 'sine', opts.pan === true);
    const t0 = ctx.currentTime;
    series.forEach((value, i) => {
      const when = t0 + i * step;
      voice.osc.frequency.setValueAtTime(dataToFrequency(value, { ...opts, domain }), when);
      voice.gain.gain.setValueAtTime(this._gainFor(value, domain, opts), when);
      voice.panner?.pan.setValueAtTime(dataToPan(value, { domain }), when);
    });
    // Silence at the end so the voice does not hold the last note.
    voice.gain.gain.setValueAtTime(0, t0 + duration);
    voice.osc.start(t0);
    voice.osc.stop(t0 + duration);
    return { duration, stop: voice.teardown };
  }

  /**
   * Make a live tracker value drive pitch each frame.
   *
   * Adds an updater to the tracker, so the tracker must be in a scene (or be
   * updated by hand) for the sound to follow it.
   */
  bindToTracker(tracker: ValueTracker, options: SonifierMappingOptions = {}): SonifierBinding {
    const opts = { ...this._defaults, ...options };
    const ctx = this._ensureContext();
    const domain = opts.domain ?? [0, 1];
    let voice: Voice | null = null;
    if (ctx) {
      voice = this._createVoice(ctx, opts.waveform ?? 'sine', opts.pan === true);
      const initial = tracker.getValue();
      voice.osc.frequency.setValueAtTime(
        dataToFrequency(initial, { ...opts, domain }),
        ctx.currentTime,
      );
      voice.gain.gain.setValueAtTime(this._gainFor(initial, domain, opts), ctx.currentTime);
      voice.osc.start(ctx.currentTime);
    }
    const updater: UpdaterFunction = () => {
      if (!voice || !ctx) return;
      const value = tracker.getValue();
      const now = ctx.currentTime;
      voice.osc.frequency.setTargetAtTime(
        dataToFrequency(value, { ...opts, domain }),
        now,
        LIVE_SMOOTHING,
      );
      voice.gain.gain.setTargetAtTime(this._gainFor(value, domain, opts), now, LIVE_SMOOTHING);
      voice.panner?.pan.setTargetAtTime(dataToPan(value, { domain }), now, LIVE_SMOOTHING);
    };
    tracker.addUpdater(updater);
    return {
      updater,
      stop: () => {
        tracker.removeUpdater(updater);
        voice?.teardown();
      },
    };
  }

  private _gainFor(value: number, domain: DataDomain, opts: SonifierMappingOptions): number {
    if (opts.gainRange) {
      return dataToGain(value, { domain, minGain: opts.gainRange[0], maxGain: opts.gainRange[1] });
    }
    return Math.max(0, Math.min(1, opts.gain ?? DEFAULT_GAIN));
  }

  /** Stop every voice. The context stays open. */
  stop(): void {
    for (const voice of [...this._voices]) voice.teardown();
  }

  /** Stop all sound and close the context if this instance created it. */
  dispose(): void {
    this.stop();
    if (this._ownsContext) {
      this._ctx?.close?.();
      this._ctx = null;
      this._ownsContext = false;
    }
  }
}
