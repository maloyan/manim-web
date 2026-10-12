// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  exportSlidesToPDF,
  exportAndDownloadSlidesToPDF,
  exportSlidesToPPTX,
  type SlideBounds,
  type SlideDeckSource,
  type PdfDocument,
  type PptxDocument,
  type PptxSlide,
} from './SlideDeckExporter';

// ---------------------------------------------------------------------------
// Stubs: a jsPDF-like document, a pptxgenjs-like document, and a slide source.
// None of them touch a real library, a GPU, or (beyond the download test) a DOM.
// ---------------------------------------------------------------------------

interface AddImageCall {
  data: string;
  format: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Build a jsPDF-like stub that records every call the exporter makes. */
function createStubPdf(pageWidth = 800, pageHeight = 600) {
  const addImage = vi.fn<(...a: [string, string, number, number, number, number]) => PdfDocument>();
  const addPage = vi.fn<() => PdfDocument>();
  const setFillColor = vi.fn<() => PdfDocument>();
  const rect = vi.fn<() => PdfDocument>();
  const save = vi.fn<() => void>();
  const output = vi.fn(() => new Blob(['%PDF-stub'], { type: 'application/pdf' }));
  const imageCalls: AddImageCall[] = [];

  const doc: PdfDocument = {
    addPage: addPage.mockImplementation(() => doc),
    addImage: addImage.mockImplementation((data, format, x, y, w, h) => {
      imageCalls.push({ data, format, x, y, w, h });
      return doc;
    }),
    setFillColor: setFillColor.mockImplementation(() => doc),
    rect: rect.mockImplementation(() => doc),
    output: output as unknown as PdfDocument['output'],
    save,
    internal: { pageSize: { getWidth: () => pageWidth, getHeight: () => pageHeight } },
  };
  return { doc, addImage, addPage, setFillColor, rect, save, output, imageCalls };
}

/** Build a slide source with the given time boundaries and a no-op scene. */
function makeSource(slides: SlideBounds[]): SlideDeckSource {
  return {
    timeline: { getSlides: () => slides },
    scene: {
      seek: vi.fn(),
      getCanvas: vi.fn(),
      getWidth: () => 1920,
      getHeight: () => 1080,
    } as unknown as SlideDeckSource['scene'],
  };
}

/** A capturer stub returning a per-time data URL and a fixed image size. */
function makeCapturer(width = 1920, height = 1080) {
  return vi.fn((_scene: unknown, time: number) => ({
    dataUrl: `data:image/png;base64,FRAME_${time}`,
    width,
    height,
  }));
}

const threeSlides: SlideBounds[] = [
  { startTime: 0, endTime: 2 },
  { startTime: 2, endTime: 5 },
  { startTime: 5, endTime: 9 },
];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// exportSlidesToPDF
// ---------------------------------------------------------------------------

describe('exportSlidesToPDF', () => {
  it('produces one page per slide and adds each captured image', async () => {
    const { doc, addPage, imageCalls } = createStubPdf();
    const captureSlide = makeCapturer();

    const blob = await exportSlidesToPDF(makeSource(threeSlides), {
      pdfFactory: () => doc,
      captureSlide,
    });

    expect(blob).toBeInstanceOf(Blob);
    // 3 slides -> 3 images, 2 extra pages (page 1 already exists).
    expect(imageCalls).toHaveLength(3);
    expect(addPage).toHaveBeenCalledTimes(2);
    expect(captureSlide).toHaveBeenCalledTimes(3);
    // Each slide's own last-frame still is placed, in order (endTimes 2, 5, 9).
    expect(imageCalls.map((c) => c.data)).toEqual([
      'data:image/png;base64,FRAME_2',
      'data:image/png;base64,FRAME_5',
      'data:image/png;base64,FRAME_9',
    ]);
  });

  it('makes exactly one page for a single-slide deck (no addPage)', async () => {
    const { doc, addPage, imageCalls } = createStubPdf();
    const blob = await exportSlidesToPDF(makeSource([{ startTime: 0, endTime: 3 }]), {
      pdfFactory: () => doc,
      captureSlide: makeCapturer(),
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(imageCalls).toHaveLength(1);
    expect(addPage).not.toHaveBeenCalled();
  });

  it('returns null for an empty deck and builds nothing', async () => {
    const pdfFactory = vi.fn();
    const captureSlide = vi.fn();
    const blob = await exportSlidesToPDF(makeSource([]), { pdfFactory, captureSlide });

    expect(blob).toBeNull();
    expect(pdfFactory).not.toHaveBeenCalled();
    expect(captureSlide).not.toHaveBeenCalled();
  });

  it('captures the first frame when still is "first"', async () => {
    const { doc } = createStubPdf();
    const captureSlide = makeCapturer();
    await exportSlidesToPDF(makeSource(threeSlides), {
      still: 'first',
      pdfFactory: () => doc,
      captureSlide,
    });

    expect(captureSlide.mock.calls.map((c) => c[1])).toEqual([0, 2, 5]); // startTimes
  });

  it('captures the last frame by default', async () => {
    const { doc } = createStubPdf();
    const captureSlide = makeCapturer();
    await exportSlidesToPDF(makeSource(threeSlides), {
      pdfFactory: () => doc,
      captureSlide,
    });

    expect(captureSlide.mock.calls.map((c) => c[1])).toEqual([2, 5, 9]); // endTimes
  });

  it('respects page size and orientation by passing them to the factory', async () => {
    const { doc } = createStubPdf();
    const pdfFactory = vi.fn(() => doc);
    await exportSlidesToPDF(makeSource([{ startTime: 0, endTime: 1 }]), {
      orientation: 'portrait',
      pageSize: 'letter',
      unit: 'mm',
      pdfFactory,
      captureSlide: makeCapturer(),
    });

    expect(pdfFactory).toHaveBeenCalledTimes(1);
    expect(pdfFactory).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'portrait', format: 'letter', unit: 'mm' }),
    );
  });

  it('fits each image inside the page, centered, preserving aspect', async () => {
    // 800x600 page, 1920x1080 image -> scale to width: 800 wide, 450 tall.
    const { doc, imageCalls } = createStubPdf(800, 600);
    await exportSlidesToPDF(makeSource([{ startTime: 0, endTime: 1 }]), {
      pdfFactory: () => doc,
      captureSlide: makeCapturer(1920, 1080),
    });

    const call = imageCalls[0];
    expect(call.w).toBeCloseTo(800, 3);
    expect(call.h).toBeCloseTo(450, 3);
    expect(call.x).toBeCloseTo(0, 3);
    expect(call.y).toBeCloseTo(75, 3); // (600 - 450) / 2
    // Never overflows the page.
    expect(call.w).toBeLessThanOrEqual(800);
    expect(call.h).toBeLessThanOrEqual(600);
  });

  it('paints a background rectangle on every page when a background is set', async () => {
    const { doc, setFillColor, rect } = createStubPdf();
    await exportSlidesToPDF(makeSource(threeSlides), {
      background: [10, 20, 30],
      pdfFactory: () => doc,
      captureSlide: makeCapturer(),
    });

    expect(setFillColor).toHaveBeenCalledTimes(3);
    expect(setFillColor).toHaveBeenCalledWith(10, 20, 30);
    expect(rect).toHaveBeenCalledTimes(3);
  });

  it('does not paint a background when none is set', async () => {
    const { doc, setFillColor, rect } = createStubPdf();
    await exportSlidesToPDF(makeSource([{ startTime: 0, endTime: 1 }]), {
      pdfFactory: () => doc,
      captureSlide: makeCapturer(),
    });

    expect(setFillColor).not.toHaveBeenCalled();
    expect(rect).not.toHaveBeenCalled();
  });

  it('reports progress from 0 to 1', async () => {
    const { doc } = createStubPdf();
    const onProgress = vi.fn();
    await exportSlidesToPDF(makeSource(threeSlides), {
      pdfFactory: () => doc,
      captureSlide: makeCapturer(),
      onProgress,
    });

    const values = onProgress.mock.calls.map((c) => c[0]);
    expect(values[values.length - 1]).toBeCloseTo(1, 5);
  });

  it('awaits an async factory and an async capturer', async () => {
    const { doc, imageCalls } = createStubPdf();
    const blob = await exportSlidesToPDF(makeSource([{ startTime: 0, endTime: 1 }]), {
      pdfFactory: () => Promise.resolve(doc),
      captureSlide: () =>
        Promise.resolve({ dataUrl: 'data:image/png;base64,ASYNC', width: 100, height: 100 }),
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(imageCalls[0].data).toBe('data:image/png;base64,ASYNC');
  });
});

// ---------------------------------------------------------------------------
// exportAndDownloadSlidesToPDF
// ---------------------------------------------------------------------------

describe('exportAndDownloadSlidesToPDF', () => {
  it('degrades without throwing when there is no DOM', async () => {
    vi.stubGlobal('document', undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { doc, save } = createStubPdf();

    await expect(
      exportAndDownloadSlidesToPDF(makeSource(threeSlides), 'deck.pdf', {
        pdfFactory: () => doc,
        captureSlide: makeCapturer(),
      }),
    ).resolves.toBeUndefined();
    // No save/download attempted in a headless environment.
    expect(save).not.toHaveBeenCalled();
  });

  it('is a no-op for an empty deck (nothing downloaded)', async () => {
    const createEl = vi.spyOn(document, 'createElement');
    await exportAndDownloadSlidesToPDF(makeSource([]), 'deck.pdf', {
      pdfFactory: vi.fn(),
      captureSlide: vi.fn(),
    });
    expect(createEl).not.toHaveBeenCalled();
  });

  it('downloads the produced PDF blob in a DOM', async () => {
    const { doc } = createStubPdf();
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:stub'),
      revokeObjectURL: vi.fn(),
    });

    await exportAndDownloadSlidesToPDF(makeSource([{ startTime: 0, endTime: 1 }]), 'deck.pdf', {
      pdfFactory: () => doc,
      captureSlide: makeCapturer(),
    });

    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('deck.pdf');
  });
});

// ---------------------------------------------------------------------------
// exportSlidesToPPTX
// ---------------------------------------------------------------------------

/** Build a pptxgenjs-like stub that records added slides and images. */
function createStubPptx() {
  const slides: Array<{ images: unknown[]; background?: unknown }> = [];
  const write = vi.fn(() => new Blob(['PK-pptx'], { type: 'application/vnd.ms-powerpoint' }));

  const addSlide = vi.fn<() => PptxSlide>(() => {
    const record: { images: unknown[]; background?: unknown } = { images: [] };
    slides.push(record);
    const slide: PptxSlide = {
      addImage: (opts) => {
        record.images.push(opts);
      },
      set background(value: { color: string }) {
        record.background = value;
      },
    };
    return slide;
  });

  const doc: PptxDocument = {
    addSlide,
    write: write as unknown as PptxDocument['write'],
    writeFile: vi.fn(),
  };
  return { doc, addSlide, write, slides };
}

describe('exportSlidesToPPTX', () => {
  it('adds one slide per deck slide with its captured image', async () => {
    const { doc, addSlide, slides } = createStubPptx();
    const captureSlide = makeCapturer();

    const blob = await exportSlidesToPPTX(makeSource(threeSlides), {
      pptxFactory: () => doc,
      captureSlide,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(addSlide).toHaveBeenCalledTimes(3);
    expect(slides.every((s) => s.images.length === 1)).toBe(true);
  });

  it('returns null for an empty deck and builds nothing', async () => {
    const pptxFactory = vi.fn();
    const blob = await exportSlidesToPPTX(makeSource([]), {
      pptxFactory,
      captureSlide: vi.fn(),
    });
    expect(blob).toBeNull();
    expect(pptxFactory).not.toHaveBeenCalled();
  });

  it('a single-slide deck yields one slide', async () => {
    const { doc, addSlide } = createStubPptx();
    await exportSlidesToPPTX(makeSource([{ startTime: 0, endTime: 1 }]), {
      pptxFactory: () => doc,
      captureSlide: makeCapturer(),
    });
    expect(addSlide).toHaveBeenCalledTimes(1);
  });
});
