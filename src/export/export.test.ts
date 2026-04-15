// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GifExporter } from './GifExporter';
import { VideoExporter, createVideoExporter } from './VideoExporter';
import { Scene } from '../core/Scene';

// ---------------------------------------------------------------------------
// Helper to test the static download() method shared by both exporters.
// ---------------------------------------------------------------------------
function testDownload(
  downloadFn: (blob: Blob, filename: string) => void,
  blob: Blob,
  filename: string,
) {
  const fakeUrl = 'blob:http://localhost/fake';
  const origCreateObjectURL = URL.createObjectURL;
  const origRevokeObjectURL = URL.revokeObjectURL;

  const createObjectURLSpy = vi.fn(() => fakeUrl);
  const revokeObjectURLSpy = vi.fn();
  URL.createObjectURL = createObjectURLSpy;
  URL.revokeObjectURL = revokeObjectURLSpy;

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
    downloadFn(blob, filename);

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);
  } finally {
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
    vi.restoreAllMocks();
  }
}

// =========================================================================
// GifExporter
// =========================================================================

describe('GifExporter', () => {
  let container: HTMLElement;
  let scene: Scene;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 450, configurable: true });
    document.body.appendChild(container);
    scene = new Scene(container, { width: 800, height: 450 });
  });

  afterEach(() => {
    scene.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('constructor creates with default options (fps=30, quality=10)', () => {
    const exporter = new GifExporter(scene);
    const opts = (exporter as any)._options;

    expect(opts.fps).toBe(30);
    expect(opts.quality).toBe(10);
    expect(opts.width).toBe(800);
    expect(opts.height).toBe(450);
    expect(opts.workers).toBe(4);
    expect(opts.repeat).toBe(0);
  });

  it('options can be overridden', () => {
    const exporter = new GifExporter(scene, {
      fps: 15,
      quality: 5,
      width: 400,
      height: 300,
      workers: 2,
      repeat: -1,
    });

    const opts = (exporter as any)._options;
    expect(opts.fps).toBe(15);
    expect(opts.quality).toBe(5);
    expect(opts.width).toBe(400);
    expect(opts.height).toBe(300);
    expect(opts.workers).toBe(2);
    expect(opts.repeat).toBe(-1);
  });

  it('download() creates and clicks an anchor element', () => {
    const blob = new Blob(['gif-data'], { type: 'image/gif' });
    testDownload(GifExporter.download, blob, 'test.gif');
  });
});

// =========================================================================
// VideoExporter
// =========================================================================

describe('VideoExporter', () => {
  let container: HTMLElement;
  let scene: Scene;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 450, configurable: true });
    document.body.appendChild(container);
    scene = new Scene(container, { width: 800, height: 450 });
  });

  afterEach(() => {
    scene.dispose();
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('constructor creates with default options (fps=60, format=webm)', () => {
    const exporter = new VideoExporter(scene);
    const opts = exporter.getOptions();

    expect(opts.fps).toBe(60);
    expect(opts.format).toBe('webm');
    expect(opts.quality).toBe(0.9);
    expect(opts.width).toBe(800);
    expect(opts.height).toBe(450);
    expect(opts.includeAudio).toBe(true);
  });

  it('isRecording() returns false initially', () => {
    const exporter = new VideoExporter(scene);
    expect(exporter.isRecording()).toBe(false);
  });

  it('getOptions() returns resolved options', () => {
    const onProgress = vi.fn();
    const exporter = new VideoExporter(scene, {
      fps: 24,
      format: 'mp4',
      quality: 0.5,
      width: 1920,
      height: 1080,
      duration: 10,
      onProgress,
    });

    const opts = exporter.getOptions();
    expect(opts.fps).toBe(24);
    expect(opts.format).toBe('mp4');
    expect(opts.quality).toBe(0.5);
    expect(opts.width).toBe(1920);
    expect(opts.height).toBe(1080);
    expect(opts.duration).toBe(10);
    expect(opts.onProgress).toBe(onProgress);
  });

  it('download() creates and clicks an anchor element', () => {
    const blob = new Blob(['video-data'], { type: 'video/webm' });
    testDownload(VideoExporter.download, blob, 'test.webm');
  });

  it('MOV fallback: logs warning when quicktime is not supported', async () => {
    const isTypeSupportedStub = vi.fn((mime: string) => {
      if (mime === 'video/quicktime') return false;
      if (mime.startsWith('video/webm')) return true;
      return false;
    });

    class MockMediaRecorder {
      start = vi.fn();
      stop = vi.fn();
      ondataavailable: any = null;
      onstop: any = null;
      static isTypeSupported = isTypeSupportedStub;
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);

    const mockStream = {
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'captureStream').mockReturnValue(mockStream as any);

    vi.stubGlobal(
      'MediaStream',
      class {
        constructor() {}
        getVideoTracks() {
          return [];
        }
        getAudioTracks() {
          return [];
        }
      },
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const exporter = new VideoExporter(scene, { format: 'mov' });
    await exporter.startRecording();

    expect(warnSpy).toHaveBeenCalledWith(
      'MOV format not supported by this browser, falling back to WebM',
    );

    warnSpy.mockRestore();
  });

  it('createVideoExporter factory returns a VideoExporter instance', () => {
    const exporter = createVideoExporter(scene, { fps: 24 });
    expect(exporter).toBeInstanceOf(VideoExporter);
    expect(exporter.getOptions().fps).toBe(24);
  });
});
