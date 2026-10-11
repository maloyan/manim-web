/**
 * Tests for the speech synthesizer abstraction and its DI seam.
 *
 * Runs in Node (no DOM), so these also prove the module is Node / SSR safe:
 * importing it never throws, support detection returns false, and the default
 * Web Speech synthesizer raises a clear error instead of crashing on import.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  isSpeechSupported,
  WebSpeechSynthesizer,
  setSpeechSynthesizer,
  getSpeechSynthesizer,
  type SpeechSynthesizer,
} from './speechSynthesizer';

afterEach(() => {
  setSpeechSynthesizer(null);
});

describe('isSpeechSupported', () => {
  it('reports no Web Speech support in Node', () => {
    expect(isSpeechSupported()).toBe(false);
  });
});

describe('WebSpeechSynthesizer', () => {
  it('reports unsupported and throws a clear error when speaking in Node', () => {
    const synth = new WebSpeechSynthesizer();
    expect(synth.isSupported()).toBe(false);
    expect(() => synth.speak('hello')).toThrow(/speechSynthesis is unavailable/);
  });

  it('cancel is a no-op when speech is unsupported', () => {
    const synth = new WebSpeechSynthesizer();
    expect(() => synth.cancel()).not.toThrow();
  });
});

describe('getSpeechSynthesizer / setSpeechSynthesizer', () => {
  it('returns the injected synthesizer', () => {
    const fake: SpeechSynthesizer = {
      isSupported: () => true,
      cancel: () => {},
      speak: () => {
        throw new Error('unused');
      },
    };
    setSpeechSynthesizer(fake);
    expect(getSpeechSynthesizer()).toBe(fake);
  });

  it('falls back to a WebSpeechSynthesizer when nothing is injected', () => {
    expect(getSpeechSynthesizer()).toBeInstanceOf(WebSpeechSynthesizer);
  });
});
