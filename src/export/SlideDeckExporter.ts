/**
 * SlideDeckExporter - export an interactive manim-web slide deck to a static
 * document: one still image per slide, assembled into a PDF (or PPTX).
 *
 * Interactive slides play to video/GIF/SVG/PNG, but educators often want a flat
 * handout: a PDF where each slide is one page. This exporter walks the player's
 * slides (built by `MasterTimeline.finalizeSlides()`), seeks the scene to each
 * slide's representative frame, captures it as a raster image, and places one
 * image per page.
 *
 * The heavy document libraries are not bundled. `jspdf` is lazy-loaded through a
 * dynamic `import()` only when the caller uses the default PDF factory, so the
 * base bundle stays light. `pptxgenjs` is fully optional: PPTX works when the
 * caller passes `pptxFactory`, or installs `pptxgenjs` so the default optional
 * import resolves.
 *
 * Every external dependency is a dependency-injection seam (`pdfFactory`,
 * `pptxFactory`, `captureSlide`), so tests run with lightweight stubs and need
 * neither the real libraries, a GPU, nor a DOM.
 */

import { downloadBlob } from './FrameExporter';
import { logger } from '../utils/logger';

/**
 * A slide's time span on the timeline. Matches the `Slide` interface produced
 * by `MasterTimeline.getSlides()` (only the two fields this exporter reads).
 */
export interface SlideBounds {
  /** Slide start time in seconds (first frame). */
  readonly startTime: number;
  /** Slide end time in seconds (last frame). */
  readonly endTime: number;
}

/**
 * Duck-typed scene the default capturer needs: seek to a time, read the canvas,
 * and report the pixel size. `Scene` matches this structurally.
 */
export interface SlideCaptureScene {
  seek(time: number): void;
  getCanvas(): HTMLCanvasElement;
  getWidth(): number;
  getHeight(): number;
}

/**
 * Duck-typed source of slides plus the scene to capture. A `Player` matches
 * this: `player.timeline.getSlides()` and `player.scene`.
 */
export interface SlideDeckSource {
  /** The timeline that exposes the finalized slide list. */
  readonly timeline: { getSlides(): readonly SlideBounds[] };
  /** The scene the capturer seeks and reads. */
  readonly scene: SlideCaptureScene;
}

/** One captured slide still: an image data URL and its pixel dimensions. */
export interface CapturedSlide {
  /** Image data URL (for example a PNG `data:` URL) ready for `addImage`. */
  dataUrl: string;
  /** Captured image width in pixels. */
  width: number;
  /** Captured image height in pixels. */
  height: number;
}

/**
 * Per-slide frame capturer. Seeks the scene to `time` and returns the still.
 * Injectable so tests avoid a GPU and a DOM.
 */
export type SlideCapturer = (
  scene: SlideCaptureScene,
  time: number,
) => CapturedSlide | Promise<CapturedSlide>;

/** jsPDF measurement unit for page size. */
export type PdfUnit = 'pt' | 'mm' | 'cm' | 'in' | 'px';

/** Page orientation. */
export type PdfOrientation = 'landscape' | 'portrait';

/** jsPDF page format: a named size (`a4`, `letter`) or `[width, height]`. */
export type PdfPageFormat = string | [number, number];

/** Options the PDF factory receives, matching the jsPDF constructor options. */
export interface PdfInitOptions {
  orientation: PdfOrientation;
  unit: PdfUnit;
  format: PdfPageFormat;
}

/**
 * Minimal jsPDF document surface this exporter uses. A real `jsPDF` instance
 * satisfies it; tests pass a recording stub.
 */
export interface PdfDocument {
  addPage(format?: PdfPageFormat, orientation?: PdfOrientation): PdfDocument;
  addImage(data: string, format: string, x: number, y: number, w: number, h: number): PdfDocument;
  setFillColor(r: number, g: number, b: number): PdfDocument;
  rect(x: number, y: number, w: number, h: number, style?: string): PdfDocument;
  output(type: 'blob'): Blob;
  save(filename: string): void;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}

/** Builds a PDF document. Injectable; the default lazy-imports `jspdf`. */
export type PdfFactory = (options: PdfInitOptions) => PdfDocument | Promise<PdfDocument>;

