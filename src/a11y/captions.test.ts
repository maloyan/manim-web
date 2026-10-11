import { describe, expect, it } from 'vitest';

import {
  attachCaptionTrack,
  formatVttTimestamp,
  voiceoverToVTT,
  type VoiceoverCaptionCue,
} from './captions';

describe('formatVttTimestamp', () => {
  it('formats whole seconds as HH:MM:SS.mmm', () => {
    expect(formatVttTimestamp(0)).toBe('00:00:00.000');
    expect(formatVttTimestamp(5)).toBe('00:00:05.000');
  });

  it('formats fractional seconds with millisecond precision', () => {
    expect(formatVttTimestamp(2.5)).toBe('00:00:02.500');
    expect(formatVttTimestamp(1.234)).toBe('00:00:01.234');
  });

  it('rolls minutes and hours over correctly', () => {
    expect(formatVttTimestamp(61)).toBe('00:01:01.000');
    expect(formatVttTimestamp(3661.1)).toBe('01:01:01.100');
  });

  it('never carries rounded milliseconds into the seconds field', () => {
    // 59.9999s rounds to 60000ms -> must read 00:01:00.000, not 00:00:60.000.
    expect(formatVttTimestamp(59.9999)).toBe('00:01:00.000');
  });

  it('clamps negative and non-finite input to zero', () => {
    expect(formatVttTimestamp(-3)).toBe('00:00:00.000');
    expect(formatVttTimestamp(Number.NaN)).toBe('00:00:00.000');
    expect(formatVttTimestamp(Number.POSITIVE_INFINITY)).toBe('00:00:00.000');
  });
});

describe('voiceoverToVTT', () => {
  const cues: VoiceoverCaptionCue[] = [
    { text: 'The derivative', start: 0, end: 1.5 },
    { text: 'is the slope.', start: 1.5, end: 3 },
  ];

  it('starts with the WEBVTT signature', () => {
    expect(voiceoverToVTT(cues).startsWith('WEBVTT\n')).toBe(true);
  });

  it('emits sequential cue numbers and timing arrows', () => {
    const vtt = voiceoverToVTT(cues);
    expect(vtt).toContain('1\n00:00:00.000 --> 00:00:01.500\nThe derivative');
    expect(vtt).toContain('2\n00:00:01.500 --> 00:00:03.000\nis the slope.');
  });

  it('produces an empty-but-valid file for no cues', () => {
    expect(voiceoverToVTT([])).toBe('WEBVTT\n');
  });

  it('escapes HTML-significant characters so cue text stays literal', () => {
    const vtt = voiceoverToVTT([{ text: 'a < b & c > d', start: 0, end: 1 }]);
    expect(vtt).toContain('a &lt; b &amp; c &gt; d');
  });

  it('collapses blank lines that would otherwise terminate a cue', () => {
    const vtt = voiceoverToVTT([{ text: 'line one\n\n\nline two', start: 0, end: 1 }]);
    expect(vtt).toContain('line one\nline two');
    // No blank line inside the cue body.
    expect(vtt).not.toContain('line one\n\nline two');
  });

  it('throws on a cue whose end is not after its start', () => {
    expect(() => voiceoverToVTT([{ text: 'bad', start: 2, end: 2 }])).toThrow();
    expect(() => voiceoverToVTT([{ text: 'bad', start: 3, end: 1 }])).toThrow();
  });

  it('throws on a cue with a negative or non-finite timestamp', () => {
    expect(() => voiceoverToVTT([{ text: 'bad', start: -1, end: 1 }])).toThrow();
    expect(() => voiceoverToVTT([{ text: 'bad', start: 0, end: Number.NaN }])).toThrow();
  });
});

describe('attachCaptionTrack', () => {
  it('returns null in a non-DOM environment instead of throwing', () => {
    // Default vitest environment is node: no document / URL.createObjectURL.
    const fakeVideo = {} as HTMLVideoElement;
    expect(attachCaptionTrack(fakeVideo, 'WEBVTT\n')).toBeNull();
  });
});
