import { logger } from '../utils/logger';
import { requireAlphaRenderer, withTransparentClear, type AlphaRenderer } from './alphaBackground';
import { addAudioEditList } from './mp4EditList';
import {
  encodeAudioChannels,
  planAudioTrack,
  renderAudioChannels,
  type AudioMixdownSource,
  type AudioTrackPlan,
} from './webCodecsAudio';

export type { AudioMixdownSource, WebCodecsAudioCodec } from './webCodecsAudio';

/**
 * WebCodecsExporter - deterministic, high-quality video export for manim-web.
 *
 * Unlike VideoExporter, which records the canvas in real time with
 * `MediaRecorder`, this exporter drives the WebCodecs `VideoEncoder` frame by
 * frame. Each frame is seeked, captured into a `VideoFrame`, encoded, and the
 * encoded chunks are written to an MP4 or WebM container by a muxer. The result
 * is frame-accurate and independent of the display refresh rate.
 *
 * When the scene's AudioManager has clips (or `includeAudio` is true), the
 * exporter also writes an audio track: the whole audio timeline is mixed down
 * with `AudioManager.mixdown`, encoded with the WebCodecs `AudioEncoder` (AAC
 * in mp4, Opus in webm), and muxed next to the video. The audio track starts at
 * timeline time 0 and has the same length as the video, so the two stay in
 * sync. When the browser cannot encode the audio codec, the export holds video
 * only and logs one warning.
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
  /** The WebGL renderer, used only for transparent (alpha) export. */
  renderer?: { getThreeRenderer(): AlphaRenderer } | null;
  /** The scene's audio timeline, used for the audio track. */
  readonly audioManager?: AudioMixdownSource;
  /** The audio manager if the scene already created one (no lazy creation). */
  readonly audioManagerIfCreated?: AudioMixdownSource | null;
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
  /**
   * Export with a transparent background, so the video carries an alpha
   * channel to composite over other footage. Defaults to false.
   *
   * Alpha needs the 'webm' format with the 'vp9' codec, because only that path
   * carries an alpha side channel. When `alpha` is set and `format`/`codec` are
   * not given, they default to 'webm' and 'vp9'. It also needs a Scene created
   * with `{ alpha: true }` (or `backgroundOpacity < 1`) and a browser that can
   * encode VP9 with alpha. When any requirement is unmet, `export()` throws a
   * clear error instead of producing opaque video that claims transparency.
   * A transparent export keeps its audio: an Opus track next to the VP9 video.
   */
  alpha?: boolean;
  /**
   * Include an audio track mixed down from the AudioManager. Defaults to true
   * when the AudioManager has clips at the start of the export, else false.
   *
   * In mp4 the track is AAC. The AAC encoder adds priming samples in front;
   * the exporter keeps every source sample and writes an edit list that tells
   * the player to skip the priming. A player that ignores mp4 edit lists plays
   * the audio about 44 ms (2112 samples at 48 kHz) late.
   *
   * In webm the track is Opus. webm-muxer writes no end trimming, so the
   * decoded audio ends on a whole 20 ms Opus frame: up to 20 ms longer than
   * the video, never shorter.
   */
  includeAudio?: boolean;
  /**
   * An external AudioManager for the audio track. When not given, the scene's
   * `audioManager` is used.
   */
  audioManager?: AudioMixdownSource;
  /** Audio bitrate in bits per second. Defaults to 128_000. */
  audioBitrate?: number;
  /** Audio sample rate in Hz. Defaults to 48_000 (Opus needs 48 kHz). */
  audioSampleRate?: number;
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
  alpha: boolean;
  includeAudio: boolean | undefined;
  audioManager: AudioMixdownSource | null;
  audioBitrate: number;
  audioSampleRate: number;
}

/**
 * A frame-by-frame capture in progress. The caller moves the scene to the next
 * frame state by any means (for example a fake clock that drives the live
 * `play()` loop), then calls `captureFrame()`. Frame `i` gets timestamp `i/fps`.
 *
 * `captureFrame()` waits for encoder queue capacity after it reads the canvas.
 * The caller must keep the scene from advancing until that promise settles
 * (the render script steps a paused fake clock): a running scene could
 * otherwise finish an animation and change the next frame's state.
 */
