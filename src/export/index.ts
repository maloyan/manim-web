export { GifExporter, createGifExporter, type GifExportOptions } from './GifExporter';
export { VideoExporter, createVideoExporter, type VideoExportOptions } from './VideoExporter';

// --- export ergonomics (best-manim) ---
export {
  exportFramePNG,
  exportPNGSequence,
  downloadBlob,
  exportAndDownloadPNG,
  type FrameExportOptions,
  type PNGSequenceOptions,
} from './FrameExporter';
export {
  WebCodecsExporter,
  createWebCodecsExporter,
  type WebCodecsExportOptions,
  type WebCodecsVideoCodec,
} from './WebCodecsExporter';
export { chooseVideoExporterStrategy, type VideoExporterStrategy } from './chooseExporter';
export {
  sceneToSVG,
  exportSVG,
  exportAndDownloadSVG,
  type SvgExportOptions,
  type SvgExportableScene,
  type SvgExportableCamera,
} from './SvgExporter';
export {
  exportSlidesToPDF,
  exportAndDownloadSlidesToPDF,
  exportSlidesToPPTX,
  type SlideBounds,
  type SlideCaptureScene,
  type SlideDeckSource,
  type CapturedSlide,
  type SlideCapturer,
  type PdfUnit,
  type PdfOrientation,
  type PdfPageFormat,
  type PdfInitOptions,
  type PdfDocument,
  type PdfFactory,
  type SlidePdfExportOptions,
  type PptxImageOptions,
  type PptxSlide,
  type PptxDocument,
  type PptxFactory,
  type SlidePptxExportOptions,
} from './SlideDeckExporter';
