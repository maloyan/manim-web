/**
 * Voiceover - narration synced to animation for manim-web.
 *
 * `manim-voiceover` is a popular ManimCE plugin that ties animation beats to
 * spoken narration. The browser does the same natively: Web Speech text to
 * speech for live narration, or a pre-recorded clip played through the existing
 * {@link AudioManager}. No external service is used.
 *
 * The core idea is a narration segment: a block of narration spoken while a
 * callback runs its animations. The callback can pause on a transcript
 * BOOKMARK with `waitForMark`, so an animation beat fires exactly when the
 * narration reaches a chosen word.
 *
 * ```ts
 * const narrator = new Voiceover();
 * await narrator.voiceover(
 *   'The derivative <bookmark mark="eq"/> is the slope.',
 *   async (tracker) => {
 *     await scene.play(write(label));
 *     await tracker.waitForMark('eq'); // fire exactly on the word "is"
 *     await scene.play(create(graph));
 *   },
 * );
 * // resolves after the narration finishes
 * ```
 *
 * Timing comes from the synthesizer `boundary` events (word / char boundaries).
 * Tests inject a fake synthesizer via `setSpeechSynthesizer`, so no real
 * `speechSynthesis` call happens. The module is Node / SSR safe: importing it
 * never touches `window`, and the pre-recorded path has no DOM dependency.
 */

import type { AddSoundOptions, AudioTrack } from '../core/AudioManager';
import { logger } from '../utils/logger';
import { parseBookmarks, type Bookmark } from './bookmarks';
import {
  getSpeechSynthesizer,
  type SpeechOptions,
  type SpeechSynthesizer,
} from './speechSynthesizer';

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

/**
 * Tracks one narration segment: lets a callback wait for a bookmark or for the
 * whole narration to finish. One tracker is created per `voiceover` call.
 */
export interface VoiceoverTracker {
  /** The spoken text, with bookmark markers already removed. */
  readonly text: string;
  /** Every bookmark found in the transcript, in order. */
  readonly bookmarks: ReadonlyArray<Bookmark>;
  /** Resolves when the narration finishes (or fails, or is cancelled). */
  readonly finished: Promise<void>;
  /** The failure message if the narration errored, else `null`. */
  readonly error: string | null;
  /**
   * Resolve when the narration reaches `mark`. Resolves immediately if the
   * mark was already reached, and resolves on finish if the mark never arrives
   * (so an animation beat never hangs).
   */
  waitForMark(mark: string): Promise<void>;
  /** Resolve when the narration finishes. Same promise as {@link finished}. */
  waitForFinish(): Promise<void>;
  /** Whether the narration has already reached `mark`. */
  markReached(mark: string): boolean;
}

/** The driver side of a tracker, kept private to this module. */
interface TrackerControls {
  /** Report the latest character index the narration has spoken. */
  notifyBoundary(charIndex: number): void;
  /** Report that a named mark was reached (used by the timed audio path). */
  notifyMark(mark: string): void;
  /** Report that the narration finished. */
  notifyFinish(): void;
  /** Report that the narration failed; resolves waiters so nothing hangs. */
  fail(message: string): void;
}

/**
 * Create a tracker and its private driver. The waiter maps live in this closure
 * so the public {@link VoiceoverTracker} exposes only the read / wait surface.
 */
function createVoiceoverTracker(
  text: string,
  bookmarks: Bookmark[],
): { tracker: VoiceoverTracker; controls: TrackerControls } {
  const markWaiters = new Map<string, Array<() => void>>();
  const reached = new Set<string>();
  let maxCharIndex = -1;
  let finished = false;
  let error: string | null = null;

  let resolveFinished: () => void = () => {};
  const finishedPromise = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  function markReached(mark: string): boolean {
    if (reached.has(mark)) return true;
    const positions = bookmarks.filter((b) => b.mark === mark);
    // An unknown mark only "arrives" at finish, so it never hangs the caller.
    if (positions.length === 0) return finished;
    return positions.some((b) => b.charIndex <= maxCharIndex);
  }

  function resolveReachedMarks(): void {
    for (const [mark, waiters] of markWaiters) {
      if (markReached(mark)) {
        markWaiters.delete(mark);
        for (const waiter of waiters) waiter();
      }
    }
  }

  function notifyBoundary(charIndex: number): void {
    if (charIndex > maxCharIndex) maxCharIndex = charIndex;
    resolveReachedMarks();
  }

  function notifyMark(mark: string): void {
    reached.add(mark);
    resolveReachedMarks();
  }

  function notifyFinish(): void {
    if (finished) return;
    finished = true;
    for (const [, waiters] of markWaiters) {
      for (const waiter of waiters) waiter();
    }
    markWaiters.clear();
    resolveFinished();
  }

  function fail(message: string): void {
    if (!error) error = message;
    notifyFinish();
  }

  const tracker: VoiceoverTracker = {
    text,
    bookmarks,
    get finished(): Promise<void> {
      return finishedPromise;
    },
    get error(): string | null {
      return error;
    },
    waitForMark(mark: string): Promise<void> {
      if (finished || markReached(mark)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const waiters = markWaiters.get(mark) ?? [];
        waiters.push(resolve);
        markWaiters.set(mark, waiters);
      });
    },
    waitForFinish(): Promise<void> {
      return finishedPromise;
    },
    markReached,
  };

  return { tracker, controls: { notifyBoundary, notifyMark, notifyFinish, fail } };
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Options for a `Voiceover` instance or a single `voiceover` call. */
export interface VoiceoverOptions extends SpeechOptions {
  /** A synthesizer that overrides the injected / default one for this scope. */
  synthesizer?: SpeechSynthesizer;
}