export interface WebCodecsCaptureSession {
  /**
   * Encode the canvas as it is now as the next frame. The canvas is read
   * synchronously, inside this call, before the promise waits for encoder
   * queue capacity: later redraws do not reach this frame.
   */
  captureFrame(): Promise<void>;
  /** Frames captured so far. */
  readonly frameCount: number;
  /** Whether the output gets an audio track. */
  readonly hasAudio: boolean;
  /**
   * Flush the encoders, add the audio track (`frameCount / fps` seconds long),
   * and return the container Blob.
   */
  finish(): Promise<Blob>;
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

/** H.264 levels: [level_idc, max macroblocks per frame, max macroblocks per second]. */
const AVC_LEVELS: ReadonlyArray<readonly [number, number, number]> = [
  [0x1f, 3600, 108_000], // 3.1
  [0x28, 8192, 245_760], // 4.0
  [0x2a, 8704, 522_240], // 4.2
  [0x32, 22_080, 589_824], // 5.0
  [0x33, 36_864, 983_040], // 5.1
  [0x34, 36_864, 2_073_600], // 5.2
];

/**
 * The H.264 codec string with the lowest level that fits the frame size and
 * rate. Level 3.1 (the old fixed value) stops at 1280x720, so a 1080x1080
 * export needs level 4.0.
 *
 * @post result.startsWith('avc1.4200')
 */
export function avcCodecString(width: number, height: number, fps: number): string {
  const mbPerFrame = Math.ceil(width / 16) * Math.ceil(height / 16);
  const mbPerSecond = mbPerFrame * fps;
  const level =
    AVC_LEVELS.find(([, frame, second]) => mbPerFrame <= frame && mbPerSecond <= second) ??
    AVC_LEVELS[AVC_LEVELS.length - 1];
  return `avc1.4200${level[0].toString(16).padStart(2, '0')}`;
}

/**
 * Fill in the defaults. Alpha needs webm + vp9, so an unspecified format and
 * codec default there when `alpha` is set.
 */
function resolveOptions(
  scene: ExportableScene,
  options: WebCodecsExportOptions,
): ResolvedWebCodecsExportOptions {
  // Read each option by name with a nullish default, as the exporter always
  // did: a getter or an inherited property counts, and null means "default".
  const fps = options.fps ?? 60;
  const alpha = options.alpha ?? false;
  const format = options.format ?? (alpha ? 'webm' : 'mp4');
  return {
    fps,
    format,
    codec: options.codec ?? (format === 'webm' ? 'vp9' : 'avc'),
    bitrate: options.bitrate ?? 5_000_000,
    width: options.width ?? scene.getWidth(),
    height: options.height ?? scene.getHeight(),
    duration: options.duration ?? 0,
    keyFrameInterval: options.keyFrameInterval ?? Math.max(1, Math.round(fps)),
    onProgress: options.onProgress ?? (() => {}),
    alpha,
    ...resolveAudioOptions(options),
  };
}

/** The audio options, each read by name with a nullish default. */
function resolveAudioOptions(
  options: WebCodecsExportOptions,
): Pick<
  ResolvedWebCodecsExportOptions,
  'includeAudio' | 'audioManager' | 'audioBitrate' | 'audioSampleRate'
> {
  return {
    includeAudio: options.includeAudio ?? undefined,
    audioManager: options.audioManager ?? null,
    audioBitrate: options.audioBitrate ?? 128_000,
    audioSampleRate: options.audioSampleRate ?? 48_000,
  };
}

/** Max encoder queue depth before a capture waits, so frames do not pile up in memory. */
const MAX_ENCODE_QUEUE = 8;

/** A container-agnostic handle over the lazily imported muxer. */
interface MuxerHandle {
  addVideoChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void;
  addAudioChunk: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void;
  /** Close the file. `audioSeconds` is the length of the audio track, if any. */
  finalize: (audioSeconds?: number) => Blob;
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
    this._options = resolveOptions(scene, options ?? {});
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
   * container, together with the audio track when there is one.
   *
   * @returns A Promise that resolves to the video Blob
   * @throws Error if WebCodecs is unavailable (use VideoExporter instead)
   */
  async export(): Promise<Blob> {
    this._assertSupported();
    const o = this._options;
    const totalDuration = o.duration || this._scene.getTimelineDuration() || 5;
    const totalFrames = Math.ceil(totalDuration * o.fps);

    // For a transparent export, validate the codec, the scene's alpha context,
    // and the browser's alpha encode support before any frame work begins.
    let alphaRenderer: AlphaRenderer | null = null;
    if (o.alpha) {
      this._assertAlphaCodec();
      alphaRenderer = requireAlphaRenderer(this._scene);
      await this._assertAlphaEncodeSupport(this._encoderCodec());
    }

    const { session, captureNow } = await this._openSession(totalFrames);

    // A synchronous loop, as on main: no await between the first seek and the
    // last capture, so a running scene (its render loop, a finishing play()
    // and its cleanup) gets no turn and cannot change what a frame shows. The
    // encoder queue may grow meanwhile; it drains in finish().
    const encodeFrames = (): void => {
      for (let frame = 0; frame < totalFrames; frame++) {
        this._scene.seek(frame / o.fps);
        captureNow();
        o.onProgress(totalFrames === 0 ? 1 : (frame + 1) / totalFrames);
      }
    };

    if (alphaRenderer) {
      await withTransparentClear(alphaRenderer, encodeFrames);
    } else {
      encodeFrames();
    }

    return session.finish();
  }

