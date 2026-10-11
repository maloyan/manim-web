/**
 * Speech synthesizer abstraction for voiceover narration.
 *
 * The browser speaks narration through the Web Speech API
 * (`window.speechSynthesis` / `SpeechSynthesisUtterance`), entirely on-device
 * with no external service. That API is wrapped behind the
 * {@link SpeechSynthesizer} interface so that:
 *
 *   - `Voiceover` depends on a small, testable surface, not on globals;
 *   - tests inject a fake synthesizer through {@link setSpeechSynthesizer}, so
 *     they never call real `speechSynthesis` (mirrors the `setTypstCompiler`
 *     dependency-injection seam in `TypstRenderer.ts`);
 *   - importing this module in Node or during SSR never throws. Every touch of
 *     `window` is guarded and happens inside a method, not at module load.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Playback options for one spoken utterance. */
export interface SpeechOptions {
  /** Speaking rate multiplier (1 = normal). */
  rate?: number;
  /** Voice pitch multiplier (1 = normal). */
  pitch?: number;
  /** Output volume in the range [0, 1]. */
  volume?: number;
  /** BCP-47 language tag, e.g. `"en-US"`. */
  lang?: string;
  /** Name of a specific `SpeechSynthesisVoice` to use. */
  voice?: string;
}

/**
 * A word- or sentence-boundary event raised while an utterance is spoken.
 * Fields mirror the Web Speech API `SpeechSynthesisEvent`.
 */
export interface SpeechBoundaryInfo {
  /** Boundary kind reported by the engine (`"word"` or `"sentence"`). */
  name: string;
  /** Character index into the spoken text the engine has reached. */
  charIndex: number;
  /** Length of the current chunk, when the engine reports it. */
  charLength?: number;
  /** Milliseconds elapsed since the utterance started. */
  elapsedTime: number;
}

/**
 * A handle to one in-flight utterance. The synthesizer returns it so the caller
 * can subscribe to timing events and cancel playback.
 */
export interface SpeechUtteranceHandle {
  /** Register a listener for word / sentence boundary events. */
  onBoundary(listener: (event: SpeechBoundaryInfo) => void): void;
  /** Register a listener fired once when the utterance finishes. */
  onEnd(listener: () => void): void;
  /** Register a listener fired if the utterance fails. */
  onError(listener: (message: string) => void): void;
  /** Stop this utterance immediately. */
  cancel(): void;
}

/** The dependency `Voiceover` speaks through. */
export interface SpeechSynthesizer {
  /** Begin speaking `text`; returns a handle for timing and cancellation. */
  speak(text: string, options?: SpeechOptions): SpeechUtteranceHandle;
  /** Cancel every in-flight and queued utterance. */
  cancel(): void;
  /** Whether this synthesizer can actually speak in the current environment. */
  isSupported(): boolean;
}

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

/**
 * Whether the Web Speech synthesis API is available in this environment.
 * Returns `false` in Node and during SSR, so callers degrade without throwing.
 */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

// ---------------------------------------------------------------------------
// Web Speech API handle
// ---------------------------------------------------------------------------

/** Handle backed by a real `SpeechSynthesisUtterance`. */
class WebSpeechHandle implements SpeechUtteranceHandle {
  private readonly _boundaryListeners: ((event: SpeechBoundaryInfo) => void)[] = [];
  private readonly _endListeners: (() => void)[] = [];
  private readonly _errorListeners: ((message: string) => void)[] = [];
  private _settled = false;

  constructor(
    private readonly _synthesis: SpeechSynthesis,
    _utterance: SpeechSynthesisUtterance,
  ) {
    _utterance.onboundary = (event: SpeechSynthesisEvent): void => {
      const info: SpeechBoundaryInfo = {
        name: event.name || 'word',
        charIndex: event.charIndex,
        charLength: event.charLength,
        elapsedTime: event.elapsedTime,
      };
      for (const listener of this._boundaryListeners) listener(info);
    };
    _utterance.onend = (): void => {
      this._settle(this._endListeners);
    };
    _utterance.onerror = (event: SpeechSynthesisErrorEvent): void => {
      const message = event.error || 'speech synthesis error';
      this._settle(this._errorListeners, message);
    };
  }

  onBoundary(listener: (event: SpeechBoundaryInfo) => void): void {
    this._boundaryListeners.push(listener);
  }

  onEnd(listener: () => void): void {
    this._endListeners.push(listener);
  }

  onError(listener: (message: string) => void): void {
    this._errorListeners.push(listener);
  }

  cancel(): void {
    this._synthesis.cancel();
    // `cancel()` does not always raise `onend`; settle end listeners so a
    // pending `waitForFinish` never hangs.
    this._settle(this._endListeners);
  }

  /** Fire a listener list once, then mark the handle settled. */
  private _settle<T extends (...args: never[]) => void>(
    listeners: T[],
    ...args: Parameters<T>
  ): void {
    if (this._settled) return;
    this._settled = true;
    for (const listener of listeners) listener(...args);
  }
}

// ---------------------------------------------------------------------------
// Web Speech API synthesizer
// ---------------------------------------------------------------------------

/**
 * The default synthesizer. Speaks through `window.speechSynthesis`.
 *
 * Construction never touches `window`. `speak` throws a clear error when the
 * API is absent (Node / SSR), so a caller that reached this path without
 * checking {@link isSpeechSupported} gets an actionable message.
 */
export class WebSpeechSynthesizer implements SpeechSynthesizer {
  isSupported(): boolean {
    return isSpeechSupported();
  }

  speak(text: string, options: SpeechOptions = {}): SpeechUtteranceHandle {
    if (!isSpeechSupported()) {
      throw new Error(
        'WebSpeechSynthesizer: window.speechSynthesis is unavailable in this ' +
          'environment. Inject a synthesizer via setSpeechSynthesizer() for ' +
          'Node / SSR, or guard with isSpeechSupported().',
      );
    }

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.volume !== undefined) utterance.volume = options.volume;
    if (options.lang !== undefined) utterance.lang = options.lang;
    if (options.voice !== undefined) {
      const match = synthesis.getVoices().find((v) => v.name === options.voice);
      if (match) utterance.voice = match;
    }

    const handle = new WebSpeechHandle(synthesis, utterance);
    synthesis.speak(utterance);
    return handle;
  }

  cancel(): void {
    if (isSpeechSupported()) window.speechSynthesis.cancel();
  }
}

// ---------------------------------------------------------------------------
// Dependency-injection seam (mirrors setTypstCompiler)
// ---------------------------------------------------------------------------

/** Injected synthesizer. When set, the Web Speech API is never used. */
let synthesizerOverride: SpeechSynthesizer | null = null;

/** The lazily created default synthesizer. */
let defaultSynthesizer: SpeechSynthesizer | null = null;

/**
 * Inject a speech synthesizer, replacing the default Web Speech one.
 *
 * Pass a fake in tests so no real `speechSynthesis` call happens. Pass `null`
 * to restore the default Web Speech synthesizer.
 */
export function setSpeechSynthesizer(synthesizer: SpeechSynthesizer | null): void {
  synthesizerOverride = synthesizer;
}

/**
 * Resolve the active synthesizer: the injected one if present, otherwise the
 * shared default Web Speech synthesizer.
 */
export function getSpeechSynthesizer(): SpeechSynthesizer {
  if (synthesizerOverride) return synthesizerOverride;
  if (!defaultSynthesizer) defaultSynthesizer = new WebSpeechSynthesizer();
  return defaultSynthesizer;
}