/** Options for {@link exportSlidesToPDF}. */
export interface SlidePdfExportOptions {
  /** Which still of each slide to capture: 'first' or 'last' frame. Default 'last'. */
  still?: 'first' | 'last';
  /** Page orientation. Default 'landscape' (slides are usually wide). */
  orientation?: PdfOrientation;
  /** Page size: a jsPDF format name or `[width, height]` in `unit`. Default 'a4'. */
  pageSize?: PdfPageFormat;
  /** Measurement unit for the page size. Default 'pt'. */
  unit?: PdfUnit;
  /** Page background fill as `[r, g, b]` (0-255). Omit for no fill (white page). */
  background?: [number, number, number];
  /** Image format passed to `addImage`. Default 'PNG'. */
  imageFormat?: string;
  /** DI: PDF document factory. Default lazy-imports `jspdf`. */
  pdfFactory?: PdfFactory;
  /** DI: per-slide frame capturer. Default seeks and reads `canvas.toDataURL`. */
  captureSlide?: SlideCapturer;
  /** Progress callback in `[0, 1]`. */
  onProgress?: (progress: number) => void;
}

/** A placed, aspect-preserving image rectangle inside a page. */
interface FittedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The default image format for `addImage`. */
const DEFAULT_IMAGE_FORMAT = 'PNG';

/**
 * Seek the scene to `time` and capture the current canvas as a PNG data URL.
 *
 * This is the default {@link SlideCapturer}. It needs a scene whose canvas
 * supports `toDataURL`.
 */
function defaultCaptureSlide(scene: SlideCaptureScene, time: number): CapturedSlide {
  scene.seek(time);
  const canvas = scene.getCanvas();
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: scene.getWidth(),
    height: scene.getHeight(),
  };
}

/** Lazy-import `jspdf` and build a document. The default {@link PdfFactory}. */
async function defaultPdfFactory(options: PdfInitOptions): Promise<PdfDocument> {
  const { jsPDF } = await import('jspdf');
  return new jsPDF(options);
}

/**
 * Fit a `imgW x imgH` image into a `pageW x pageH` page, preserving aspect and
 * centering it (letterbox). The result never overflows the page.
 */
function fitInside(imgW: number, imgH: number, pageW: number, pageH: number): FittedRect {
  const safeImgW = imgW > 0 ? imgW : 1;
  const safeImgH = imgH > 0 ? imgH : 1;
  const scale = Math.min(pageW / safeImgW, pageH / safeImgH);
  const w = safeImgW * scale;
  const h = safeImgH * scale;
  return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
}

/** Pick the capture time for a slide, per the `still` option. */
function slideStillTime(slide: SlideBounds, still: 'first' | 'last'): number {
  return still === 'first' ? slide.startTime : slide.endTime;
}

/**
 * Export a slide deck to a PDF, one page per slide.
 *
 * For each slide the scene seeks to the chosen still (first or last frame), the
 * frame is captured, and the image is placed centered on its own page. An empty
 * deck produces no document and resolves to `null`.
 *
 * @param source - The slide source (a `Player` works directly)
 * @param options - Export options
 * @returns A Promise that resolves to the PDF Blob, or `null` for an empty deck
 */
export async function exportSlidesToPDF(
  source: SlideDeckSource,
  options?: SlidePdfExportOptions,
): Promise<Blob | null> {
  const slides = source.timeline.getSlides();
  if (slides.length === 0) return null;

  const still = options?.still ?? 'last';
  const orientation = options?.orientation ?? 'landscape';
  const pageSize = options?.pageSize ?? 'a4';
  const unit = options?.unit ?? 'pt';
  const imageFormat = options?.imageFormat ?? DEFAULT_IMAGE_FORMAT;
  const background = options?.background;
  const capture = options?.captureSlide ?? defaultCaptureSlide;
  const factory = options?.pdfFactory ?? defaultPdfFactory;
  const onProgress = options?.onProgress ?? (() => {});

  const pdf = await factory({ orientation, unit, format: pageSize });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) pdf.addPage(pageSize, orientation);
    if (background) {
      pdf.setFillColor(background[0], background[1], background[2]);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    }
    const captured = await capture(source.scene, slideStillTime(slides[i], still));
    const rect = fitInside(captured.width, captured.height, pageWidth, pageHeight);
    pdf.addImage(captured.dataUrl, imageFormat, rect.x, rect.y, rect.w, rect.h);
    onProgress((i + 1) / slides.length);
  }

  return pdf.output('blob');
}

/**
 * Export a slide deck to a PDF and download it in the browser.
 *
 * Degrades without throwing: when no `document` is available (worker, headless,
 * SSR) it logs a warning and returns. An empty deck is a no-op (no download).
 *
 * @param source - The slide source (a `Player` works directly)
 * @param filename - The download filename. Defaults to 'slides.pdf'.
 * @param options - Export options
 */