  /**
   * Start a frame-by-frame capture of the scene canvas, for a scene that the
   * caller moves forward itself (for example the live `play()` loop under a
   * fake clock). Transparent (alpha) export is only available through
   * {@link export}.
   *
   * @throws Error if WebCodecs is unavailable or `alpha` is set
   */
  async startCapture(): Promise<WebCodecsCaptureSession> {
    this._assertSupported();
    if (this._options.alpha) {
      throw new Error('startCapture() does not support alpha export; use export() instead.');
    }
    return (await this._openSession()).session;
  }

  private _assertSupported(): void {
    if (!WebCodecsExporter.isSupported()) {
      throw new Error(
        'WebCodecs VideoEncoder is not available in this environment. ' +
          'Use VideoExporter (MediaRecorder) instead to export video.',
      );
    }
  }

  /**
   * Mix and encode the audio track of an export of known length.
   *
   * @returns The encoded chunks, or null (after one `logger.warn`) when the
   *   encode fails and the track was added by default. Then the export goes on
   *   without an audio track, as an export without audio support would.
   * @throws The encode error when the caller set `includeAudio: true`.
   */
  private async _preEncodeAudio(
    audio: { plan: AudioTrackPlan; source: AudioMixdownSource },
    seconds: number,
  ): Promise<Array<{ chunk: EncodedAudioChunk; meta?: EncodedAudioChunkMetadata }> | null> {
    const chunks: Array<{ chunk: EncodedAudioChunk; meta?: EncodedAudioChunkMetadata }> = [];
    try {
      const channels = await renderAudioChannels(audio.source, seconds, audio.plan);
      await encodeAudioChannels(channels, audio.plan, (chunk, meta) =>
        chunks.push({ chunk, meta }),
      );
      return chunks;
    } catch (err) {
      if (this._options.includeAudio === true) throw err;
      logger.warn('Audio encoding failed; exporting the video without an audio track:', err);
      return null;
    }
  }

  /** The audio source for the audio track, or null when there is none. */
  private _audioSource(): AudioMixdownSource | null {
    if (this._options.audioManager) return this._options.audioManager;
    const scene = this._scene;
    // Without an explicit includeAudio, do not create a lazy audio manager
    // (as on main): a later Scene.play() would then open an AudioContext.
    if (this._options.includeAudio === undefined && 'audioManagerIfCreated' in scene) {
      return scene.audioManagerIfCreated ?? null;
    }
    try {
      return scene.audioManager ?? null;
    } catch (err) {
      logger.warn('AudioManager unavailable; exporting without audio:', err);
      return null;
    }
  }

  /** Decide on the audio track and check that the browser can encode it. */
  private async _planAudio(): Promise<{ plan: AudioTrackPlan; source: AudioMixdownSource } | null> {
    const o = this._options;
    if (o.includeAudio === false) return null;
    const source = this._audioSource();
    if (!source) return null;
    if (o.includeAudio === undefined && source.tracks.length === 0) return null;
    const plan = await planAudioTrack(o.format, o.audioSampleRate, o.audioBitrate);
    return plan ? { plan, source } : null;
  }

