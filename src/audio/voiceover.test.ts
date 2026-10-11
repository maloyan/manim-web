/**
 * Tests for the Voiceover narration helper.
 *
 * Every test injects a FAKE synthesizer, so no real `speechSynthesis` call ever
 * happens. The tests run in the default Node environment (no DOM), which also
 * proves the module imports and runs Node / SSR safe. They assert:
 *   - the spoken text has bookmark markers stripped out,
 *   - `waitForMark` resolves exactly when a boundary reaches the mark,
 *   - the narration finishes via the synthesizer `end` event,
 *   - the pre-recorded path schedules through an AudioManager-shaped scheduler,
 *   - speech options flow through,
 *   - a throwing synthesizer and a reported speech error are handled, not fatal.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AddSoundOptions, AudioTrack } from '../core/AudioManager';
import { Voiceover, type VoiceoverAudioScheduler } from './Voiceover';
import {
  setSpeechSynthesizer,
  type SpeechSynthesizer,
  type SpeechUtteranceHandle,
  type SpeechOptions,
  type SpeechBoundaryInfo,
} from './speechSynthesizer';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/** A fake utterance handle whose timing events the test drives by hand. */
class FakeHandle implements SpeechUtteranceHandle {
  readonly boundaryListeners: ((event: SpeechBoundaryInfo) => void)[] = [];
  readonly endListeners: (() => void)[] = [];
  readonly errorListeners: ((message: string) => void)[] = [];
  cancelled = false;

  onBoundary(listener: (event: SpeechBoundaryInfo) => void): void {
    this.boundaryListeners.push(listener);
  }
  onEnd(listener: () => void): void {
    this.endListeners.push(listener);
  }
  onError(listener: (message: string) => void): void {
    this.errorListeners.push(listener);
  }
  cancel(): void {
    this.cancelled = true;
    // Mirror the real handle: cancel settles end listeners so nothing hangs.
    this.emitEnd();
  }

  emitBoundary(charIndex: number, name = 'word'): void {
    for (const listener of this.boundaryListeners) {
      listener({ name, charIndex, charLength: 1, elapsedTime: 0 });
    }
  }
  emitEnd(): void {
    for (const listener of this.endListeners) listener();
  }
  emitError(message: string): void {
    for (const listener of this.errorListeners) listener(message);
  }
}

/** A fake synthesizer that records what it was asked to speak. */
class FakeSynthesizer implements SpeechSynthesizer {
  readonly spokenTexts: string[] = [];
  readonly handles: FakeHandle[] = [];
  lastOptions: SpeechOptions | undefined;
  cancelCount = 0;

  isSupported(): boolean {
    return true;
  }
  speak(text: string, options?: SpeechOptions): SpeechUtteranceHandle {
    this.spokenTexts.push(text);
    this.lastOptions = options;
    const handle = new FakeHandle();
    this.handles.push(handle);
    return handle;
  }
  cancel(): void {
    this.cancelCount += 1;
  }

  get lastHandle(): FakeHandle {
    return this.handles[this.handles.length - 1];
  }
}

/** An AudioManager-shaped scheduler that records scheduled clips. */
class FakeScheduler implements VoiceoverAudioScheduler {
  readonly added: { url: string; options?: AddSoundOptions }[] = [];
  playCount = 0;
  constructor(private readonly _trackDuration = 2) {}

  async addSound(url: string, options?: AddSoundOptions): Promise<AudioTrack> {
    this.added.push({ url, options });
    return {
      id: 1,
      url,
      buffer: null,
      startTime: options?.time ?? 0,
      duration: this._trackDuration,
      gain: options?.gain ?? 1,
      loop: false,
      fadeIn: 0,
      fadeOut: 0,
      offset: 0,
      playing: false,
      paused: false,
    };
  }
  play(): void {
    this.playCount += 1;
  }
}

/** Flush pending microtasks. */
function flush(): Promise<void> {
  return Promise.resolve();
}