export async function exportAndDownloadSlidesToPDF(
  source: SlideDeckSource,
  filename: string = 'slides.pdf',
  options?: SlidePdfExportOptions,
): Promise<void> {
  if (typeof document === 'undefined') {
    logger.warn('exportAndDownloadSlidesToPDF: no DOM available, skipping download.');
    return;
  }
  const blob = await exportSlidesToPDF(source, options);
  if (!blob) return;
  downloadBlob(blob, filename);
}

// ---------------------------------------------------------------------------
// PPTX (optional): pptxgenjs is not a hard dependency.
// ---------------------------------------------------------------------------

/** Options a slide's `addImage` accepts (a subset of pptxgenjs). */
export interface PptxImageOptions {
  data: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sizing?: { type: 'contain' | 'cover' | 'crop'; w: number; h: number };
}

/** Minimal pptxgenjs slide surface this exporter uses. */
export interface PptxSlide {
  addImage(options: PptxImageOptions): void;
  background?: { color: string };
}

/** Minimal pptxgenjs presentation surface this exporter uses. */
export interface PptxDocument {
  addSlide(): PptxSlide;
  write(options: { outputType: 'blob' }): Blob | Promise<Blob>;
  writeFile(options: { fileName: string }): void | Promise<string>;
  defineLayout?(options: { name: string; width: number; height: number }): void;
  layout?: string;
}

/** Builds a PPTX presentation. Injectable; the default optionally imports `pptxgenjs`. */
export type PptxFactory = () => PptxDocument | Promise<PptxDocument>;

/** Options for {@link exportSlidesToPPTX}. */
export interface SlidePptxExportOptions {
  /** Which still of each slide to capture: 'first' or 'last' frame. Default 'last'. */
  still?: 'first' | 'last';
  /** Slide width in inches. Default 13.333 (16:9 wide). */
  slideWidth?: number;
  /** Slide height in inches. Default 7.5 (16:9 wide). */
  slideHeight?: number;
  /** Slide background color as a hex string (no leading '#'), for example 'FFFFFF'. */
  background?: string;
  /** DI: presentation factory. Default optionally imports `pptxgenjs`. */
  pptxFactory?: PptxFactory;
  /** DI: per-slide frame capturer. Default seeks and reads `canvas.toDataURL`. */
  captureSlide?: SlideCapturer;
  /** Progress callback in `[0, 1]`. */
  onProgress?: (progress: number) => void;
}

/**
 * Optionally import `pptxgenjs` and build a presentation. The default
 * {@link PptxFactory}. The specifier is a variable so bundlers leave it as a
 * runtime import and the package stays optional.
 */
async function defaultPptxFactory(): Promise<PptxDocument> {
  const specifier = 'pptxgenjs';
  let mod: { default?: new () => PptxDocument } & (new () => PptxDocument);
  try {
    mod = await import(/* @vite-ignore */ specifier);
  } catch {
    throw new Error(
      'exportSlidesToPPTX needs the optional "pptxgenjs" package. Install it, or pass ' +
        'options.pptxFactory. PDF export (exportSlidesToPDF) needs no extra install.',
    );
  }
  const PptxCtor = mod.default ?? mod;
  return new PptxCtor();
}

/**
 * Export a slide deck to a PPTX presentation, one slide per deck slide.
 *
 * PPTX support is optional: pass `pptxFactory`, or install `pptxgenjs` so the
 * default optional import resolves. Each captured still is placed to fit the
 * slide, preserving aspect. An empty deck resolves to `null`.
 *
 * @param source - The slide source (a `Player` works directly)
 * @param options - Export options
 * @returns A Promise that resolves to the PPTX Blob, or `null` for an empty deck
 */
export async function exportSlidesToPPTX(
  source: SlideDeckSource,
  options?: SlidePptxExportOptions,
): Promise<Blob | null> {
  const slides = source.timeline.getSlides();
  if (slides.length === 0) return null;

  const still = options?.still ?? 'last';
  const slideWidth = options?.slideWidth ?? 13.333;
  const slideHeight = options?.slideHeight ?? 7.5;
  const background = options?.background;
  const capture = options?.captureSlide ?? defaultCaptureSlide;
  const factory = options?.pptxFactory ?? defaultPptxFactory;
  const onProgress = options?.onProgress ?? (() => {});

  const pptx = await factory();

  for (let i = 0; i < slides.length; i++) {
    const slide = pptx.addSlide();
    if (background) slide.background = { color: background };
    const captured = await capture(source.scene, slideStillTime(slides[i], still));
    slide.addImage({
      data: captured.dataUrl,
      x: 0,
      y: 0,
      w: slideWidth,
      h: slideHeight,
      sizing: { type: 'contain', w: slideWidth, h: slideHeight },
    });
    onProgress((i + 1) / slides.length);
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return blob;
}
