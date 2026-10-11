// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebCodecsExporter, createWebCodecsExporter } from './WebCodecsExporter';

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

function installWebCodecsMocks() {
  const encoderInstances: any[] = [];

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
  }

  class MockVideoFrame {
    close = vi.fn();
    constructor(
      public source: unknown,
      public init: unknown,
    ) {}
  }

  vi.stubGlobal('VideoEncoder', MockVideoEncoder);
  vi.stubGlobal('VideoFrame', MockVideoFrame);
  return { encoderInstances };
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
