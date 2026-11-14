// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebCodecsExporter, createWebCodecsExporter } from './WebCodecsExporter';
import { Muxer } from 'webm-muxer';
import { Muxer as Mp4Muxer } from 'mp4-muxer';
import { logger } from '../utils/logger';
import { addAudioEditList } from './mp4EditList';

// ---------------------------------------------------------------------------
// Muxer mock (dynamic import of mp4-muxer / webm-muxer)
// ---------------------------------------------------------------------------

const { mp4AddChunk, mp4AddAudio, mp4Finalize, webmAddChunk, webmFinalize } = vi.hoisted(() => ({
  mp4AddChunk: vi.fn(),
  mp4AddAudio: vi.fn(),
  mp4Finalize: vi.fn(),
  webmAddChunk: vi.fn(),
  webmFinalize: vi.fn(),
}));

vi.mock('mp4-muxer', () => ({
  Muxer: vi.fn(function (this: any, opts: any) {
    this.options = opts;
    this.target = opts.target;
    this.addVideoChunk = mp4AddChunk;
    this.addAudioChunk = mp4AddAudio;
    this.finalize = mp4Finalize;
  }),
  ArrayBufferTarget: vi.fn(function (this: any) {
    this.buffer = new ArrayBuffer(8);
  }),
}));

// The real edit-list step, wrapped so one test can make it throw.
vi.mock('./mp4EditList', async (importOriginal) => {
  const real = await importOriginal<typeof import('./mp4EditList')>();
  return { addAudioEditList: vi.fn(real.addAudioEditList) };
});

vi.mock('webm-muxer', () => ({
  Muxer: vi.fn(function (this: any, opts: any) {
    this.options = opts;
    this.target = opts.target;
    this.addVideoChunk = webmAddChunk;
    this.addAudioChunk = vi.fn();
    this.finalize = webmFinalize;
  }),
  ArrayBufferTarget: vi.fn(function (this: any) {
    this.buffer = new ArrayBuffer(8);
  }),
}));

// ---------------------------------------------------------------------------
// WebCodecs global mocks
// ---------------------------------------------------------------------------

function installWebCodecsMocks(options?: { isConfigSupported?: 'absent' | boolean }) {
  const encoderInstances: any[] = [];
  const frameInstances: any[] = [];

  class MockVideoEncoder {
    output: (chunk: any, meta: any) => void;
    error: (err: any) => void;
    configure = vi.fn();
    encode = vi.fn(() => {
      // Each encode emits exactly one encoded chunk to the muxer.
      this.output({ type: 'key' }, { decoderConfig: {} });
    });
    flush = vi.fn(() => Promise.resolve());
    close = vi.fn();
    constructor(init: { output: any; error: any }) {
      this.output = init.output;
      this.error = init.error;
      encoderInstances.push(this);
    }
    static isConfigSupported?: (config: any) => Promise<{ supported?: boolean }>;
  }

  if (options?.isConfigSupported !== 'absent') {
    const supported = options?.isConfigSupported ?? true;
    MockVideoEncoder.isConfigSupported = vi.fn(() => Promise.resolve({ supported }));
  }

  class MockVideoFrame {
    close = vi.fn();
    constructor(
      public source: unknown,
      public init: unknown,
    ) {
      frameInstances.push(this);
    }
  }

  vi.stubGlobal('VideoEncoder', MockVideoEncoder);
  vi.stubGlobal('VideoFrame', MockVideoFrame);
  return { encoderInstances, frameInstances, MockVideoEncoder };
}

/** Build a stub WebGL renderer that records clear-alpha calls. */
function createAlphaRenderer(alpha = true) {
  let clearAlpha = 1;
  const setClearAlpha = vi.fn((value: number) => {
    clearAlpha = value;
  });
  const renderer = {
    getClearAlpha: () => clearAlpha,
    setClearAlpha,
    getContext: () => ({ getContextAttributes: () => ({ alpha }) }),
  };
  return { renderer, setClearAlpha };
}

