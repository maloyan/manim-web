/**
 * FrameExporter - in-browser PNG frame export for manim-web scenes.
 *
 * Captures the scene's WebGL canvas as PNG image data with no ffmpeg and no
 * server round-trip. It uses `canvas.toBlob` when available and falls back to
 * `canvas.toDataURL` so it also works where `toBlob` is missing.
 *
 * Two capture modes are provided:
 *  - `exportFramePNG` captures one frame (the current frame, or a seeked time).
 *  - `exportPNGSequence` seeks and captures one frame per timeline step, the
 *    same frame loop VideoExporter uses.
 */

/**
 * Duck-type interface for Scene, used to avoid a circular import.
 * FrameExporter only needs canvas access, seek, and the timeline duration.
 */
interface ExportableScene {
  getCanvas(): HTMLCanvasElement;
  getWidth(): number;
  getHeight(): number;
  seek(time: number): void;
  getTimelineDuration(): number | null;
}

/** Options for a single-frame PNG capture. */
export interface FrameExportOptions {
  /** Timeline time in seconds to seek to before capture. Omit for current frame. */
  time?: number;
  /** Image MIME type. Defaults to 'image/png'. */
  type?: string;
  /** Quality from 0-1 for lossy types such as 'image/jpeg'. Ignored for PNG. */
  quality?: number;
}

/** Options for a PNG frame-sequence capture. */
export interface PNGSequenceOptions {
  /** Frames per second to sample the timeline at. */
  fps: number;
  /** Start time in seconds. Defaults to 0. */
  from?: number;
  /** End time in seconds. Defaults to the timeline duration (or 5 if unknown). */
  to?: number;
  /** Image MIME type. Defaults to 'image/png'. */
  type?: string;
  /** Quality from 0-1 for lossy types. */
  quality?: number;
  /** Progress callback (0-1). */
  onProgress?: (progress: number) => void;
}

/**
 * Convert a canvas to an image Blob.
 *
 * `canvas.toBlob` is the fast, memory-light path. When it is missing, the
 * function falls back to `canvas.toDataURL` and decodes the data URL to a Blob.
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('canvas.toBlob produced no data'));
          }
        },
        type,
        quality,
      );
      return;
    }

    try {
      const dataUrl = canvas.toDataURL(type, quality);
      resolve(dataURLToBlob(dataUrl));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/** Decode a base64 data URL into a Blob. */
function dataURLToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Export a single frame as a PNG Blob.
 *
 * When `time` is given, the scene seeks to it (which renders the frame) before
 * capture. Otherwise the current frame is captured as-is.
 *
 * @param scene - The scene to capture
 * @param options - Capture options
 * @returns A Promise that resolves to the frame Blob
 */
export async function exportFramePNG(
  scene: ExportableScene,
  options?: FrameExportOptions,
): Promise<Blob> {
  if (options?.time !== undefined) {
    scene.seek(options.time);
  }
  const canvas = scene.getCanvas();
  return canvasToBlob(canvas, options?.type ?? 'image/png', options?.quality);
}

/**
 * Export a range of the timeline as a PNG frame sequence.
 *
 * The loop seeks to each frame time and captures the canvas, mirroring
 * VideoExporter's frame loop. The result is one Blob per frame in order.
 *
 * @param scene - The scene to capture
 * @param options - Sequence options (fps is required)
 * @returns A Promise that resolves to the array of frame Blobs
 */
export async function exportPNGSequence(
  scene: ExportableScene,
  options: PNGSequenceOptions,
): Promise<Blob[]> {
  const fps = options.fps;
  const from = options.from ?? 0;
  const to = options.to ?? scene.getTimelineDuration() ?? 5;
  const type = options.type ?? 'image/png';
  const onProgress = options.onProgress ?? (() => {});

  const duration = Math.max(0, to - from);
  const totalFrames = Math.ceil(duration * fps);
  const frameDuration = 1 / fps;

  const blobs: Blob[] = [];
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = from + frame * frameDuration;
    scene.seek(time);
    const canvas = scene.getCanvas();
    blobs.push(await canvasToBlob(canvas, type, options.quality));
    onProgress((frame + 1) / totalFrames);
  }
  return blobs;
}

/**
 * Download a Blob as a file by clicking a temporary anchor element.
 *
 * @param blob - The blob to download
 * @param filename - The target filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convenience helper: capture one PNG frame and download it.
 *
 * @param scene - The scene to capture
 * @param filename - The target filename. Defaults to 'frame.png'.
 * @param options - Capture options
 */
export async function exportAndDownloadPNG(
  scene: ExportableScene,
  filename: string = 'frame.png',
  options?: FrameExportOptions,
): Promise<void> {
  const blob = await exportFramePNG(scene, options);
  downloadBlob(blob, filename);
}
