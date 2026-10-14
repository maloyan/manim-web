import { describe, it, expect, vi } from 'vitest';
import {
  Sonifier,
  dataToFrequency,
  dataToGain,
  dataToPan,
  dataDomain,
  isSonificationSupported,
  type SonifierContextLike,
} from './index';
import { ValueTracker } from '../../mobjects/value-tracker/ValueTracker';

describe('dataToFrequency', () => {
  it('maps linearly with default range 220..880', () => {
    const opts = { domain: [0, 10] as [number, number] };
    expect(dataToFrequency(0, opts)).toBeCloseTo(220);
    expect(dataToFrequency(10, opts)).toBeCloseTo(880);
    expect(dataToFrequency(5, opts)).toBeCloseTo(550);
  });

  it('maps on a log scale (equal ratios per equal step)', () => {
    const opts = { domain: [0, 10] as [number, number], scale: 'log' as const };
    expect(dataToFrequency(0, opts)).toBeCloseTo(220);
    expect(dataToFrequency(10, opts)).toBeCloseTo(880);
    expect(dataToFrequency(5, opts)).toBeCloseTo(440);
  });

  it('honors a custom range', () => {
    const opts = { domain: [-1, 1] as [number, number], minFrequency: 100, maxFrequency: 300 };
    expect(dataToFrequency(0, opts)).toBeCloseTo(200);
  });

  it('clamps outside the domain', () => {
    const opts = { domain: [0, 1] as [number, number] };
    expect(dataToFrequency(-5, opts)).toBeCloseTo(220);
    expect(dataToFrequency(99, opts)).toBeCloseTo(880);
  });

  it('returns the range midpoint for a degenerate domain and min for NaN', () => {
    expect(dataToFrequency(3, { domain: [3, 3] })).toBeCloseTo(550);
    expect(dataToFrequency(NaN, { domain: [0, 1] })).toBeCloseTo(220);
  });

  it('supports an inverted domain', () => {
    expect(dataToFrequency(10, { domain: [10, 0] })).toBeCloseTo(220);
  });
});

describe('dataToGain and dataToPan', () => {
  it('maps gain over the gain range and clamps', () => {
    const opts = { domain: [0, 4] as [number, number], minGain: 0.1, maxGain: 0.5 };
    expect(dataToGain(0, opts)).toBeCloseTo(0.1);
    expect(dataToGain(2, opts)).toBeCloseTo(0.3);
    expect(dataToGain(100, opts)).toBeCloseTo(0.5);
  });

  it('maps pan to [-1, 1] and clamps', () => {
    const opts = { domain: [0, 10] as [number, number] };
    expect(dataToPan(0, opts)).toBeCloseTo(-1);
    expect(dataToPan(5, opts)).toBeCloseTo(0);
    expect(dataToPan(10, opts)).toBeCloseTo(1);
    expect(dataToPan(-3, opts)).toBeCloseTo(-1);
  });
});

describe('dataDomain', () => {
  it('returns min and max of a series', () => {
    expect(dataDomain([3, -2, 7, 1])).toEqual([-2, 7]);
  });
  it('handles empty and single element series', () => {
    expect(dataDomain([])).toEqual([0, 1]);
    expect(dataDomain([4])).toEqual([4, 4]);
  });
  it('ignores non-finite values', () => {
    expect(dataDomain([NaN, 1, Infinity, 3])).toEqual([1, 3]);
  });
});

describe('Sonifier without an AudioContext', () => {
  it('reports unsupported and constructs without throwing', () => {
    expect(isSonificationSupported()).toBe(false);
    expect(() => new Sonifier()).not.toThrow();
  });

  it('play is a graceful no-op with a handle', () => {
    const s = new Sonifier();
    let handle: ReturnType<Sonifier['play']> | undefined;
    expect(() => {
      handle = s.play([1, 2, 3], { durationPerStep: 0.1 });
    }).not.toThrow();
    expect(handle?.duration).toBeCloseTo(0.3);
    expect(() => handle?.stop()).not.toThrow();
  });

  it('handles empty and single element series', () => {
    const s = new Sonifier();
    expect(s.play([]).duration).toBe(0);
    expect(s.play([5], { totalDuration: 2 }).duration).toBeCloseTo(2);
  });

  it('bindToTracker and dispose do not throw', () => {
    const s = new Sonifier({ domain: [0, 1] });
    const tracker = new ValueTracker(0.5);
    const binding = s.bindToTracker(tracker);
    expect(() => tracker.update(0.016)).not.toThrow();
    expect(() => binding.stop()).not.toThrow();
    expect(() => s.dispose()).not.toThrow();
  });
});

function makeStubContext() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  const osc = {
    type: 'sine',
    frequency: param(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
  const panner = { pan: param(), connect: vi.fn(), disconnect: vi.fn() };
  const ctx: SonifierContextLike = {
    currentTime: 1,
    state: 'running',
    destination: {},
    createOscillator: () => osc,
    createGain: () => gain,
    createStereoPanner: () => panner,
  };
  return { ctx, osc, gain, panner };
}

describe('Sonifier scheduling (stub context)', () => {
  it('schedules one frequency step per sample and stops at the end', () => {
    const { ctx, osc, gain } = makeStubContext();
    const s = new Sonifier({ context: ctx, domain: [0, 2], waveform: 'square' });
    const handle = s.play([0, 1, 2], { durationPerStep: 0.5 });
    expect(osc.type).toBe('square');
    expect(osc.start).toHaveBeenCalledWith(1);
    expect(osc.stop).toHaveBeenCalledWith(2.5);
    const calls = osc.frequency.setValueAtTime.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0]).toBeCloseTo(220);
    expect(calls[0][1]).toBeCloseTo(1);
    expect(calls[2][0]).toBeCloseTo(880);
    expect(calls[2][1]).toBeCloseTo(2);
    expect(handle.duration).toBeCloseTo(1.5);
    expect(gain.gain.setValueAtTime).toHaveBeenCalled();
  });

  it('totalDuration splits evenly across steps', () => {
    const { ctx, osc } = makeStubContext();
    const s = new Sonifier({ context: ctx });
    s.play([1, 2, 3, 4], { totalDuration: 2 });
    expect(osc.frequency.setValueAtTime.mock.calls[1][1]).toBeCloseTo(1.5);
  });

  it('pans by value when pan is enabled', () => {
    const { ctx, panner } = makeStubContext();
    const s = new Sonifier({ context: ctx });
    s.play([0, 10], { pan: true });
    const calls = panner.pan.setValueAtTime.mock.calls;
    expect(calls[0][0]).toBeCloseTo(-1);
    expect(calls[1][0]).toBeCloseTo(1);
  });

  it('drives pitch from a bound tracker each frame', () => {
    const { ctx, osc } = makeStubContext();
    const s = new Sonifier({ context: ctx, domain: [0, 1] });
    const tracker = new ValueTracker(1);
    const binding = s.bindToTracker(tracker);
    expect(osc.start).toHaveBeenCalled();
    tracker.update(0.016);
    const calls = osc.frequency.setTargetAtTime.mock.calls;
    expect(calls[calls.length - 1][0]).toBeCloseTo(880);
    binding.stop();
    expect(osc.stop).toHaveBeenCalled();
  });
});