afterEach(() => {
  setSpeechSynthesizer(null);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Voiceover (Web Speech path)', () => {
  it('speaks the transcript with bookmark markers stripped out', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });

    const tracker = await voiceover.voiceover('ab <bookmark mark="m"/> cd', async () => {
      synth.lastHandle.emitEnd();
    });

    expect(synth.spokenTexts).toEqual(['ab  cd']);
    expect(tracker.text).toBe('ab  cd');
    expect(tracker.bookmarks).toEqual([{ mark: 'm', charIndex: 3 }]);
  });

  it('resolves waitForMark exactly when a boundary reaches the mark', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });
    const order: string[] = [];

    await voiceover.voiceover('ab <bookmark mark="m"/> cd', async (tracker) => {
      const marked = tracker.waitForMark('m').then(() => order.push('mark'));

      // Boundary before the mark (charIndex 3): not yet reached.
      synth.lastHandle.emitBoundary(1);
      await flush();
      expect(tracker.markReached('m')).toBe(false);

      // Boundary at the mark: it resolves now.
      synth.lastHandle.emitBoundary(3);
      await marked;
      order.push('after');

      synth.lastHandle.emitEnd();
    });

    expect(order).toEqual(['mark', 'after']);
  });

  it('resolves a pending waitForMark on finish so a beat never hangs', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });
    let resolved = false;

    await voiceover.voiceover('text with no matching mark', async (tracker) => {
      tracker.waitForMark('missing').then(() => {
        resolved = true;
      });
      synth.lastHandle.emitEnd();
      await flush();
    });

    expect(resolved).toBe(true);
  });

  it('finishes when the synthesizer reports the end event', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });

    let finished = false;
    const run = voiceover.voiceover('done soon', async (tracker) => {
      tracker.finished.then(() => {
        finished = true;
      });
    });
    // Narration is still playing until end fires.
    await flush();
    expect(finished).toBe(false);

    synth.lastHandle.emitEnd();
    await run;
    expect(finished).toBe(true);
  });

  it('passes speech options through to the synthesizer', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth, rate: 1.5, lang: 'en-US' });

    await voiceover.voiceover('x', async () => synth.lastHandle.emitEnd(), { pitch: 0.8 });

    expect(synth.lastOptions).toMatchObject({ rate: 1.5, lang: 'en-US', pitch: 0.8 });
  });

  it('uses the synthesizer injected via setSpeechSynthesizer', async () => {
    const synth = new FakeSynthesizer();
    setSpeechSynthesizer(synth);

    const voiceover = new Voiceover();
    await voiceover.voiceover('hi there', async () => synth.lastHandle.emitEnd());

    expect(synth.spokenTexts).toEqual(['hi there']);
  });

  it('cancels the active narration', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });

    let handle: FakeHandle | undefined;
    await voiceover.voiceover('long narration', async () => {
      handle = synth.lastHandle;
      voiceover.cancel();
    });

    expect(handle?.cancelled).toBe(true);
  });
});

describe('Voiceover error handling', () => {
  it('handles a synthesizer that throws when speaking', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwing: SpeechSynthesizer = {
      isSupported: () => false,
      cancel: () => {},
      speak: () => {
        throw new Error('no speech engine');
      },
    };
    const voiceover = new Voiceover({ synthesizer: throwing });

    let ran = false;
    const tracker = await voiceover.voiceover('hello', async () => {
      ran = true;
    });

    expect(ran).toBe(true);
    expect(tracker.error).toBe('no speech engine');
    errorSpy.mockRestore();
  });

  it('resolves the narration when the synthesizer reports an error', async () => {
    const synth = new FakeSynthesizer();
    const voiceover = new Voiceover({ synthesizer: synth });

    const tracker = await voiceover.voiceover('oops', async () => {
      synth.lastHandle.emitError('interrupted');
    });

    expect(tracker.error).toBe('interrupted');
  });
});

describe('Voiceover (pre-recorded path)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules the clip through the AudioManager and resolves marks by time', async () => {
    vi.useFakeTimers();
    const scheduler = new FakeScheduler(3);
    const voiceover = new Voiceover();
    const events: string[] = [];

    const run = voiceover.voiceoverAudio(
      {
        url: 'narration.mp3',
        audioManager: scheduler,
        time: 1,
        gain: 0.8,
        bookmarks: { a: 0.5, b: 2 },
      },
      async (tracker) => {
        tracker.waitForMark('a').then(() => events.push('a'));
        tracker.waitForMark('b').then(() => events.push('b'));
      },
    );

    // Let addSound resolve and the timers get scheduled.
    await vi.advanceTimersByTimeAsync(0);
    expect(scheduler.added).toHaveLength(1);
    expect(scheduler.added[0].url).toBe('narration.mp3');
    expect(scheduler.added[0].options).toMatchObject({ time: 1, gain: 0.8 });
    expect(scheduler.playCount).toBe(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(events).toEqual(['a']);

    await vi.advanceTimersByTimeAsync(1500);
    expect(events).toEqual(['a', 'b']);

    // Reach the track duration (3 s) -> narration finishes.
    await vi.advanceTimersByTimeAsync(1000);
    await run;
  });
});
