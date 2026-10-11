import { logger } from '../utils/logger';

/**
 * WebCodecsExporter - deterministic, high-quality video export for manim-web.
 *
 * Unlike VideoExporter, which records the canvas in real time with
 * `MediaRecorder`, this exporter drives the WebCodecs `VideoEncoder` frame by
 * frame. Each frame is seeked, captured into a `VideoFrame`, encoded, and the
 * encoded chunks are written to an MP4 or WebM container by a muxer. The result
 * is frame-accurate and independent of the display refresh rate.
 *
 * The muxer libraries (`mp4-muxer` / `webm-muxer`) are LAZY-LOADED through a
 * dynamic `import()`, so the base bundle stays light for callers that never
 * export video. The import specifiers are literals so bundlers emit separate
 * lazy chunks and static analysers still see the dependencies as used.
 *
 * When WebCodecs is unavailable, `isSupported()` returns false and `export()`
 * throws a clear error that points the caller to VideoExporter (MediaRecorder).
 */

/**
 * Duck-type interface for Scene, used to avoid a circular import.
 * WebCodecsExporter only needs canvas access, seek, and the timeline duration.
 */
interface ExportableScene {
  getCanvas(): HTMLCanvasElement;
  getWidth(): number;
  getHeight(): number;
  seek(time: number): void;
  getTimelineDuration(): number | null;
}

/** Video codec, shared by the encoder and the container track. */
export type WebCodecsVideoCodec = 'avc' | 'hevc' | 'vp9' | 'av1';

/** Options for configuring WebCodecs video export. */
export interface WebCodecsExportOptions {
  /** Frames per second. Defaults to 60. */
  fps?: number;
  /** Container format. Defaults to 'mp4'. */
  format?: 'mp4' | 'webm';
  /** Video codec. Defaults to 'avc' for mp4 and 'vp9' for webm. */
  codec?: WebCodecsVideoCodec;
  /** Target bitrate in bits per second. Defaults to 5_000_000. */
  bitrate?: number;
  /** Output width in pixels. Defaults to scene width. */
  width?: number;
  /** Output height in pixels. Defaults to scene height. */
  height?: number;
  /** Duration in seconds. Auto-detects from the timeline if not specified. */
  duration?: number;
  /** Frames between key frames. Defaults to the frame rate (one per second). */
  keyFrameInterval?: number;
  /** Progress callback (0-1). */
  onProgress?: (progress: number) => void;
}

interface ResolvedWebCodecsExportOptions {
  fps: number;
  format: 'mp4' | 'webm';
  codec: WebCodecsVideoCodec;
  bitrate: number;
  width: number;
  height: number;
  duration: number;
  keyFrameInterval: number;
  onProgress: (progress: number) => void;
}

/** Codec strings for the WebCodecs encoder and the two container formats. */
interface CodecMapping {
  /** VideoEncoder `codec` string. */
  encoderCodec: string;
  /** mp4-muxer video track codec. */
  mp4Codec: WebCodecsVideoCodec;
  /** webm-muxer video track codec (Matroska codec id). */
  webmCodec: string;
}

const CODEC_TABLE: Record<WebCodecsVideoCodec, CodecMapping> = {
  avc: { encoderCodec: 'avc1.42001f', mp4Codec: 'avc', webmCodec: 'V_MPEG4/ISO/AVC' },
  hevc: { encoderCodec: 'hev1.1.6.L93.B0', mp4Codec: 'hevc', webmCodec: 'V_MPEGH/ISO/HEVC' },
  vp9: { encoderCodec: 'vp09.00.10.08', mp4Codec: 'vp9', webmCodec: 'V_VP9' },
  av1: { encoderCodec: 'av01.0.04M.08', mp4Codec: 'av1', webmCodec: 'V_AV1' },
};

/** A container-agnostic handle over the lazily imported muxer. */
interface MuxerHandle {
  addVideoChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void;
  finalize: () => Blob;
}

/**
 * Deterministic WebCodecs-based video exporter for manim-web scenes.
 */
export class WebCodecsExporter {
  private _scene: ExportableScene;
  private _options: ResolvedWebCodecsExportOptions;

