// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GifExporter } from './GifExporter';
import { Scene } from '../core/Scene';

// ---------------------------------------------------------------------------
// Mock gif.js module (external dependency, keep mocked)
// ---------------------------------------------------------------------------

let mockGifInstance: {
  addFrame: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  _handlers: Record<string, Function>;
};

function createMockGifInstance() {
  const handlers: Record<string, Function> = {};
  return {
    addFrame: vi.fn(),
    on: vi.fn((event: string, cb: Function) => {
      handlers[event] = cb;
    }),
    render: vi.fn(),
    abort: vi.fn(),
    _handlers: handlers,
  };
}

vi.mock('gif.js', () => {
  return {
    default: vi.fn(function MockGIF() {
      Object.assign(this, mockGifInstance);
      return this;
    }),
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GifExporter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockGifInstance = createMockGifInstance();
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 450, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function createScene(): Scene {
    return new Scene(container, { width: 800, height: 450 });
  }

  // ---- Constructor defaults ----

  it('constructor applies ?? fallback defaults correctly', () => {
    const scene = createScene();
    const exporter = new GifExporter(scene);
    const opts = (exporter as any)._options;

    expect(opts.fps).toBe(30);
    expect(opts.quality).toBe(10);
    expect(opts.width).toBe(800);
    expect(opts.height).toBe(450);
    expect(opts.duration).toBe(0);
    expect(opts.workers).toBe(4);
    expect(opts.repeat).toBe(0);
    expect(typeof opts.onProgress).toBe('function');
    scene.dispose();
  });

  it('constructor uses provided options over defaults', () => {
    const scene = createScene();
    const onProgress = vi.fn();
    const exporter = new GifExporter(scene, {
      fps: 15,
      quality: 5,
      width: 400,
      height: 300,
      duration: 10,
      workers: 2,
      repeat: -1,
      onProgress,
    });
    const opts = (exporter as any)._options;

    expect(opts.fps).toBe(15);
    expect(opts.quality).toBe(5);
    expect(opts.width).toBe(400);
    expect(opts.height).toBe(300);
    expect(opts.duration).toBe(10);
    expect(opts.workers).toBe(2);
    expect(opts.repeat).toBe(-1);
    expect(opts.onProgress).toBe(onProgress);
    scene.dispose();
  });

  // ---- _getTimelineDuration ----

  it('_getTimelineDuration returns timeline duration when available', async () => {
    const { Create } = await import('../animation/creation/Create');
    const { Circle } = await import('../mobjects/geometry/Circle');

    const scene = createScene();
    const circle = new Circle();
    await scene.play(new Create(circle, { duration: 3 }));
    scene.dispose();

    const freshScene = createScene();
    const exporter = new GifExporter(freshScene);
    const freshCircle = new Circle();
    await freshScene.play(new Create(freshCircle, { duration: 3 }));
    const duration = (exporter as any)._getTimelineDuration();
    expect(duration).toBeCloseTo(3, 5);
    freshScene.dispose();
  });

  it('_getTimelineDuration returns null when no timeline', () => {
    const scene = createScene();
    const exporter = new GifExporter(scene);
    const duration = (exporter as any)._getTimelineDuration();
    expect(duration).toBeNull();
    scene.dispose();
  });

  // ---- exportTimeline ----

  it('exportTimeline captures frames and resolves on finished', async () => {
    const scene = createScene();
    const onProgress = vi.fn();
    const exporter = new GifExporter(scene, {
      fps: 10,
      duration: 1,
      onProgress,
    });

    vi.spyOn(exporter as any, '_createWorkerBlobUrl').mockResolvedValue('blob:worker');

    mockGifInstance.render.mockImplementation(() => {
      const finishedHandler = mockGifInstance._handlers['finished'];
      if (finishedHandler) {
        setTimeout(() => finishedHandler(new Blob(['gif-data'], { type: 'image/gif' })), 0);
      }
    });

    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    const blob = await exporter.exportTimeline();

    expect(blob).toBeInstanceOf(Blob);
    // 1 second at 10fps = 10 frames
    expect(mockGifInstance.addFrame).toHaveBeenCalledTimes(10);
    expect(scene.seek).toHaveBeenCalledTimes(10);
    expect(onProgress).toHaveBeenCalled();

    URL.revokeObjectURL = origRevokeObjectURL;
    scene.dispose();
  });

  it('exportTimeline uses fallback duration of 5 when no duration provided', async () => {
    const scene = createScene();
    const exporter = new GifExporter(scene, { fps: 10 });

    vi.spyOn(exporter as any, '_createWorkerBlobUrl').mockResolvedValue('blob:url');

    mockGifInstance.render.mockImplementation(() => {
      const handler = mockGifInstance._handlers['finished'];
      if (handler) setTimeout(() => handler(new Blob(['gif'], { type: 'image/gif' })), 0);
    });

    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    const blob = await exporter.exportTimeline();
    expect(blob).toBeInstanceOf(Blob);
    // 5 seconds at 10fps = 50 frames
    expect(mockGifInstance.addFrame).toHaveBeenCalledTimes(50);

    URL.revokeObjectURL = origRevokeObjectURL;
    scene.dispose();
  });

  it('exportTimeline rejects with abort error when gif emits abort', async () => {
    const scene = createScene();
    const exporter = new GifExporter(scene, { fps: 10, duration: 0.1 });

    vi.spyOn(exporter as any, '_createWorkerBlobUrl').mockResolvedValue('blob:url');

    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    mockGifInstance.render.mockImplementation(() => {
      const abortHandler = mockGifInstance._handlers['abort'];
      if (abortHandler) {
        setTimeout(() => abortHandler(), 0);
      }
    });

    await expect(exporter.exportTimeline()).rejects.toThrow('GIF encoding was aborted');

    URL.revokeObjectURL = origRevokeObjectURL;
    scene.dispose();
  });

  it('exportTimeline rejects on render error', async () => {
    const scene = createScene();
    const exporter = new GifExporter(scene, { fps: 10, duration: 0.1 });

    vi.spyOn(exporter as any, '_createWorkerBlobUrl').mockResolvedValue('blob:url');

    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    mockGifInstance.render.mockImplementation(() => {
      throw new Error('render failed');
    });

    await expect(exporter.exportTimeline()).rejects.toThrow('render failed');

    URL.revokeObjectURL = origRevokeObjectURL;
    scene.dispose();
  });

  // ---- download ----

  it('download creates and clicks an anchor element', () => {
    const blob = new Blob(['gif-data'], { type: 'image/gif' });
    const fakeUrl = 'blob:http://localhost/fake';

    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => fakeUrl);
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    try {
      GifExporter.download(blob, 'test.gif');

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
    } finally {
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
      vi.restoreAllMocks();
    }
  });

  // ---- createGifExporter factory ----

  it('createGifExporter returns a GifExporter instance', async () => {
    const { createGifExporter } = await import('./GifExporter');
    const scene = createScene();
    const exporter = createGifExporter(scene, { fps: 20 });
    expect(exporter).toBeInstanceOf(GifExporter);
    expect((exporter as any)._options.fps).toBe(20);
    scene.dispose();
  });
});
