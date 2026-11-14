// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AudioManager } from '../core/AudioManager';
import { narrate, Voiceover } from './Voiceover';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('narrate', () => {
  // MIGRATION: example for the property
  //   ∀ clock time t at the call, narrate places the clip at startTime === t
  //   (seconds since the timeline clock started) and waits its duration.
  // Replace with a property test once the suite lands.
  it('places the clip at the timeline clock "now" and waits for its length', async () => {
    vi.useFakeTimers();
    const audio = new AudioManager();
    vi.spyOn(audio, 'loadBuffer').mockResolvedValue({ duration: 1.5 } as AudioBuffer);
    // Keep the live transport out of the test (no AudioContext in happy-dom).
    vi.spyOn(audio, 'play').mockImplementation(() => {});
    const wait = vi.fn(() => Promise.resolve());
    const host = { audioManager: audio, wait };

    audio.startTimelineClock(performance.now());
    vi.advanceTimersByTime(2500);
    const track = await narrate(host, 'line.mp3', { gain: 0.8 });

    expect(track.startTime).toBeCloseTo(2.5, 3);
    expect(track.gain).toBe(0.8);
    expect(wait).toHaveBeenCalledWith(1.5);
  });
});

/** A minimal AudioContext: enough for the transport to schedule sources. */
function stubAudioContext(tick = 0) {
  const starts: Array<[number, number, number | undefined]> = [];
  const param = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} };
  let clock = tick === 0 ? 0 : 12;
  class FakeAudioContext {
    /** Advances by `tick` on every read, like a running audio clock. */
    get currentTime() {
      const now = clock;
      clock += tick;
      return now;
    }
    state = 'running';
    destination = {};
    createGain() {
      return { gain: { ...param }, connect() {} };
    }
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        onended: null,
        connect() {},
        stop() {},
        start: (when: number, offset: number, duration?: number) =>
          starts.push([when, offset, duration]),
      };
    }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  return { starts };
}

describe('AudioManager timeline clock and the transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  // MIGRATION: example for the property
  //   ∀ pause length p, after narrate: pause(); (p s pass); play() resumes the
  //   clock at the paused time, and seek(t) while paused moves it to t.
  // Replace with a property test once the suite lands.
  it('pauses, resumes and seeks the clock after a narration', async () => {
    vi.useFakeTimers();
    const { starts } = stubAudioContext();
    const audio = new AudioManager();
    vi.spyOn(audio, 'loadBuffer').mockResolvedValue({ duration: 4 } as AudioBuffer);
    const host = { audioManager: audio, wait: () => Promise.resolve() };

    await narrate(host, 'line.mp3', { wait: false }); // clock starts at 0, clip plays
    vi.advanceTimersByTime(2000);
    audio.pause();
    vi.advanceTimersByTime(10_000);
    audio.play();
    expect(audio.getCurrentTime()).toBeCloseTo(2, 3); // not 12

    audio.pause();
    audio.seek(0);
    audio.play();
    expect(audio.timelineNow()).toBeCloseTo(0, 3);
    expect(starts[starts.length - 1]?.[1]).toBeCloseTo(0, 3); // the clip restarts at its first sample
  });

  // MIGRATION: example for the property
  //   ∀ transport position t with no clock, the first narrate places its clip at t.
  // Replace with a property test once the suite lands.
  it('places the first narration at the transport position', async () => {
    stubAudioContext();
    const audio = new AudioManager();
    vi.spyOn(audio, 'loadBuffer').mockResolvedValue({ duration: 1 } as AudioBuffer);
    audio.seek(5);
    const track = await narrate({ audioManager: audio, wait: () => Promise.resolve() }, 'a.mp3', {
      wait: false,
    });
    expect(track.startTime).toBeCloseTo(5, 2);
  });
});

describe('Voiceover when the callback throws', () => {
  // MIGRATION: example for the property
  //   ∀ callback that rejects, voiceover() rejects with the same error and the
  //   speech it started is cancelled.
  // Replace with a property test once the suite lands.
  it('cancels the speech and rethrows', async () => {
    const handle = {
      cancel: vi.fn(),
      onBoundary() {},
      onEnd() {},
      onError() {},
    };
    const narrator = new Voiceover({
      synthesizer: { speak: () => handle, cancel() {}, isSupported: () => true },
    });
    const failing = () => Promise.reject(new Error('scene broke'));

    await expect(narrator.voiceover('Hello.', failing)).rejects.toThrow('scene broke');
    expect(handle.cancel).toHaveBeenCalledTimes(1);
  });
});

describe('AudioManager.seek while the timeline clock runs', () => {
  afterEach(() => vi.unstubAllGlobals());

  // MIGRATION: example for the property
  //   ∀ seek time t with a running clock: timelineNow() === t right after the
  //   call, a clip covering t starts at offset t - startTime, a clip after t
  //   starts t' - t later, and a clip that ended before t is not started.
  // Replace with a property test once the suite lands.
  it('rebases the clock and reschedules every clip from the seek time', async () => {
    vi.useFakeTimers();
    const { starts } = stubAudioContext();
    const audio = new AudioManager();
    vi.spyOn(audio, 'loadBuffer').mockResolvedValue({ duration: 4 } as AudioBuffer);
    const host = { audioManager: audio, wait: () => Promise.resolve() };

    await narrate(host, 'a.mp3', { wait: false }); // clip A at 0..4, clock running
    await audio.addSound('b.mp3', { time: 6, duration: 2 }); // clip B at 6..8
    vi.advanceTimersByTime(1000);

    starts.length = 0;
    audio.seek(2);
    expect(audio.timelineNow()).toBeCloseTo(2, 3);
    // [when, offset, duration]: A from its 2 s offset now, B in 4 s.
    expect(starts).toEqual([
      [0, 2, 2],
      [4, 0, 2],
    ]);

    starts.length = 0;
    audio.seek(0);
    expect(audio.timelineNow()).toBeCloseTo(0, 3);
    expect(starts).toEqual([
      [0, 0, 4],
      [6, 0, 2],
    ]);
  });
});

describe('AudioManager without a timeline clock', () => {
  afterEach(() => vi.unstubAllGlobals());

  // MIGRATION: example for the property
  //   ∀ tracks with the same startTime and no clock, play() starts them at
  //   one AudioContext time, however far currentTime moves during the loop
  //   (as on main).
  // Replace with a property test once the suite lands.
  it('starts simultaneous tracks at one context time while the audio clock moves', async () => {
    const { starts } = stubAudioContext(0.01);
    const audio = new AudioManager();
    vi.spyOn(audio, 'loadBuffer').mockResolvedValue({ duration: 2 } as AudioBuffer);
    for (const url of ['a.mp3', 'b.mp3', 'c.mp3']) await audio.addSound(url, { time: 0 });

    audio.play();

    const whens = starts.map(([when]) => when);
    expect(whens).toHaveLength(3);
    expect(new Set(whens).size).toBe(1);
  });
});
