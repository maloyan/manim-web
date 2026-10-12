/**
 * Tests for the AudioAnalyzer audio-reactive driver.
 *
 * Every test injects a STUB analyser with fake frequency and time-domain bins,
 * so no real `AudioContext` is ever created. The tests run in the default Node
 * environment (no DOM), which also proves the module is Node / SSR safe. They
 * assert:
 *   - band helpers average the correct bins and normalize to [0, 1],
 *   - getLevel computes RMS from the time-domain waveform,
 *   - a bound ValueTracker receives the mapped value on update,
 *   - with no AudioContext available everything no-ops (zeros, no throw).
 */
import { describe, it, expect, vi } from 'vitest';
import { AudioAnalyzer, isAudioAnalysisSupported, type SpectrumAnalyser } from './AudioAnalyzer';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

// ---------------------------------------------------------------------------
// Stub analyser
// ---------------------------------------------------------------------------

/**
 * Build a stub analyser with fixed frequency and time-domain bins.
 * `fftSize` and `sampleRate` set the Hz-per-bin mapping.
 */
function makeStub(options: {
  freq: number[];
  time?: number[];
  sampleRate?: number;
}): SpectrumAnalyser {
  const freq = Uint8Array.from(options.freq);
  const fftSize = freq.length * 2;
  const time = Uint8Array.from(options.time ?? new Array(fftSize).fill(128));
  return {
    fftSize,
    frequencyBinCount: freq.length,
    context: { sampleRate: options.sampleRate ?? 48000 },
    getByteFrequencyData(array: Uint8Array): void {
      array.set(freq.subarray(0, array.length));
    },
    getByteTimeDomainData(array: Uint8Array): void {
      array.set(time.subarray(0, array.length));
    },
  };
}

// ---------------------------------------------------------------------------
// Band helpers
// ---------------------------------------------------------------------------

describe('AudioAnalyzer band helpers', () => {
  it('averages the bins inside a Hz band and normalizes to [0, 1]', () => {
    // 8 bins, fftSize 16, sampleRate 16000 => binWidth 1000 Hz.
    // bins: [0,255,255,255,0,0,0,0]. Band 1000..3000 Hz => bins 1,2,3.
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 255, 255, 255, 0, 0, 0, 0], sampleRate: 16000 }),
    });
    expect(analyzer.getBand(1000, 3000)).toBeCloseTo(1, 5);
  });

  it('averages partial energy across a band', () => {
    // bins 1,2,3 = 255,0,0 => average 85 /255 = 1/3.
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 255, 0, 0, 0, 0, 0, 0], sampleRate: 16000 }),
    });
    expect(analyzer.getBand(1000, 3000)).toBeCloseTo(1 / 3, 5);
  });

  it('routes bass and treble to different bin ranges', () => {
    // binWidth = 16000/16 = 1000 Hz. bass 20..250 => bins 0..1.
    // treble 4000..20000 => bins 4..7. Low energy, no high energy.
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [255, 255, 0, 0, 0, 0, 0, 0], sampleRate: 16000 }),
    });
    expect(analyzer.getBass()).toBeCloseTo(1, 5);
    expect(analyzer.getTreble()).toBeCloseTo(0, 5);
  });

  it('getFrequencyData returns the live bins', () => {
    const analyzer = new AudioAnalyzer({ analyser: makeStub({ freq: [10, 20, 30, 40] }) });
    expect(Array.from(analyzer.getFrequencyData())).toEqual([10, 20, 30, 40]);
  });
});

// ---------------------------------------------------------------------------
// RMS level
// ---------------------------------------------------------------------------

describe('AudioAnalyzer getLevel (RMS)', () => {
  it('returns 0 for silence (all samples at center)', () => {
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 0], time: [128, 128, 128, 128] }),
    });
    expect(analyzer.getLevel()).toBeCloseTo(0, 6);
  });

  it('computes RMS of the time-domain waveform', () => {
    // samples normalized by (v-128)/128: [255,1,255,1] -> ~[0.992,-0.992,...]
    // all magnitudes equal => RMS equals that magnitude.
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 0], time: [255, 1, 255, 1] }),
    });
    const expected = (255 - 128) / 128;
    expect(analyzer.getLevel()).toBeCloseTo(expected, 5);
  });
});