  /**
   * Create a new WebCodecsExporter.
   * @param scene - The scene to export
   * @param options - Export options
   */
  constructor(scene: ExportableScene, options?: WebCodecsExportOptions) {
    this._scene = scene;
    const fps = options?.fps ?? 60;
    const format = options?.format ?? 'mp4';
    this._options = {
      fps,
      format,
      codec: options?.codec ?? (format === 'webm' ? 'vp9' : 'avc'),
      bitrate: options?.bitrate ?? 5_000_000,
      width: options?.width ?? scene.getWidth(),
      height: options?.height ?? scene.getHeight(),
      duration: options?.duration ?? 0,
      keyFrameInterval: options?.keyFrameInterval ?? Math.max(1, Math.round(fps)),
      onProgress: options?.onProgress ?? (() => {}),
    };
  }

  /**
   * Feature-detect WebCodecs. Returns true when `VideoEncoder` is available.
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.VideoEncoder !== 'undefined';
  }

  /**
   * Export the scene to a video Blob.
   *
   * Seeks and captures one `VideoFrame` per timeline frame, encodes it with the
   * WebCodecs `VideoEncoder`, and muxes the encoded chunks into the configured
   * container.
   *
   * @returns A Promise that resolves to the video Blob
   * @throws Error if WebCodecs is unavailable (use VideoExporter instead)
   */
  async export(): Promise<Blob> {
    if (!WebCodecsExporter.isSupported()) {
      throw new Error(
        'WebCodecs VideoEncoder is not available in this environment. ' +
          'Use VideoExporter (MediaRecorder) instead to export video.',
      );
    }

    const o = this._options;
    const totalDuration = o.duration || this._scene.getTimelineDuration() || 5;
    const totalFrames = Math.ceil(totalDuration * o.fps);
    const mapping = CODEC_TABLE[o.codec];

    const muxer = await this._createMuxer(mapping);

    const encoder = new window.VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (err: DOMException) => logger.error('WebCodecs encoder error:', err),
    });

    const config: VideoEncoderConfig = {
      codec: mapping.encoderCodec,
      width: o.width,
      height: o.height,
      bitrate: o.bitrate,
      framerate: o.fps,
    };
    // mp4 playback needs AVCC-formatted chunks rather than Annex-B.
    if (o.codec === 'avc') {
      config.avc = { format: 'avc' };
    }
    encoder.configure(config);

    const canvas = this._scene.getCanvas();
    const frameDurationUs = Math.round(1_000_000 / o.fps);

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / o.fps;
      this._scene.seek(time);

      const videoFrame = new window.VideoFrame(canvas, {
        timestamp: Math.round(time * 1_000_000),
        duration: frameDurationUs,
      });
      encoder.encode(videoFrame, { keyFrame: frame % o.keyFrameInterval === 0 });
      videoFrame.close();

      o.onProgress(totalFrames === 0 ? 1 : (frame + 1) / totalFrames);
    }

    await encoder.flush();
    encoder.close();

    return muxer.finalize();
  }

  /**
   * Lazily import the muxer for the configured container and wrap it in a
   * container-agnostic handle.
   */
  private async _createMuxer(mapping: CodecMapping): Promise<MuxerHandle> {
    const o = this._options;
    const videoCommon = { width: o.width, height: o.height, frameRate: o.fps };

    if (o.format === 'webm') {
      const { Muxer, ArrayBufferTarget } = await import('webm-muxer');
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: mapping.webmCodec, ...videoCommon },
        firstTimestampBehavior: 'offset',
      });
      return {
        addVideoChunk: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        finalize: () => {
          muxer.finalize();
          return new Blob([target.buffer], { type: 'video/webm' });
        },
      };
    }

    const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: mapping.mp4Codec, ...videoCommon },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    return {
      addVideoChunk: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      finalize: () => {
        muxer.finalize();
        return new Blob([target.buffer], { type: 'video/mp4' });
      },
    };
  }

  /**
   * Get the resolved export options.
   */
  getOptions(): Readonly<ResolvedWebCodecsExportOptions> {
    return { ...this._options };
  }
}

/**
 * Factory function to create a WebCodecsExporter.
 * @param scene - The scene to export
 * @param options - Export options
 * @returns A new WebCodecsExporter instance
 */
export function createWebCodecsExporter(
  scene: ExportableScene,
  options?: WebCodecsExportOptions,
): WebCodecsExporter {
  return new WebCodecsExporter(scene, options);
}
