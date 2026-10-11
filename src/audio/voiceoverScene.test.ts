/**
 * Tests for VoiceoverScene. A headless scene (no container) with an injected
 * fake synthesizer, so no real speech or rendering is needed.
 */
import { describe, it, expect } from 'vitest';
import { VoiceoverScene } from './VoiceoverScene';
import type {
  SpeechSynthesizer,
  SpeechUtteranceHandle,
  SpeechBoundaryInfo,
} from './speechSynthesizer';

/** A fake handle the test ends on demand. */
class FakeHandle implements SpeechUtteranceHandle {
  private readonly _end: (() => void)[] = [];
  onBoundary(_listener: (event: SpeechBoundaryInfo) => void): void {}
  onEnd(listener: () => void): void {
    this._end.push(listener);
  }
  onError(_listener: (message: string) => void): void {}
  cancel(): void {
    this.end();
  }
  end(): void {
    for (const listener of this._end) listener();
  }
}

class FakeSynthesizer implements SpeechSynthesizer {
  readonly spoken: string[] = [];
  handle: FakeHandle | undefined;
  isSupported(): boolean {
    return true;
  }
  speak(text: string): SpeechUtteranceHandle {
    this.spoken.push(text);
    this.handle = new FakeHandle();
    return this.handle;
  }
  cancel(): void {}
}

describe('VoiceoverScene', () => {
  it('owns a narrator and delegates voiceover to it', async () => {
    const synth = new FakeSynthesizer();
    const scene = new VoiceoverScene(null, { headless: true, voiceover: { synthesizer: synth } });

    expect(scene.narrator).toBeDefined();

    const tracker = await scene.voiceover('hello <bookmark mark="x"/> world', async (t) => {
      expect(t.markReached('x')).toBe(false);
      synth.handle?.end();
    });

    expect(synth.spoken).toEqual(['hello  world']);
    expect(tracker.bookmarks).toEqual([{ mark: 'x', charIndex: 6 }]);
    scene.dispose();
  });
});
