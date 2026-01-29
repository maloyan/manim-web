import GIF from 'gif.js';
import { Scene } from '../core/Scene';

interface GifExportOptions {
  fps?: number;              // default 30 (GIFs are typically lower fps)
  quality?: number;          // 1-30, lower is better quality, default 10
  width?: number;            // default scene width
  height?: number;           // default scene height
  duration?: number;         // auto-detect from timeline
  workers?: number;          // default 4
  repeat?: number;           // 0 = loop forever, -1 = no repeat, default 0
  onProgress?: (progress: number) => void;
}

export class GifExporter {
  private _scene: Scene;
  private _options: Required<GifExportOptions>;

  constructor(scene: Scene, options?: GifExportOptions) {
    this._scene = scene;
    this._options = {
      fps: 30,
      quality: 10,
      width: scene.renderer.width,
      height: scene.renderer.height,
      duration: 0,
      workers: 4,
      repeat: 0,
      onProgress: () => {},
      ...options
    };
  }

  /**
   * Export the timeline as a GIF
   */
  async exportTimeline(duration?: number): Promise<Blob> {
    const totalDuration = duration ?? this._options.duration ?? this._getTimelineDuration() ?? 5;
    const totalFrames = Math.ceil(totalDuration * this._options.fps);
    const frameDelay = Math.round(1000 / this._options.fps);

    // Create GIF encoder
    const gif = new GIF({
      workers: this._options.workers,
      quality: this._options.quality,
      width: this._options.width,
      height: this._options.height,
      repeat: this._options.repeat,
      workerScript: this._getWorkerScript(),
    });

    const canvas = this._scene.getCanvas();

    // Capture frames
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / this._options.fps;

      // Seek to time (this also renders the frame)
      this._scene.seek(time);

      // Add frame to GIF
      gif.addFrame(canvas, {
        delay: frameDelay,
        copy: true,
      });

      // Report capture progress (first half of total progress)
      this._options.onProgress((frame / totalFrames) * 0.5);
    }

    // Render GIF
    return new Promise((resolve, reject) => {
      gif.on('progress', (p: number) => {
        // Encoding progress (second half)
        this._options.onProgress(0.5 + p * 0.5);
      });

      gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });

      try {
        gif.render();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get timeline duration if available
   */
  private _getTimelineDuration(): number | null {
    const timeline = this._scene.timeline;
    if (timeline) {
      return timeline.getDuration();
    }
    return null;
  }

  /**
   * Get the worker script URL
   * gif.js requires a worker script for encoding
   */
  private _getWorkerScript(): string {
    // Use CDN for the worker script
    return 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
  }

  /**
   * Download the GIF
   */
  static download(blob: Blob, filename: string = 'animation.gif'): void {
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
   * Convenience method: export and download
   */
  async exportAndDownload(filename: string = 'animation.gif', duration?: number): Promise<void> {
    const blob = await this.exportTimeline(duration);
    GifExporter.download(blob, filename);
  }
}

export function createGifExporter(scene: Scene, options?: GifExportOptions): GifExporter {
  return new GifExporter(scene, options);
}

export type { GifExportOptions };