function createMockScene(overrides?: Record<string, unknown>) {
  const canvas = document.createElement('canvas');
  return {
    getWidth: () => 320,
    getHeight: () => 240,
    getCanvas: vi.fn(() => canvas),
    getTimelineDuration: () => 5,
    seek: vi.fn(),
    ...overrides,
  } as any;
}

/** Build a mock scene that exposes an alpha-capable WebGL renderer. */
function createAlphaScene(alpha = true, overrides?: Record<string, unknown>) {
  const { renderer, setClearAlpha } = createAlphaRenderer(alpha);
  const scene = createMockScene({
    renderer: { getThreeRenderer: () => renderer },
    ...overrides,
  });
  return { scene, renderer, setClearAlpha };
}

beforeEach(() => {
  mp4AddChunk.mockClear();
  mp4AddAudio.mockClear();
  mp4Finalize.mockClear();
  webmAddChunk.mockClear();
  webmFinalize.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// isSupported()
// ---------------------------------------------------------------------------

describe('WebCodecsExporter.isSupported', () => {
  it('returns true when VideoEncoder is available', () => {
    installWebCodecsMocks();
    expect(WebCodecsExporter.isSupported()).toBe(true);
  });

  it('returns false when VideoEncoder is missing', () => {
    vi.stubGlobal('VideoEncoder', undefined);
    expect(WebCodecsExporter.isSupported()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// export() — unsupported branch
// ---------------------------------------------------------------------------

describe('WebCodecsExporter.export (unsupported)', () => {
  it('throws a clear error pointing at VideoExporter', async () => {
    vi.stubGlobal('VideoEncoder', undefined);
    const exporter = new WebCodecsExporter(createMockScene());
    await expect(exporter.export()).rejects.toThrow(/VideoExporter/);
  });
});

// ---------------------------------------------------------------------------
// export() — mp4 happy path
// ---------------------------------------------------------------------------

describe('WebCodecsExporter.export (mp4)', () => {
  it('seeks per frame, feeds chunks to the muxer, and returns an mp4 Blob', async () => {
    installWebCodecsMocks();
    const scene = createMockScene();
    const onProgress = vi.fn();
    const exporter = new WebCodecsExporter(scene, {
      fps: 10,
      duration: 1,
      onProgress,
    });

    const blob = await exporter.export();

    // 1 second at 10fps = 10 frames.
    expect(scene.seek).toHaveBeenCalledTimes(10);
    expect(mp4AddChunk).toHaveBeenCalledTimes(10);
    expect(mp4Finalize).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('video/mp4');
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('configures the encoder with the resolved dimensions and bitrate', async () => {
    const { encoderInstances } = installWebCodecsMocks();
    const scene = createMockScene();
    const exporter = new WebCodecsExporter(scene, {
      fps: 5,
      duration: 0.2,
      bitrate: 1_234_000,
      width: 128,
      height: 96,
    });

    await exporter.export();

    const instance = encoderInstances[0];
    expect(instance.configure).toHaveBeenCalledTimes(1);
    const config = instance.configure.mock.calls[0][0];
    expect(config.width).toBe(128);
    expect(config.height).toBe(96);
    expect(config.bitrate).toBe(1_234_000);
    expect(config.framerate).toBe(5);
    expect(typeof config.codec).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// export() — webm path
// ---------------------------------------------------------------------------

describe('WebCodecsExporter.export (webm)', () => {
  it('routes to the webm muxer and returns a webm Blob', async () => {
    installWebCodecsMocks();
    const scene = createMockScene();
    const exporter = new WebCodecsExporter(scene, {
      format: 'webm',
      fps: 10,
      duration: 0.5,
    });

    const blob = await exporter.export();

    // 0.5s at 10fps = 5 frames.
    expect(webmAddChunk).toHaveBeenCalledTimes(5);
    expect(webmFinalize).toHaveBeenCalledTimes(1);
    expect(mp4AddChunk).not.toHaveBeenCalled();
    expect(blob.type).toBe('video/webm');
  });
});

// ---------------------------------------------------------------------------
// factory + options
// ---------------------------------------------------------------------------

describe('createWebCodecsExporter', () => {
  it('returns a configured WebCodecsExporter instance', () => {
    const exporter = createWebCodecsExporter(createMockScene(), { fps: 24 });
    expect(exporter).toBeInstanceOf(WebCodecsExporter);
    expect(exporter.getOptions().fps).toBe(24);
    expect(exporter.getOptions().format).toBe('mp4');
  });
});

// ---------------------------------------------------------------------------
// export() — alpha (transparent) path
// ---------------------------------------------------------------------------

describe('WebCodecsExporter alpha options', () => {
  it('defaults format to webm and codec to vp9 when alpha is set', () => {
    const exporter = new WebCodecsExporter(createMockScene(), { alpha: true });
    expect(exporter.getOptions().format).toBe('webm');
    expect(exporter.getOptions().codec).toBe('vp9');
    expect(exporter.getOptions().alpha).toBe(true);
  });
});

describe('WebCodecsExporter.export (alpha)', () => {
  it('configures the encoder and muxer for alpha, and toggles the clear alpha', async () => {
    const { encoderInstances, frameInstances } = installWebCodecsMocks();
    const { scene, setClearAlpha } = createAlphaScene();
    const exporter = new WebCodecsExporter(scene, { alpha: true, fps: 10, duration: 0.3 });

    const blob = await exporter.export();

    // Encoder keeps the alpha channel.
    const config = encoderInstances[0].configure.mock.calls[0][0];
    expect(config.alpha).toBe('keep');
    // webm muxer gets alpha enabled on its video track.
    const muxerOpts = (Muxer as any).mock.calls.at(-1)[0];
    expect(muxerOpts.video.alpha).toBe(true);
    // Every VideoFrame keeps alpha.
    expect(frameInstances.length).toBeGreaterThan(0);
    for (const frame of frameInstances) {
      expect((frame.init as any).alpha).toBe('keep');
    }
    // Clear alpha set to 0 for the capture, then restored to 1.
    expect(setClearAlpha).toHaveBeenNthCalledWith(1, 0);
    expect(setClearAlpha).toHaveBeenNthCalledWith(2, 1);
    expect(blob.type).toBe('video/webm');
  });

  it('checks alpha encode support and throws when unsupported', async () => {
    installWebCodecsMocks({ isConfigSupported: false });
    const { scene } = createAlphaScene();
    const exporter = new WebCodecsExporter(scene, { alpha: true, fps: 10, duration: 0.3 });

    await expect(exporter.export()).rejects.toThrow(/cannot encode/i);
  });

  it('proceeds when isConfigSupported is unavailable (cannot detect)', async () => {
    installWebCodecsMocks({ isConfigSupported: 'absent' });
    const { scene } = createAlphaScene();
    const exporter = new WebCodecsExporter(scene, { alpha: true, fps: 10, duration: 0.2 });

    const blob = await exporter.export();
    expect(blob.type).toBe('video/webm');
  });

  it('throws when alpha is requested with an incompatible format/codec', async () => {
    installWebCodecsMocks();
    const { scene } = createAlphaScene();
    const exporter = new WebCodecsExporter(scene, { alpha: true, format: 'mp4', fps: 10 });

    await expect(exporter.export()).rejects.toThrow(/webm.*vp9|vp9.*webm/i);
  });

  it('throws when the scene has no alpha channel in its WebGL context', async () => {
    installWebCodecsMocks();
    const { scene } = createAlphaScene(false);
    const exporter = new WebCodecsExporter(scene, { alpha: true, fps: 10, duration: 0.2 });

    await expect(exporter.export()).rejects.toThrow(/alpha channel/i);
  });
});

// ---------------------------------------------------------------------------
// export() — audio track
// ---------------------------------------------------------------------------

/** Install AudioEncoder/AudioData mocks: each encode emits one chunk per input frame block. */
function installAudioMocks(supported = true) {
  const encoded: Array<{ timestamp: number; numberOfFrames: number }> = [];
  class MockAudioEncoder {
    output: (chunk: any, meta?: any) => void;
    configure = vi.fn();
    encode = vi.fn((data: any) => {
      encoded.push({ timestamp: data.timestamp, numberOfFrames: data.numberOfFrames });
      this.output({ timestamp: data.timestamp, type: 'key' }, undefined);
    });
    flush = vi.fn(() => Promise.resolve());
    close = vi.fn();
    constructor(init: { output: any }) {
      this.output = init.output;
    }
    static isConfigSupported = vi.fn(() => Promise.resolve({ supported }));
  }
  class MockAudioData {
    timestamp: number;
    numberOfFrames: number;
    close = vi.fn();
    constructor(init: any) {
      this.timestamp = init.timestamp;
      this.numberOfFrames = init.numberOfFrames;
    }
  }
  vi.stubGlobal('AudioEncoder', MockAudioEncoder);
  vi.stubGlobal('AudioData', MockAudioData);
  // No AudioDecoder: the exporter falls back to the default AAC priming (2112).
  vi.stubGlobal('AudioDecoder', undefined);
  return { encoded };
}

/** An audio source with one clip whose mixdown is `seconds` long at `rate`. */
function createAudioSource() {
  return {
    tracks: [{}],
    mixdown: vi.fn((duration: number, rate: number) => {
      const data = new Float32Array(Math.round(duration * rate));
      return Promise.resolve({
        numberOfChannels: 1,
        getChannelData: () => data,
      } as unknown as AudioBuffer);
    }),
  };
}

describe('WebCodecsExporter.export (audio)', () => {
  // MIGRATION: example for the property
  //   ∀ fps, duration, scene with clips: the audio mixdown covers exactly
  //   frameCount / fps seconds from time 0, and every mixed sample goes into
  //   the encoder (the AAC priming is skipped by an mp4 edit list, not by
  //   dropping input).
  // Replace with a property test once the suite lands.
  it('mixes the audio down for the video length and muxes an AAC track', async () => {
    installWebCodecsMocks();
    const { encoded } = installAudioMocks();
    // The mocked muxer writes no real mp4, so adding the edit list warns once.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const audio = createAudioSource();
    const scene = createMockScene({ audioManager: audio });
    const exporter = new WebCodecsExporter(scene, { fps: 10, duration: 1 });

    await exporter.export();

    // 10 frames at 10 fps = 1 s of audio at 48 kHz, starting at timeline 0.
    expect(audio.mixdown).toHaveBeenCalledWith(1, 48_000);
    const muxerOpts = (Mp4Muxer as any).mock.calls.at(-1)[0];
    expect(muxerOpts.audio).toMatchObject({ codec: 'aac', sampleRate: 48_000 });
    // No source sample is dropped: the encoder gets all 48000, from time 0.
    expect(encoded[0].timestamp).toBe(0);
    const fed = encoded.reduce((sum, e) => sum + e.numberOfFrames, 0);
    expect(fed).toBe(48_000);
    expect(mp4AddAudio).toHaveBeenCalledTimes(encoded.length);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  // MIGRATION: example for the property
  //   ∀ export with alpha: true and includeAudio: true, the webm muxer gets an
  //   Opus audio track next to the VP9 alpha video (audio is never dropped silently).
  // Replace with a property test once the suite lands.
  it('keeps the audio track (Opus) in a transparent webm export', async () => {
    installWebCodecsMocks();
    installAudioMocks();
    const audio = createAudioSource();
    const { scene } = createAlphaScene(true, { audioManager: audio });
    const exporter = new WebCodecsExporter(scene, {
      fps: 10,
      duration: 0.5,
      alpha: true,
      includeAudio: true,
    });

    const blob = await exporter.export();

    expect(blob.type).toBe('video/webm');
    const muxerOpts = (Muxer as any).mock.calls.at(-1)[0];
    expect(muxerOpts.video.alpha).toBe(true);
    expect(muxerOpts.audio).toMatchObject({ codec: 'A_OPUS', sampleRate: 48_000 });
    expect(audio.mixdown).toHaveBeenCalledWith(0.5, 48_000);
  });

  it('exports video only with one warning when the audio codec is unsupported', async () => {
    installWebCodecsMocks();
    installAudioMocks(false);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const audio = createAudioSource();
    const scene = createMockScene({ audioManager: audio });

    const blob = await new WebCodecsExporter(scene, { fps: 10, duration: 0.5 }).export();

    expect(blob.type).toBe('video/mp4');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(audio.mixdown).not.toHaveBeenCalled();
    expect((Mp4Muxer as any).mock.calls.at(-1)[0].audio).toBeUndefined();
  });
});

/**
 * A fake encoder whose queue stays full (9 > 8) until a dequeue, which comes
 * one macrotask later and runs `onStall` first (a live render-loop tick).
 */
function installFullQueueEncoder(onStall: () => void) {
  const encodes: Array<{ keyFrame: boolean }> = [];
  class FullQueueEncoder {
    encodeQueueSize = 9;
    private _listeners: Array<() => void> = [];
    constructor(private init: { output: (chunk: unknown, meta?: unknown) => void }) {}
    configure() {}
    addEventListener(_type: string, cb: () => void) {
      this._listeners.push(cb);
      setTimeout(() => {
        onStall();
        this.encodeQueueSize = 0;
        this._listeners.splice(0).forEach((l) => l());
      }, 0);
    }
    encode(_frame: unknown, options: { keyFrame: boolean }) {
      encodes.push(options);
      this.encodeQueueSize = 9;
      this.init.output({ type: 'key' }, { decoderConfig: {} });
    }
    flush() {
      return Promise.resolve();
    }
    close() {}
  }
  const captured: Array<{ content: string | undefined; timestamp: number; duration: number }> = [];
  class RecordingFrame {
    constructor(source: HTMLCanvasElement, init: { timestamp: number; duration: number }) {
      captured.push({
        content: source.dataset.t,
        timestamp: init.timestamp,
        duration: init.duration,
      });
    }
    close() {}
  }
  vi.stubGlobal('VideoEncoder', FullQueueEncoder);
  vi.stubGlobal('VideoFrame', RecordingFrame);
  return { encodes, captured };
}

describe('WebCodecsExporter frame capture of a running scene', () => {
  // MIGRATION: example for the property
  //   ∀ export() of a running scene, no macrotask (render-loop tick, timer,
  //   Scene.play() cleanup) runs between the first seek and the last capture,
  //   so every frame shows the scene at its own timestamp (as on main).
  // Replace with a property test once the suite lands.
  it('export() captures every frame before the live scene gets a turn', async () => {
    const canvas = document.createElement('canvas');
    let removed = false; // the live scene's play() cleanup removed the member
    const { captured } = installFullQueueEncoder(() => {});
    const scene = createMockScene({
      getCanvas: () => canvas,
      seek: (t: number) => {
        if (t === 0) setTimeout(() => (removed = true), 0); // the next live tick
        canvas.dataset.t = removed ? 'member removed' : String(t);
      },
    });

    await new WebCodecsExporter(scene, { fps: 10, duration: 2, includeAudio: false }).export();

    expect(captured).toHaveLength(20);
    for (const frame of captured) {
      expect(frame.content).toBe(String(frame.timestamp / 1_000_000));
    }
  });

  // MIGRATION: example for the property
  //   ∀ capture session with a full encoder queue, captureFrame() reads the
  //   canvas before it waits, so a redraw during the wait misses the frame.
  // Replace with a property test once the suite lands.
  it('captureFrame() snapshots the canvas before it waits for queue capacity', async () => {
    const canvas = document.createElement('canvas');
    const { captured } = installFullQueueEncoder(() => {
      canvas.dataset.t = 'redrawn by the render loop';
    });
    const scene = createMockScene({ getCanvas: () => canvas });
    const session = await new WebCodecsExporter(scene, {
      fps: 10,
      includeAudio: false,
    }).startCapture();

    for (let frame = 0; frame < 5; frame++) {
      canvas.dataset.t = String(frame / 10); // the caller moves the scene
      await session.captureFrame();
    }
    await session.finish();

    expect(captured.map((f) => f.content)).toEqual(['0', '0.1', '0.2', '0.3', '0.4']);
  });

  // MIGRATION: example for the property
  //   ∀ fps, duration, keyFrameInterval: export() makes ceil(duration * fps)
  //   frames with timestamp round(i / fps * 1e6), duration round(1e6 / fps),
  //   keyFrame i % keyFrameInterval === 0 and progress (i + 1) / n, exactly
  //   the loop of main.
  // Replace with a property test once the suite lands.
  it('export() frames, key frames and progress equal the main loop', async () => {
    const { encodes, captured } = installFullQueueEncoder(() => {});
    const progress: number[] = [];
    const fps = 30;
    const duration = 0.35;
    const keyFrameInterval = 4;
    await new WebCodecsExporter(createMockScene(), {
      fps,
      duration,
      keyFrameInterval,
      includeAudio: false,
      onProgress: (p) => progress.push(p),
    }).export();

    const n = Math.ceil(duration * fps);
    const frames = Array.from({ length: n }, (_, i) => i);
    expect(captured.map((f) => f.timestamp)).toEqual(
      frames.map((i) => Math.round((i / fps) * 1_000_000)),
    );
    expect(captured.every((f) => f.duration === Math.round(1_000_000 / fps))).toBe(true);
    expect(encodes.map((e) => e.keyFrame)).toEqual(frames.map((i) => i % keyFrameInterval === 0));
    expect(progress).toEqual(frames.map((i) => (i + 1) / n));
  });
});

describe('WebCodecsExporter when the edit-list step throws', () => {
  // MIGRATION: example for the property
  //   ∀ exception from the optional edit-list step, export() still resolves
  //   with the muxed mp4 and logs one warning.
  // Replace with a property test once the suite lands.
  it('returns the muxed bytes and warns once', async () => {
    installWebCodecsMocks();
    installAudioMocks();
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.mocked(addAudioEditList).mockImplementationOnce(() => {
      throw new RangeError('Offset is outside the bounds of the DataView');
    });
    const scene = createMockScene({ audioManager: createAudioSource() });

    const blob = await new WebCodecsExporter(scene, { fps: 10, duration: 0.5 }).export();

    expect(blob.type).toBe('video/mp4');
    expect(blob.size).toBe(8); // the mocked muxer's bytes, unchanged
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('WebCodecsExporter on a scene without audio', () => {
  // MIGRATION: example for the property
  //   ∀ export() with includeAudio unset on a scene whose audio manager was
  //   never created, the export does not create it (as on main, so a later
  //   Scene.play() opens no AudioContext).
  // Replace with a property test once the suite lands.
  it('does not create the lazy audio manager', async () => {
    installWebCodecsMocks();
    const getter = vi.fn(() => ({ tracks: [], mixdown: vi.fn() }));
    const scene = createMockScene({ audioManagerIfCreated: null });
    Object.defineProperty(scene, 'audioManager', { get: getter });

    await new WebCodecsExporter(scene, { fps: 10, duration: 0.2 }).export();

    expect(getter).not.toHaveBeenCalled();
  });
});

describe('WebCodecsExporter compatibility with the main exporter', () => {
  // MIGRATION: example for the property
  //   ∀ export() whose audio track was added by default (includeAudio unset),
  //   a failure of the audio encoder does not lose the video: the export
  //   resolves with the muxed file and logs one warning. With an explicit
  //   includeAudio: true the export rejects, because the caller asked for audio.
  // Replace with a property test once the suite lands.
  it('keeps the video when the default audio track fails to encode', async () => {
    installWebCodecsMocks();
    installAudioMocks();
    // The mock sets `encode` as an instance field, so fail it in a subclass.
    const WorkingAudioEncoder = (
      globalThis as unknown as { AudioEncoder: new (init: unknown) => { encode: unknown } }
    ).AudioEncoder;
    class FailingAudioEncoder extends WorkingAudioEncoder {
      constructor(init: unknown) {
        super(init);
        this.encode = () => {
          throw new DOMException('audio encoder failed', 'EncodingError');
        };
      }
    }
    vi.stubGlobal('AudioEncoder', FailingAudioEncoder);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const implicit = createMockScene({ audioManager: createAudioSource() });
    const blob = await new WebCodecsExporter(implicit, { fps: 10, duration: 0.5 }).export();

    expect(blob.type).toBe('video/mp4');
    expect(mp4AddChunk).toHaveBeenCalledTimes(5);
    expect(warn).toHaveBeenCalledTimes(1);
    // The file is a plain video file: the muxer never gets an audio track, so
    // no container holds an audio track without its codec header.
    expect((Mp4Muxer as any).mock.calls.at(-1)[0].audio).toBeUndefined();
    expect(mp4AddAudio).not.toHaveBeenCalled();

    const webmScene = createMockScene({ audioManager: createAudioSource() });
    const webm = await new WebCodecsExporter(webmScene, {
      fps: 10,
      duration: 0.5,
      format: 'webm',
    }).export();
    expect(webm.type).toBe('video/webm');
    expect((Muxer as any).mock.calls.at(-1)[0].audio).toBeUndefined();

    const explicit = createMockScene({ audioManager: createAudioSource() });
    await expect(
      new WebCodecsExporter(explicit, { fps: 10, duration: 0.5, includeAudio: true }).export(),
    ).rejects.toThrow('audio encoder failed');
  });

  // MIGRATION: example for the property
  //   ∀ options object o (plain, class instance with getters, or with inherited
  //   properties) and option name k: the exporter uses o[k] ?? default(k), as
  //   the main exporter does. A null option means "use the default".
  // Replace with a property test once the suite lands.
  it('reads each option by name, with a default for null and undefined', async () => {
    installWebCodecsMocks();
    class Preset {
      fps = 10;
      get duration(): number {
        return 0.2;
      }
    }
    const inherited = Object.create({ keyFrameInterval: 1 }) as Record<string, unknown>;
    inherited.fps = 10;
    inherited.duration = 0.3;
    inherited.onProgress = null;

    const fromGetter = createMockScene();
    await new WebCodecsExporter(fromGetter, new Preset()).export();
    // duration comes from the getter: 0.2 s at 10 fps = 2 frames, not the 5 s timeline.
    expect(fromGetter.seek).toHaveBeenCalledTimes(2);

    const { encoderInstances } = installWebCodecsMocks();
    const fromProto = createMockScene();
    await new WebCodecsExporter(fromProto, inherited).export();
    expect(fromProto.seek).toHaveBeenCalledTimes(3);
    // keyFrameInterval 1 comes from the prototype: every frame is a key frame.
    const keyFlags = encoderInstances[0].encode.mock.calls.map(
      (call: [unknown, { keyFrame: boolean }]) => call[1].keyFrame,
    );
    expect(keyFlags).toEqual([true, true, true]);
  });
});