  private _encoderCodec(): string {
    const o = this._options;
    return o.codec === 'avc'
      ? avcCodecString(o.width, o.height, o.fps)
      : CODEC_TABLE[o.codec].encoderCodec;
  }

  /**
   * Create the muxer and the video encoder. Returns the capture session and
   * `captureNow`, which snapshots and encodes one frame synchronously, with no
   * wait for queue capacity (the `export()` loop).
   */
  private async _openSession(knownFrames?: number): Promise<{
    session: WebCodecsCaptureSession;
    captureNow: () => void;
  }> {
    const o = this._options;
    const planned = await this._planAudio();
    // export() knows its length before the first frame, so its audio is encoded
    // first. If that fails, the muxer gets no audio track at all and the file
    // is a plain video file. (A track that is declared but has no chunk has no
    // codec header, and some demuxers then reject the whole file.)
    const preEncoded =
      planned && knownFrames !== undefined
        ? await this._preEncodeAudio(planned, knownFrames / o.fps)
        : null;
    const audio = knownFrames !== undefined && !preEncoded ? null : planned;
    const muxer = await this._createMuxer(CODEC_TABLE[o.codec], audio?.plan ?? null);

    let encoderError: unknown = null;
    const encoder = new window.VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (err: DOMException) => {
        encoderError = err;
        logger.error('WebCodecs encoder error:', err);
      },
    });

    const config: VideoEncoderConfig = {
      codec: this._encoderCodec(),
      width: o.width,
      height: o.height,
      bitrate: o.bitrate,
      framerate: o.fps,
    };
    // mp4 playback needs AVCC-formatted chunks rather than Annex-B.
    if (o.codec === 'avc') {
      config.avc = { format: 'avc' };
    }
    // Keep the alpha channel through the encoder for a transparent export.
    if (o.alpha) {
      config.alpha = 'keep';
    }
    encoder.configure(config);

    const canvas = this._scene.getCanvas();
    const frameDurationUs = Math.round(1_000_000 / o.fps);
    let frameCount = 0;

    /** Snapshot the canvas as the next frame (synchronous). */
    const snapshot = (): { videoFrame: VideoFrame; keyFrame: boolean } => {
      if (encoderError) throw encoderError;
      const frame = frameCount++;
      const videoFrame = new window.VideoFrame(canvas, {
        timestamp: Math.round((frame / o.fps) * 1_000_000),
        duration: frameDurationUs,
        alpha: o.alpha ? 'keep' : 'discard',
      });
      return { videoFrame, keyFrame: frame % o.keyFrameInterval === 0 };
    };

    const captureNow = (): void => {
      const { videoFrame, keyFrame } = snapshot();
      try {
        encoder.encode(videoFrame, { keyFrame });
      } finally {
        videoFrame.close();
      }
    };

    const captureFrame = async (): Promise<void> => {
      // Snapshot before any await, then wait for queue capacity.
      const { videoFrame, keyFrame } = snapshot();
      try {
        await waitForEncodeQueue(encoder);
        if (encoderError) throw encoderError;
        encoder.encode(videoFrame, { keyFrame });
      } finally {
        videoFrame.close();
      }
    };

    const finish = async (): Promise<Blob> => {
      await encoder.flush();
      encoder.close();
      if (encoderError) throw encoderError;
      if (preEncoded) {
        for (const { chunk, meta } of preEncoded) muxer.addAudioChunk(chunk, meta);
      } else if (audio) {
        // A capture session gets its clips while it runs, so its audio is
        // encoded here. A failure rejects: the caller drives the capture and
        // must not get a silent file without knowing.
        const channels = await renderAudioChannels(audio.source, frameCount / o.fps, audio.plan);
        await encodeAudioChannels(channels, audio.plan, (chunk, meta) =>
          muxer.addAudioChunk(chunk, meta),
        );
      }
      return muxer.finalize(audio ? frameCount / o.fps : undefined);
    };