/** A callback that runs animations while the narration plays. */
export type VoiceoverCallback = (tracker: VoiceoverTracker) => void | Promise<void>;

/** The scheduler a pre-recorded voiceover plays through (AudioManager satisfies it). */
export interface VoiceoverAudioScheduler {
  /** Schedule a clip on the timeline. */
  addSound(url: string, options?: AddSoundOptions): Promise<AudioTrack>;
  /** Start playback of the scheduled timeline. */
  play(): void;
  /** The current timeline time in seconds (see `AudioManager.timelineNow`). */
  timelineNow?(): number;
  /** Fetch and decode a clip without scheduling it. */
  loadBuffer?(url: string): Promise<AudioBuffer>;
}

/** Options for a pre-recorded voiceover. */
export interface VoiceoverAudioOptions {
  /** URL of the narration audio clip. */
  url: string;
  /** The scheduler that plays the clip (usually a scene's `audioManager`). */
  audioManager: VoiceoverAudioScheduler;
  /** Map of bookmark name to time in seconds from the clip start. */
  bookmarks?: Record<string, number>;
  /**
   * When to start the clip on the scheduler timeline (seconds). Defaults to
   * "now" (`audioManager.timelineNow()`) when the scheduler has a timeline
   * clock, else 0.
   */
  time?: number;
  /** Narration length in seconds. Falls back to the scheduled track duration. */
  duration?: number;
  /** Playback gain in [0, 1]. */
  gain?: number;
}

// ---------------------------------------------------------------------------
// Voiceover
// ---------------------------------------------------------------------------

/** Build the plain {@link SpeechOptions} the synthesizer expects. */
function toSpeechOptions(options: VoiceoverOptions): SpeechOptions {
  return {
    rate: options.rate,
    pitch: options.pitch,
    volume: options.volume,
    lang: options.lang,
    voice: options.voice,
  };
}

/**
 * Narrates text and syncs animation beats to the narration.
 *
 * One instance can be reused for a whole scene; each `voiceover` call is one
 * narration segment with its own tracker.
 */
export class Voiceover {
  private readonly _options: VoiceoverOptions;
  private _activeHandle: { cancel(): void } | null = null;

  constructor(options: VoiceoverOptions = {}) {
    this._options = options;
  }

  /**
   * Speak `text` and run `callback` while it plays.
   *
   * The narration and the callback run together. Any `<bookmark mark="..."/>`
   * markers in `text` are stripped before speaking and exposed through the
   * tracker. The returned promise resolves after the narration finishes.
   *
   * @param text - Narration, optionally with bookmark markers.
   * @param callback - Runs animations; may await `tracker.waitForMark`.
   * @param options - Per-call speech options (merged over the instance options).
   * @returns The tracker for this narration segment.
   */
  async voiceover(
    text: string,
    callback?: VoiceoverCallback,
    options: VoiceoverOptions = {},
  ): Promise<VoiceoverTracker> {
    const parsed = parseBookmarks(text);
    const { tracker, controls } = createVoiceoverTracker(parsed.text, parsed.bookmarks);

    const merged: VoiceoverOptions = { ...this._options, ...options };
    const synthesizer = merged.synthesizer ?? getSpeechSynthesizer();

    try {
      const handle = synthesizer.speak(parsed.text, toSpeechOptions(merged));
      this._activeHandle = handle;
      handle.onBoundary((event) => controls.notifyBoundary(event.charIndex));
      handle.onEnd(() => controls.notifyFinish());
      handle.onError((message) => controls.fail(message));
    } catch (err) {
      // Speaking is unavailable (e.g. Node without an injected synthesizer).
      // Surface the failure, but still run the callback so the animation plays
      // without narration instead of crashing the scene.
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Voiceover: speech synthesis failed:', message);
      controls.fail(message);
    }

    try {
      if (callback) await callback(tracker);
    } catch (err) {
      // The scene failed: stop speaking instead of narrating over the error.
      this.cancel();
      throw err;
    }
    await tracker.finished;
    this._activeHandle = null;
    return tracker;
  }

