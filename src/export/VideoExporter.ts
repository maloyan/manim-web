import { Scene } from '../core/Scene';

/**
 * Options for configuring video export.
 */
export interface VideoExportOptions {
  /** Frames per second. Defaults to 60. */
  fps?: number;
  /** Quality from 0-1. Defaults to 0.9. */
  quality?: number;
  /** Video format. Defaults to 'webm' (mp4 requires additional browser codec support). */
  format?: 'webm' | 'mp4';
  /** Output width in pixels. Defaults to scene width. */
  width?: number;
  /** Output height in pixels. Defaults to scene height. */
  height?: number;
  /** Duration in seconds. Auto-detects from timeline if not specified. */
  duration?: number;
  /** Progress callback (0-1). */
  onProgress?: (progress: number) => void;
}

interface ResolvedVideoExportOptions {
  fps: number;
  quality: number;
  format: 'webm' | 'mp4';
  width: number;
  height: number;
  duration: number;
  onProgress: (progress: number) => void;
}

/**
 * Video exporter for manimweb scenes.
 * Uses the MediaRecorder API for browser-native recording.
 *
 * WebM with VP9 has the best browser support.
 * MP4 encoding requires browser support (limited availability).
 *
 * Frame-by-frame export gives consistent results vs real-time recording.
 */
export class VideoExporter {
  private _scene: Scene;
  private _options: ResolvedVideoExportOptions;
  private _mediaRecorder: MediaRecorder | null = null;
  private _recordedChunks: Blob[] = [];
  private _isRecording: boolean = false;

  /**
   * Create a new VideoExporter.
   * @param scene - The scene to export
   * @param options - Export options
   */
  constructor(scene: Scene, options?: VideoExportOptions) {
    this._scene = scene;
    this._options = {
      fps: options?.fps ?? 60,
      quality: options?.quality ?? 0.9,
      format: options?.format ?? 'webm',
      width: options?.width ?? scene.getWidth(),
      height: options?.height ?? scene.getHeight(),
      duration: options?.duration ?? 0,
      onProgress: options?.onProgress ?? (() => {}),
    };
  }

  /**
   * Start recording the scene.
   * @throws Error if already recording or format not supported
   */
  async startRecording(): Promise<void> {
    if (this._isRecording) {
      throw new Error('Already recording');
    }

    const canvas = this._scene.getCanvas();
    const stream = canvas.captureStream(this._options.fps);

    // Determine codec based on format
    const mimeType = this._options.format === 'webm'
      ? 'video/webm;codecs=vp9'
      : 'video/mp4';  // Note: MP4 support varies by browser

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`Format ${mimeType} is not supported by this browser`);
    }

    this._recordedChunks = [];
    this._mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: Math.floor(this._options.quality * 10_000_000),
    });

    this._mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this._recordedChunks.push(event.data);
      }
    };

    this._mediaRecorder.start();
    this._isRecording = true;
  }

  /**
   * Stop recording and return the video blob.
   * @returns Promise resolving to the video Blob
   * @throws Error if not recording
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this._mediaRecorder || !this._isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this._mediaRecorder.onstop = () => {
        const mimeType = this._options.format === 'webm'
          ? 'video/webm'
          : 'video/mp4';
        const blob = new Blob(this._recordedChunks, { type: mimeType });
        this._isRecording = false;
        resolve(blob);
      };

      this._mediaRecorder.stop();
    });
  }

  /**
   * Export a specific duration of the timeline.
   * Renders frame-by-frame for consistent results.
   * @param duration - Duration to export in seconds (auto-detects from timeline if not specified)
   * @returns Promise resolving to the video Blob
   */
  async exportTimeline(duration?: number): Promise<Blob> {
    const totalDuration = duration ?? this._options.duration ?? this._scene.getTimelineDuration() ?? 5;
    const totalFrames = Math.ceil(totalDuration * this._options.fps);
    const frameDuration = 1 / this._options.fps;

    await this.startRecording();

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame * frameDuration;

      // Seek to time and render
      this._scene.seek(time);
      this._scene.render();  // Force render

      // Small delay to ensure frame is captured
      await new Promise(r => setTimeout(r, 16));

      this._options.onProgress(frame / totalFrames);
    }

    return this.stopRecording();
  }

  /**
   * Download a video blob as a file.
   * @param blob - The video blob to download
   * @param filename - The filename (defaults to 'animation.webm')
   */
  static download(blob: Blob, filename: string = 'animation.webm'): void {
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
   * Convenience method: export timeline and download the result.
   * @param filename - Optional filename (extension auto-added based on format)
   * @param duration - Optional duration override
   */
  async exportAndDownload(filename?: string, duration?: number): Promise<void> {
    const blob = await this.exportTimeline(duration);
    const ext = this._options.format === 'webm' ? '.webm' : '.mp4';
    VideoExporter.download(blob, filename ?? `animation${ext}`);
  }

  /**
   * Check if currently recording.
   * @returns true if recording is in progress
   */
  isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Get the export options.
   * @returns The resolved export options
   */
  getOptions(): Readonly<ResolvedVideoExportOptions> {
    return { ...this._options };
  }
}

/**
 * Factory function to create a VideoExporter.
 * @param scene - The scene to export
 * @param options - Export options
 * @returns A new VideoExporter instance
 */
export function createVideoExporter(scene: Scene, options?: VideoExportOptions): VideoExporter {
  return new VideoExporter(scene, options);
}