    const session: WebCodecsCaptureSession = {
      captureFrame,
      finish,
      hasAudio: audio !== null,
      get frameCount() {
        return frameCount;
      },
    };
    return { session, captureNow };
  }

  /**
   * Validate that the configured codec and format can carry an alpha channel.
   *
   * Only webm with vp9 carries an alpha side channel, so any other combination
   * cannot produce a transparent video.
   *
   * @throws Error when the format or codec cannot carry alpha
   */
  private _assertAlphaCodec(): void {
    const o = this._options;
    if (o.format !== 'webm' || o.codec !== 'vp9') {
      throw new Error(
        `Alpha (transparent) video export needs format 'webm' with the 'vp9' ` +
          `codec, because only that path carries an alpha side channel. Got ` +
          `format '${o.format}' with codec '${o.codec}'. Set { alpha: true } ` +
          `without overriding format/codec, or set format: 'webm', codec: 'vp9'.`,
      );
    }
  }

  /**
   * Check that the browser can encode the codec with an alpha channel.
   *
   * Uses `VideoEncoder.isConfigSupported` when available. When the browser
   * reports the alpha config as unsupported, this throws rather than silently
   * producing opaque video. When detection is unavailable, it proceeds and
   * lets the encoder's error callback surface any failure.
   *
   * @param encoderCodec - The VideoEncoder codec string
   * @throws Error when the browser cannot encode the codec with alpha
   */
  private async _assertAlphaEncodeSupport(encoderCodec: string): Promise<void> {
    const o = this._options;
    const videoEncoder = window.VideoEncoder;
    if (typeof videoEncoder.isConfigSupported !== 'function') {
      return;
    }
    const support = await videoEncoder.isConfigSupported({
      codec: encoderCodec,
      width: o.width,
      height: o.height,
      bitrate: o.bitrate,
      framerate: o.fps,
      alpha: 'keep',
    });
    if (support.supported === false) {
      throw new Error(
        `This browser cannot encode ${o.codec} with an alpha channel, so a ` +
          `transparent video cannot be produced. Export without { alpha: true } ` +
          `for an opaque video, or export a transparent PNG sequence instead.`,
      );
    }
  }

  /**
   * Lazily import the muxer for the configured container and wrap it in a
   * container-agnostic handle.
   */
  private async _createMuxer(
    mapping: CodecMapping,
    audio: AudioTrackPlan | null,
  ): Promise<MuxerHandle> {
    const o = this._options;
    const videoCommon = { width: o.width, height: o.height, frameRate: o.fps };
    const audioCommon = audio
      ? { numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate }
      : null;

    if (o.format === 'webm') {
      const { Muxer, ArrayBufferTarget } = await import('webm-muxer');
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        // webm-muxer writes an alpha side channel when `alpha` is true.
        video: { codec: mapping.webmCodec, ...videoCommon, alpha: o.alpha },
        ...(audioCommon ? { audio: { codec: 'A_OPUS', ...audioCommon } } : {}),
        firstTimestampBehavior: 'offset',
      });
      return {
        addVideoChunk: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        addAudioChunk: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
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
      ...(audioCommon && audio ? { audio: { codec: audio.codec, ...audioCommon } } : {}),
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    return {
      addVideoChunk: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      addAudioChunk: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      finalize: (audioSeconds) => {
        muxer.finalize();
        const delay = audio?.encoderDelay ?? 0;
        if (audioSeconds === undefined || delay === 0) {
          return new Blob([target.buffer], { type: 'video/mp4' });
        }
        // Skip the AAC priming with an edit list; every source sample stays.
        // The step is optional: no failure in it may fail the export.
        let reason: string;
        try {
          const edited = addAudioEditList(new Uint8Array(target.buffer), delay, audioSeconds);
          if ('file' in edited) return new Blob([edited.file], { type: 'video/mp4' });
          reason = edited.skipped;
        } catch (err) {
          reason = err instanceof Error ? err.message : String(err);
        }
        logger.warn(`No mp4 edit list (${reason}); the audio plays ${delay} samples late.`);
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
 * Wait until the encoder queue is short enough. Uses the `dequeue` event, not a
 * timer, so it also works under a paused fake clock.
 */
async function waitForEncodeQueue(encoder: VideoEncoder): Promise<void> {
  if (typeof encoder.addEventListener !== 'function') return;
  while ((encoder.encodeQueueSize ?? 0) > MAX_ENCODE_QUEUE) {
    await new Promise<void>((resolve) =>
      encoder.addEventListener('dequeue', () => resolve(), { once: true }),
    );
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
