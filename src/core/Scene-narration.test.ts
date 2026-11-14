// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock three's WebGLRenderer so Scene can be constructed without real WebGL.
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  const MockWebGLRenderer = vi.fn().mockImplementation(function () {
    return {
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      setClearColor: vi.fn(),
      domElement: document.createElement('canvas'),
      dispose: vi.fn(),
      render: vi.fn(),
    };
  });
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});

import { Scene } from './Scene';
import { Circle } from '../mobjects/geometry';
import { FadeIn } from '../animation/fading';
import { narrate } from '../audio/Voiceover';

/** A minimal AudioContext that records every source start. */
function stubAudioContext() {
  const starts: Array<[number, number, number | undefined]> = [];
  const param = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} };
  class FakeAudioContext {
    currentTime = 0;
    state = 'running';
    destination = {};
    close() {
      this.state = 'closed';
    }
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Scene.play with a narration clip', () => {
  // MIGRATION: example for the property
  //   ∀ n >= 1 Scene.play() calls while a narration clip plays (timeline
  //   clock exists), the clip's source is started exactly once.
  // AudioManager.seek() is honoured with a clock, so this test fails (3
  // starts) when Scene.play() still sends its restart seek(0).
  // Replace with a property test once the suite lands.
  it('does not restart a narration clip that is still playing', async () => {
    const { starts } = stubAudioContext();
    const scene = new Scene(document.body, { width: 160, height: 90 });
    vi.spyOn(scene.audioManager, 'loadBuffer').mockResolvedValue({
      duration: 5,
    } as AudioBuffer);

    await narrate(scene, 'line.mp3', { wait: false });
    expect(starts).toHaveLength(1);

    void scene.play(new FadeIn(new Circle(), { duration: 1 }));
    void scene.play(new FadeIn(new Circle(), { duration: 1 }));
    await Promise.resolve();

    expect(starts).toHaveLength(1);
    scene.dispose();
  });
});

describe('the first narration in a live scene', () => {
  // MIGRATION: example for the property
  //   ∀ scene time s before the first narration (no manual clock), narrate
  //   places its clip at startTime === s.
  // Replace with a property test once the suite lands.
  it('lands at the scene time since the first wait()/play()', async () => {
    vi.useFakeTimers();
    stubAudioContext();
    const scene = new Scene(document.body, { width: 160, height: 90 });
    void scene.wait(10);
    vi.advanceTimersByTime(3000);
    vi.spyOn(scene.audioManager, 'loadBuffer').mockResolvedValue({
      duration: 1,
    } as AudioBuffer);

    const track = await narrate(scene, 'line.mp3', { wait: false });

    expect(track.startTime).toBeCloseTo(3, 2);
    scene.dispose();
    vi.useRealTimers();
  });
});

describe('scene time for the first narration', () => {
  // MIGRATION: example for the property
  //   ∀ run time r, pause time q: after wait(); r s; pause(); q s, the first
  //   narration lands at r; after stop() it lands at 0.
  // Replace with a property test once the suite lands.
  it('stops counting while paused and restarts at 0 after stop()', async () => {
    vi.useFakeTimers();
    stubAudioContext();
    const first = new Scene(document.body, { width: 160, height: 90 });
    void first.wait(30);
    vi.advanceTimersByTime(2000);
    first.pause();
    vi.advanceTimersByTime(10_000);
    vi.spyOn(first.audioManager, 'loadBuffer').mockResolvedValue({ duration: 1 } as AudioBuffer);
    expect((await narrate(first, 'a.mp3', { wait: false })).startTime).toBeCloseTo(2, 2);
    first.dispose();

    const second = new Scene(document.body, { width: 160, height: 90 });
    void second.wait(30);
    vi.advanceTimersByTime(5000);
    second.stop();
    vi.spyOn(second.audioManager, 'loadBuffer').mockResolvedValue({ duration: 1 } as AudioBuffer);
    expect((await narrate(second, 'b.mp3', { wait: false })).startTime).toBeCloseTo(0, 2);
    second.dispose();
    vi.useRealTimers();
  });
});

describe('scene time follows seek and resume', () => {
  // MIGRATION: example for the property
  //   ∀ seek time t (with or without an animation timeline), the first
  //   narration after seek(t) lands at t; ∀ run r1, pause q, run r2 with
  //   resume(), it lands at r1 + r2.
  // Replace with a property test once the suite lands.
  it('rebases on seek() without a timeline and keeps counting after resume()', async () => {
    vi.useFakeTimers();
    stubAudioContext();
    const seeked = new Scene(document.body, { width: 160, height: 90 });
    void seeked.wait(30);
    vi.advanceTimersByTime(5000);
    seeked.seek(1);
    vi.spyOn(seeked.audioManager, 'loadBuffer').mockResolvedValue({ duration: 1 } as AudioBuffer);
    expect((await narrate(seeked, 'a.mp3', { wait: false })).startTime).toBeCloseTo(1, 2);
    seeked.dispose();

    const resumed = new Scene(document.body, { width: 160, height: 90 });
    void resumed.play(new FadeIn(new Circle(), { duration: 60 }));
    vi.advanceTimersByTime(2000);
    resumed.pause();
    vi.advanceTimersByTime(10_000);
    resumed.resume();
    vi.advanceTimersByTime(3000);
    vi.spyOn(resumed.audioManager, 'loadBuffer').mockResolvedValue({ duration: 1 } as AudioBuffer);
    expect((await narrate(resumed, 'b.mp3', { wait: false })).startTime).toBeCloseTo(5, 2);
    resumed.dispose();
    vi.useRealTimers();
  });
});