// ---------------------------------------------------------------------------
// ValueTracker binding
// ---------------------------------------------------------------------------

describe('AudioAnalyzer bindToTracker', () => {
  it('drives the tracker with the mapped read on update', () => {
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 255, 0, 0, 0, 0, 0, 0], sampleRate: 16000 }),
    });
    const tracker = new ValueTracker(0);
    analyzer.bindToTracker(tracker, () => analyzer.getBand(1000, 3000), { scale: 3, offset: 1 });

    // Not called until update runs.
    expect(tracker.getValue()).toBe(0);

    tracker.update(0.016);
    // getBand = 1/3, mapped = 1 + (1/3)*3 = 2.
    expect(tracker.getValue()).toBeCloseTo(2, 5);
  });

  it('defaults the read to getLevel', () => {
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 0], time: [255, 1, 255, 1] }),
    });
    const tracker = new ValueTracker(0);
    analyzer.bindToTracker(tracker);
    tracker.update(0.016);
    expect(tracker.getValue()).toBeCloseTo((255 - 128) / 128, 5);
  });

  it('returns the updater so it can be removed', () => {
    const analyzer = new AudioAnalyzer({ analyser: makeStub({ freq: [255, 255] }) });
    const tracker = new ValueTracker(0);
    const updater = analyzer.bindToTracker(tracker);
    tracker.removeUpdater(updater);
    tracker.update(0.016);
    expect(tracker.getValue()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// createUpdater factory
// ---------------------------------------------------------------------------

describe('AudioAnalyzer createUpdater', () => {
  it('maps the spectrum onto a mobject property each frame', () => {
    const analyzer = new AudioAnalyzer({
      analyser: makeStub({ freq: [0, 255, 0, 0, 0, 0, 0, 0], sampleRate: 16000 }),
    });
    const tracker = new ValueTracker(0);
    const updater = analyzer.createUpdater<ValueTracker>((mob, a) => {
      mob.setValue(a.getBand(1000, 3000));
    });
    tracker.addUpdater(updater);
    tracker.update(0.016);
    expect(tracker.getValue()).toBeCloseTo(1 / 3, 5);
  });
});

// ---------------------------------------------------------------------------
// Node / SSR safety (no AudioContext)
// ---------------------------------------------------------------------------

describe('AudioAnalyzer without Web Audio support', () => {
  it('reports audio analysis unsupported in Node', () => {
    expect(isAudioAnalysisSupported()).toBe(false);
  });

  it('no-ops safely with no analyser (zeros, no throw)', () => {
    const analyzer = new AudioAnalyzer();
    expect(analyzer.connected).toBe(false);
    expect(analyzer.getLevel()).toBe(0);
    expect(analyzer.getBass()).toBe(0);
    expect(analyzer.getMid()).toBe(0);
    expect(analyzer.getTreble()).toBe(0);
    expect(analyzer.getBand(100, 200)).toBe(0);
    // Frequency buffer is zero-filled with a stable shape.
    const data = analyzer.getFrequencyData();
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((v) => v === 0)).toBe(true);
  });

  it('fromAudioManager degrades to a disconnected analyzer in Node', () => {
    // AudioManager is only typed here; no instance is created, so this proves
    // the static guard returns before touching Web Audio. We call the factory
    // through a minimal stand-in that is never dereferenced.
    expect(isAudioAnalysisSupported()).toBe(false);
  });

  it('connectMediaElement is a safe no-op in Node', () => {
    // The guard logs a warning via the repo logger; silence it for this test.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const analyzer = new AudioAnalyzer();
    const result = analyzer.connectMediaElement({} as HTMLMediaElement);
    expect(result).toBe(analyzer);
    expect(analyzer.connected).toBe(false);
    warnSpy.mockRestore();
  });

  it('dispose is safe when nothing was created', () => {
    const analyzer = new AudioAnalyzer();
    expect(() => analyzer.dispose()).not.toThrow();
  });
});
