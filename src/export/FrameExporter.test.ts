// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  exportFramePNG,
  exportPNGSequence,
  downloadBlob,
  exportAndDownloadPNG,
} from './FrameExporter';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const origCreateElement = document.createElement.bind(document);

/** Build a canvas whose toBlob produces a deterministic PNG blob. */
function createMockCanvas() {
  const canvas = origCreateElement('canvas');
  (canvas as any).toBlob = vi.fn((cb: (blob: Blob | null) => void, type?: string) => {
    cb(new Blob(['png-bytes'], { type: type ?? 'image/png' }));
  });
  return canvas;
}

function createMockScene(overrides?: Record<string, unknown>) {
  const canvas = createMockCanvas();
  return {
    getWidth: () => 800,
    getHeight: () => 600,
    getCanvas: vi.fn(() => canvas),
    getTimelineDuration: () => 5,
    seek: vi.fn(),
    ...overrides,
  } as any;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// exportFramePNG
// ---------------------------------------------------------------------------

describe('exportFramePNG', () => {
  it('produces a single PNG blob from the current frame', async () => {
    const scene = createMockScene();
    const blob = await exportFramePNG(scene);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    // No time given -> no seek.
    expect(scene.seek).not.toHaveBeenCalled();
  });

  it('seeks to the requested time before capture', async () => {
    const scene = createMockScene();
    await exportFramePNG(scene, { time: 2.5 });

    expect(scene.seek).toHaveBeenCalledTimes(1);
    expect(scene.seek).toHaveBeenCalledWith(2.5);
  });

  it('falls back to toDataURL when toBlob is unavailable', async () => {
    const scene = createMockScene();
    const canvas = scene.getCanvas();
    (canvas as any).toBlob = undefined;
    (canvas as any).toDataURL = vi.fn(
      () => 'data:image/png;base64,aGVsbG8=', // "hello"
    );

    const blob = await exportFramePNG(scene);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect((canvas as any).toDataURL).toHaveBeenCalled();
  });

  it('rejects when toBlob yields no data', async () => {
    const scene = createMockScene();
    const canvas = scene.getCanvas();
    (canvas as any).toBlob = vi.fn((cb: (b: Blob | null) => void) => cb(null));

    await expect(exportFramePNG(scene)).rejects.toThrow(/no data/i);
  });
});

// ---------------------------------------------------------------------------
// exportPNGSequence
// ---------------------------------------------------------------------------

describe('exportPNGSequence', () => {
  it('returns fps*duration blobs and seeks once per frame', async () => {
    const scene = createMockScene();
    const onProgress = vi.fn();

    const blobs = await exportPNGSequence(scene, {
      fps: 10,
      from: 0,
      to: 2,
      onProgress,
    });

    // 2 seconds at 10fps = 20 frames
    expect(blobs).toHaveLength(20);
    expect(scene.seek).toHaveBeenCalledTimes(20);
    expect(blobs[0]).toBeInstanceOf(Blob);
    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('seeks to the correct timestamps for each frame', async () => {
    const scene = createMockScene();
    await exportPNGSequence(scene, { fps: 2, from: 1, to: 2 });

    // 1 second at 2fps = 2 frames, starting at from=1
    expect(scene.seek).toHaveBeenNthCalledWith(1, 1);
    expect(scene.seek).toHaveBeenNthCalledWith(2, 1.5);
  });

  it('defaults the end time to the timeline duration', async () => {
    const scene = createMockScene({ getTimelineDuration: () => 3 });
    const blobs = await exportPNGSequence(scene, { fps: 10 });

    // 3 seconds at 10fps = 30 frames
    expect(blobs).toHaveLength(30);
  });
});

// ---------------------------------------------------------------------------
// downloadBlob
// ---------------------------------------------------------------------------

describe('downloadBlob', () => {
  it('wires an anchor click and revokes the object URL', () => {
    const fakeUrl = 'blob:http://localhost/fake';
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURLSpy = vi.fn(() => fakeUrl);
    const revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;

    const clickSpy = vi.fn();
    let anchor: any = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
        anchor = el;
      }
      return el;
    });

    try {
      const blob = new Blob(['png'], { type: 'image/png' });
      downloadBlob(blob, 'frame.png');

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(anchor.href).toBe(fakeUrl);
      expect(anchor.download).toBe('frame.png');
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);
    } finally {
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    }
  });
});

// ---------------------------------------------------------------------------
// exportAndDownloadPNG
// ---------------------------------------------------------------------------

describe('exportAndDownloadPNG', () => {
  it('captures a frame then downloads it with the given filename', async () => {
    const scene = createMockScene();
    const fakeUrl = 'blob:http://localhost/fake';
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => fakeUrl);
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    try {
      await exportAndDownloadPNG(scene, 'shot.png', { time: 1 });
      expect(scene.seek).toHaveBeenCalledWith(1);
      expect(clickSpy).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    }
  });
});
