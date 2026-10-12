/**
 * Tests for the SpatialAudio positional-audio driver.
 *
 * Every test injects a STUB AudioContext that records `createPanner`, the
 * panner position (AudioParam `.value` or the legacy `setPosition`), and the
 * listener position / orientation. No real `AudioContext` is created, so the
 * tests run in the default Node environment (no DOM), which also proves the
 * module is Node / SSR safe. They assert:
 *   - setPosition writes the panner position,
 *   - attachTo + update(dt) moves the panner to the mobject center,
 *   - setListenerPosition / setListenerFromCamera write the listener,
 *   - play / pause / stop / volume route through the injected source,
 *   - panner options (refDistance, rolloff, panningModel) are applied,
 *   - with no AudioContext everything no-ops (no throw).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  SpatialAudio,
  isSpatialAudioSupported,
  type SpatialAudioContextLike,
  type SpatialPanner,
  type SpatialListenerLike,
  type PositionalSource,
} from './SpatialAudio';
import { Dot } from '../mobjects/geometry/Dot';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

/** An AudioParam stub that records the last value written to it. */
function makeParam(): { value: number } {
  return { value: 0 };
}

/** Build a stub panner that records its position and option fields. */
function makePanner(): SpatialPanner & { readonly px: { value: number } } {
  const px = makeParam();
  const py = makeParam();
  const pz = makeParam();
  const connected: unknown[] = [];
  return {
    panningModel: 'equalpower',
    distanceModel: 'inverse',
    refDistance: 1,
    maxDistance: 10000,
    rolloffFactor: 1,
    positionX: px,
    positionY: py,
    positionZ: pz,
    px,
    connect(destination: unknown): void {
      connected.push(destination);
    },
    disconnect(): void {
      connected.length = 0;
    },
  };
}

/** Build a stub listener that records position and orientation params. */
function makeListener(): SpatialListenerLike & {
  readonly pos: { value: number }[];
  readonly fwd: { value: number }[];
} {
  const positionX = makeParam();
  const positionY = makeParam();
  const positionZ = makeParam();
  const forwardX = makeParam();
  const forwardY = makeParam();
  const forwardZ = makeParam();
  const upX = makeParam();
  const upY = makeParam();
  const upZ = makeParam();
  return {
    positionX,
    positionY,
    positionZ,
    forwardX,
    forwardY,
    forwardZ,
    upX,
    upY,
    upZ,
    pos: [positionX, positionY, positionZ],
    fwd: [forwardX, forwardY, forwardZ],
  };
}

/** Build a stub context with a recording panner and listener. */
function makeContext(): SpatialAudioContextLike & {
  readonly panner: ReturnType<typeof makePanner>;
  readonly listener: ReturnType<typeof makeListener>;
  readonly pannerCalls: number;
} {
  const panner = makePanner();
  const listener = makeListener();
  const state = { pannerCalls: 0 };
  return {
    destination: {},
    listener,
    panner,
    get pannerCalls(): number {
      return state.pannerCalls;
    },
    createPanner(): SpatialPanner {
      state.pannerCalls += 1;
      return panner;
    },
  };
}

