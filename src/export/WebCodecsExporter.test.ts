// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebCodecsExporter, createWebCodecsExporter } from './WebCodecsExporter';
import { Muxer } from 'webm-muxer';

// ---------------------------------------------------------------------------
// Muxer mock (dynamic import of mp4-muxer / webm-muxer)
// ---------------------------------------------------------------------------

const { mp4AddChunk, mp4Finalize, webmAddChunk, webmFinalize } = vi.hoisted(() => ({
  mp4AddChunk: vi.fn(),
  mp4Finalize: vi.fn(),
  webmAddChunk: vi.fn(),
  webmFinalize: vi.fn(),
}));

vi.mock('mp4-muxer', () => ({
  Muxer: vi.fn(function (this: any, opts: any) {
    this.options = opts;
    this.target = opts.target;
    this.addVideoChunk = mp4AddChunk;
    this.finalize = mp4Finalize;
  }),
  ArrayBufferTarget: vi.fn(function (this: any) {
    this.buffer = new ArrayBuffer(8);
  }),
}));

vi.mock('webm-muxer', () => ({
  Muxer: vi.fn(function (this: any, opts: any) {
    this.options = opts;
    this.target = opts.target;
    this.addVideoChunk = webmAddChunk;
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
