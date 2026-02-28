import { Scene } from '../core/Scene';
import { AudioManager } from '../core/AudioManager';

/**
 * Options for configuring video export.
 */
export interface VideoExportOptions {
  /** Frames per second. Defaults to 60. */
  fps?: number;
  /** Quality from 0-1. Defaults to 0.9. */
  quality?: number;
  /** Video format. Defaults to 'webm' (mp4/mov require additional browser codec support). */
  format?: 'webm' | 'mp4' | 'mov';
  /** Output width in pixels. Defaults to scene width. */
  width?: number;
  /** Output height in pixels. Defaults to scene height. */
  height?: number;
  /** Duration in seconds. Auto-detects from timeline if not specified. */
  duration?: number;
  /** Progress callback (0-1). */
  onProgress?: (progress: number) => void;
  /**
   * Include audio from the scene's AudioManager in the exported video.
   * Defaults to true when the scene has audio tracks loaded.
   */
  includeAudio?: boolean;
  /**
   * Provide an external AudioManager to use for the audio track.
   * If not specified, the scene's audioManager is used.
   */
  audioManager?: AudioManager;
}

interface ResolvedVideoExportOptions {
  fps: number;
  quality: number;
  format: 'webm' | 'mp4' | 'mov';
  width: number;
  height: number;
  duration: number;
  onProgress: (progress: number) => void;
  includeAudio: boolean;
  audioManager: AudioManager | null;
}

/**
 * Video exporter for manimweb scenes.
 * Uses the MediaRecorder API for browser-native recording.
 *
 * WebM with VP9 has the best browser support.
 * MP4 encoding requires browser support (limited availability).
 *
 * Frame-by-frame export gives consistent results vs real-time recording.
 *
 * When `includeAudio` is true (default when audio tracks exist), the exported
 * video includes the mixed-down audio from the scene's AudioManager.
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
      includeAudio: options?.includeAudio ?? true,
      audioManager: options?.audioManager ?? null,
    };
  }

  /**
   * Get the AudioManager to use for export.
   * Returns the explicitly provided one, or the scene's manager if it has tracks.
   */
  private _getAudioManager(): AudioManager | null {
    if (this._options.audioManager) return this._options.audioManager;
    // Access the scene's audio manager only if it has tracks
    // (audioManager getter is lazy, so we check the private field indirectly
    // by trying the public getter and checking track count)
    try {
      const am = this._scene.audioManager;
      return am.tracks.length > 0 ? am : null;
    } catch {
      return null;
    }
  }

  /**
   * Start recording the scene.
   * If audio is available and `includeAudio` is true, the audio stream
   * is merged into the recording.
   * @throws Error if already recording or format not supported
   */
  async startRecording(): Promise<void> {
    if (this._isRecording) {
      throw new Error('Already recording');
    }

    const canvas = this._scene.getCanvas();
    const videoStream = canvas.captureStream(this._options.fps);

    // Merge audio tracks into the stream if available
    const audioManager = this._options.includeAudio ? this._getAudioManager() : null;
    let combinedStream: MediaStream;

    if (audioManager && audioManager.tracks.length > 0) {
      // Create a stream destination from the audio manager and merge tracks
      const audioDest = audioManager.createStreamDestination();
      const audioTracks = audioDest.stream.getAudioTracks();
      combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
    } else {
      combinedStream = videoStream;
    }

    // Determine codec based on format
    let mimeType: string;
    if (this._options.format === 'webm') {
      mimeType = 'video/webm;codecs=vp9';
    } else if (this._options.format === 'mov') {
      if (MediaRecorder.isTypeSupported('video/quicktime')) {
        mimeType = 'video/quicktime';
      } else {
        console.warn('MOV format not supported by this browser, falling back to WebM');
        mimeType = 'video/webm;codecs=vp9';
      }
    } else {
      mimeType = 'video/mp4'; // Note: MP4 support varies by browser
    }

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error(`Format ${mimeType} is not supported by this browser`);
    }

    this._recordedChunks = [];
    this._mediaRecorder = new MediaRecorder(combinedStream, {
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
        let mimeType: string;
        if (this._options.format === 'webm') {
          mimeType = 'video/webm';
        } else if (this._options.format === 'mov') {
          mimeType = 'video/quicktime';
        } else {
          mimeType = 'video/mp4';
        }
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
   *
   * If the scene has audio and `includeAudio` is true, audio is included
   * in the exported video file.
   *
   * @param duration - Duration to export in seconds (auto-detects from timeline if not specified)
   * @returns Promise resolving to the video Blob
   */
  async exportTimeline(duration?: number): Promise<Blob> {
    const totalDuration =
      duration ?? this._options.duration ?? this._scene.getTimelineDuration() ?? 5;
    const totalFrames = Math.ceil(totalDuration * this._options.fps);
    const frameDuration = 1 / this._options.fps;

    // Start audio playback for real-time recording mux
    const audioManager = this._options.includeAudio ? this._getAudioManager() : null;
    if (audioManager && audioManager.tracks.length > 0) {
      audioManager.seek(0);
    }

    await this.startRecording();

    // If we have audio, start it playing so the MediaRecorder captures it
    if (audioManager && audioManager.tracks.length > 0) {
      audioManager.play();
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame * frameDuration;

      // Seek to time and render
      this._scene.seek(time);
      this._scene.render(); // Force render

      // Small delay to ensure frame is captured
      await new Promise((r) => setTimeout(r, 16));

      this._options.onProgress(frame / totalFrames);
    }

    // Stop audio if it was started
    if (audioManager && audioManager.isPlaying) {
      audioManager.stop();
    }

    return this.stopRecording();
  }

  /**
   * Export audio-only as a WAV Blob.
   * Useful when you need the audio track separately (e.g., for external muxing).
   *
   * @param duration - Duration in seconds (defaults to timeline duration)
   * @returns WAV Blob, or null if no audio is available
   */
  async exportAudio(duration?: number): Promise<Blob | null> {
    const audioManager = this._getAudioManager();
    if (!audioManager || audioManager.tracks.length === 0) return null;

    const totalDuration =
      duration ?? this._options.duration ?? this._scene.getTimelineDuration() ?? 5;
    return audioManager.exportWAV(totalDuration);
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
    const extMap: Record<string, string> = { webm: '.webm', mp4: '.mp4', mov: '.mov' };
    const ext = extMap[this._options.format] ?? '.webm';
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