  /**
   * Play a pre-recorded narration clip through the given scheduler and sync
   * animation beats to explicit bookmark times.
   *
   * Scheduling is delegated to the {@link VoiceoverAudioScheduler} (normally a
   * scene's `audioManager`); this method never duplicates audio scheduling.
   *
   * @param options - Clip URL, scheduler, bookmark times and timing.
   * @param callback - Runs animations; may await `tracker.waitForMark`.
   * @returns The tracker for this narration segment.
   */
  async voiceoverAudio(
    options: VoiceoverAudioOptions,
    callback?: VoiceoverCallback,
  ): Promise<VoiceoverTracker> {
    const { url, audioManager, bookmarks = {}, duration, gain } = options;
    // Load first, so "now" is read after the fetch and the clip is not late.
    if (options.time === undefined && audioManager.loadBuffer) {
      await audioManager.loadBuffer(url);
    }
    const time = options.time ?? audioManager.timelineNow?.() ?? 0;

    // Bookmarks are reached by time on this path; charIndex only keeps order.
    const bookmarkList: Bookmark[] = Object.keys(bookmarks).map((mark, index) => ({
      mark,
      charIndex: index,
    }));
    const { tracker, controls } = createVoiceoverTracker('', bookmarkList);

    const track = await audioManager.addSound(url, { time, gain });
    audioManager.play();

    const total = duration ?? track.duration ?? 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [mark, at] of Object.entries(bookmarks)) {
      timers.push(setTimeout(() => controls.notifyMark(mark), Math.max(0, at) * 1000));
    }
    timers.push(setTimeout(() => controls.notifyFinish(), Math.max(0, total) * 1000));

    try {
      if (callback) await callback(tracker);
      await tracker.finished;
    } finally {
      // Also when the callback throws: no bookmark timer fires after the segment.
      for (const id of timers) clearTimeout(id);
    }
    return tracker;
  }

  /** Cancel the narration currently in flight, if any. */
  cancel(): void {
    if (this._activeHandle) {
      this._activeHandle.cancel();
      this._activeHandle = null;
    }
  }
}

// ---------------------------------------------------------------------------
// narrate (pre-recorded clip at "now")
// ---------------------------------------------------------------------------

/** The scene surface {@link narrate} needs. `Scene` satisfies it. */
export interface NarrationHost {
  /** The scene's audio timeline. */
  readonly audioManager: Required<Pick<VoiceoverAudioScheduler, 'addSound' | 'timelineNow'>>;
  /** Hold the scene for `duration` seconds. */
  wait(duration: number): Promise<void>;
}

/** Options for {@link narrate}. */
export interface NarrateOptions {
  /** Playback gain in [0, 1]. Defaults to 1. */
  gain?: number;
  /**
   * Wait for the clip to finish before the promise resolves. Defaults to true.
   * Set false to run animations over the narration, then wait yourself.
   */
  wait?: boolean;
  /** Extra seconds to hold after the clip ends (only when `wait`). Defaults to 0. */
  tail?: number;
}

/**
 * Place a pre-recorded narration clip at the current timeline time ("now")
 * and, by default, hold the scene for the clip's length.
 *
 * The clip goes into the scene's AudioManager, so `AudioManager.mixdown` and a
 * WebCodecs video export hold it at the same time offset as the frames that
 * were on screen when it started.
 *
 * ```ts
 * await scene.play(new Create(circle));
 * await narrate(scene, '/narration/intro.mp3'); // starts now, waits its length
 * ```
 *
 * @returns The scheduled track (its `startTime` is the "now" it was placed at)
 * @post result.startTime >= 0
 */
export async function narrate(
  host: NarrationHost,
  url: string,
  options: NarrateOptions = {},
): Promise<AudioTrack> {
  const audio = host.audioManager;
  // Load first (addSound caches by URL), so "now" is read after the fetch.
  const probe = audio as Partial<Pick<VoiceoverAudioScheduler, 'loadBuffer'>>;
  if (probe.loadBuffer) await probe.loadBuffer(url);
  const track = await audio.addSound(url, { time: audio.timelineNow(), gain: options.gain });
  if (options.wait !== false) {
    await host.wait(track.duration + (options.tail ?? 0));
  }
  return track;
}