/** Build a stub transport source that records every call. */
function makeSource(): PositionalSource & { readonly log: string[]; volume: number } {
  const log: string[] = [];
  return {
    log,
    volume: 1,
    play(): void {
      log.push('play');
    },
    pause(): void {
      log.push('pause');
    },
    stop(): void {
      log.push('stop');
    },
    setVolume(value: number): void {
      this.volume = value;
      log.push(`volume:${value}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Panner position
// ---------------------------------------------------------------------------

describe('SpatialAudio position', () => {
  it('creates one panner and connects it to the destination', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    expect(ctx.pannerCalls).toBe(1);
    expect(audio.connected).toBe(true);
  });

  it('setPosition writes the panner AudioParam position', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    audio.setPosition([2, 3, -4]);
    expect(ctx.panner.positionX?.value).toBe(2);
    expect(ctx.panner.positionY?.value).toBe(3);
    expect(ctx.panner.positionZ?.value).toBe(-4);
    expect(audio.getPosition()).toEqual([2, 3, -4]);
  });

  it('uses the legacy setPosition when no AudioParam is present', () => {
    const calls: number[][] = [];
    const legacyPanner: SpatialPanner = {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
      setPosition(x: number, y: number, z: number): void {
        calls.push([x, y, z]);
      },
      connect(): void {},
      disconnect(): void {},
    };
    const ctx: SpatialAudioContextLike = {
      destination: {},
      listener: makeListener(),
      createPanner: () => legacyPanner,
    };
    const audio = new SpatialAudio({ context: ctx });
    // The constructor writes the initial [0, 0, 0] position first.
    expect(calls[0]).toEqual([0, 0, 0]);
    audio.setPosition([1, 2, 3]);
    expect(calls[calls.length - 1]).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// attachTo + update
// ---------------------------------------------------------------------------

describe('SpatialAudio attachTo', () => {
  it('moves the panner to the mobject center on update(dt)', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    const dot = new Dot();
    dot.moveTo([5, -1, 2]);
    audio.attachTo(dot);
    // attachTo snaps immediately to the current center.
    expect(ctx.panner.positionX?.value).toBeCloseTo(5, 5);

    dot.moveTo([-3, 4, 0]);
    audio.update(0.016);
    expect(ctx.panner.positionX?.value).toBeCloseTo(-3, 5);
    expect(ctx.panner.positionY?.value).toBeCloseTo(4, 5);
    expect(ctx.panner.positionZ?.value).toBeCloseTo(0, 5);
  });

  it('createUpdater drives update through the standard updater loop', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    const dot = new Dot();
    audio.attachTo(dot);
    const updater = audio.createUpdater();
    dot.addUpdater(updater);
    dot.moveTo([7, 0, 0]);
    dot.update(0.016);
    expect(ctx.panner.positionX?.value).toBeCloseTo(7, 5);
  });

  it('detach stops following the mobject', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    const dot = new Dot();
    dot.moveTo([1, 1, 1]);
    audio.attachTo(dot);
    audio.detach();
    dot.moveTo([9, 9, 9]);
    audio.update(0.016);
    expect(ctx.panner.positionX?.value).toBeCloseTo(1, 5);
  });
});

// ---------------------------------------------------------------------------
// Listener
// ---------------------------------------------------------------------------

describe('SpatialAudio listener', () => {
  it('setListenerPosition writes the listener position', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    audio.setListenerPosition([0, 0, 10]);
    expect(ctx.listener.pos[0].value).toBe(0);
    expect(ctx.listener.pos[2].value).toBe(10);
  });

  it('setListenerFromCamera writes position and a normalized forward vector', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    audio.setListenerFromCamera({
      position: { x: 0, y: 0, z: 10 },
      lookAtTarget: { x: 0, y: 0, z: 0 },
    });
    expect(ctx.listener.pos[2].value).toBe(10);
    // forward = normalize(target - position) = (0, 0, -1)
    expect(ctx.listener.fwd[2].value).toBeCloseTo(-1, 5);
  });

  it('setListenerFromCamera falls back to a default forward with no target', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    audio.setListenerFromCamera({ position: { x: 1, y: 2, z: 3 } });
    expect(ctx.listener.pos[0].value).toBe(1);
    expect(ctx.listener.fwd[2].value).toBeCloseTo(-1, 5);
  });
});

// ---------------------------------------------------------------------------
// Transport + volume
// ---------------------------------------------------------------------------

describe('SpatialAudio transport', () => {
  it('routes play / pause / stop through the source', () => {
    const ctx = makeContext();
    const source = makeSource();
    const audio = new SpatialAudio({ context: ctx, source });
    audio.play();
    audio.pause();
    audio.stop();
    expect(source.log).toEqual(['play', 'pause', 'stop']);
  });

  it('setVolume routes through the source', () => {
    const ctx = makeContext();
    const source = makeSource();
    const audio = new SpatialAudio({ context: ctx, source });
    audio.setVolume(0.25);
    expect(source.volume).toBe(0.25);
  });

  it('transport is a safe no-op with no source', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    expect(() => {
      audio.play();
      audio.pause();
      audio.stop();
      audio.setVolume(0.5);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Panner options
// ---------------------------------------------------------------------------

describe('SpatialAudio options', () => {
  it('applies refDistance, rolloffFactor, maxDistance and panningModel', () => {
    const ctx = makeContext();
    new SpatialAudio({
      context: ctx,
      panningModel: 'HRTF',
      distanceModel: 'exponential',
      refDistance: 2,
      maxDistance: 50,
      rolloffFactor: 3,
    });
    expect(ctx.panner.panningModel).toBe('HRTF');
    expect(ctx.panner.distanceModel).toBe('exponential');
    expect(ctx.panner.refDistance).toBe(2);
    expect(ctx.panner.maxDistance).toBe(50);
    expect(ctx.panner.rolloffFactor).toBe(3);
  });

  it('applies an initial position from options', () => {
    const ctx = makeContext();
    new SpatialAudio({ context: ctx, position: [1, 2, 3] });
    expect(ctx.panner.positionX?.value).toBe(1);
    expect(ctx.panner.positionZ?.value).toBe(3);
  });

  it('setter methods update the panner after construction', () => {
    const ctx = makeContext();
    const audio = new SpatialAudio({ context: ctx });
    audio.setRefDistance(4).setRolloffFactor(0.5).setPanningModel('HRTF');
    expect(ctx.panner.refDistance).toBe(4);
    expect(ctx.panner.rolloffFactor).toBe(0.5);
    expect(ctx.panner.panningModel).toBe('HRTF');
  });
});

// ---------------------------------------------------------------------------
// Node / SSR safety (no AudioContext)
// ---------------------------------------------------------------------------

describe('SpatialAudio without Web Audio support', () => {
  it('reports spatial audio unsupported in Node', () => {
    expect(isSpatialAudioSupported()).toBe(false);
  });

  it('no-ops safely with no context (no throw)', () => {
    const audio = new SpatialAudio();
    expect(audio.connected).toBe(false);
    expect(() => {
      audio.setPosition([1, 2, 3]);
      audio.setListenerPosition([0, 0, 0]);
      audio.setListenerFromCamera({ position: { x: 0, y: 0, z: 1 } });
      audio.play();
      audio.pause();
      audio.stop();
      audio.setVolume(0.5);
      audio.update(0.016);
    }).not.toThrow();
    // Position is still tracked even without an audio graph.
    expect(audio.getPosition()).toEqual([1, 2, 3]);
  });

  it('attachTo + update no-ops without a context', () => {
    const audio = new SpatialAudio();
    const dot = new Dot();
    dot.moveTo([2, 2, 2]);
    audio.attachTo(dot);
    expect(() => audio.update(0.016)).not.toThrow();
    expect(audio.getPosition()).toEqual([2, 2, 2]);
  });

  it('fromMediaElement degrades to a disconnected instance in Node', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const audio = SpatialAudio.fromMediaElement({} as HTMLMediaElement);
    expect(audio.connected).toBe(false);
    warnSpy.mockRestore();
  });

  it('dispose is safe when nothing was created', () => {
    const audio = new SpatialAudio();
    expect(() => audio.dispose()).not.toThrow();
  });
});
