/**
 * Render harness - lets `scripts/render-example.mjs` render an example page to
 * a video file from the command line.
 *
 * An example opts in with one line after it creates its scene:
 *
 * ```ts
 * registerRender(scene);                       // starts by clicking #playBtn
 * registerRender(scene, { construct: build }); // or runs build(scene)
 * ```
 *
 * The call only installs `window.__manimRender`. It changes nothing on the page
 * until the script calls `start()`.
 *
 * How a render works: the script loads the page under a paused Playwright fake
 * clock. `start()` resizes the scene, starts the audio timeline clock at frame
 * 0, opens a {@link WebCodecsExporter} capture session and starts the scene's
 * own `play()`/`wait()` code. The script then moves the fake clock by one frame
 * and calls `captureFrame()`, until `isDone()`. So the video shows exactly what
 * the live page shows (updaters and camera motion included), at a fixed frame
 * rate, and narration placed at "now" lands at the matching audio offset.
 */

import { logger } from '../utils/logger';
import type { AudioManager } from '../core/AudioManager';
import { WebCodecsExporter, avcCodecString, type WebCodecsVideoCodec } from './WebCodecsExporter';
import { audioCodecForFormat } from './webCodecsAudio';

/** The scene surface the harness needs. `Scene` and `ThreeDScene` satisfy it. */
export interface RenderableScene {
  getCanvas(): HTMLCanvasElement;
  getWidth(): number;
  getHeight(): number;
  seek(time: number): void;
  getTimelineDuration(): number | null;
  render(): void;
  setFrameAspect(width: number, height: number): unknown;
  readonly audioManager: AudioManager;
}

/** Options for {@link registerRender}. */
export interface RenderRegistration<S extends RenderableScene> {
  /**
   * The scene code to render. When not given, `start()` clicks the page's
   * `#playBtn` (the examples convention) and the render is done when the
   * button is enabled again.
   */
  construct?: (scene: S) => void | Promise<void>;
}

/** Options the script passes to `start()`. */
export interface RenderStartOptions {
  width: number;
  height: number;
  fps: number;
  format: 'mp4' | 'webm';
  codec?: WebCodecsVideoCodec;
  bitrate?: number;
  includeAudio?: boolean;
}

/** What the page can encode, as reported by `probe()`. */
export interface RenderProbe {
  webCodecs: boolean;
  avc: boolean;
  vp9: boolean;
  aac: boolean;
  opus: boolean;
}

/** The handle installed on `window.__manimRender`. */
export interface RenderHandle {
  readonly version: 1;
  probe(width: number, height: number, fps: number): Promise<RenderProbe>;
  start(options: RenderStartOptions): Promise<{ hasAudio: boolean }>;
  /** True while an audio file loads; the script must not move the clock then. */
  isBusy(): boolean;
  /** True when the scene code finished (or failed, see `error()`). */
  isDone(): boolean;
  error(): string | null;
  captureFrame(): Promise<number>;
  /** Finish the file; returns its size in bytes. */
  finish(): Promise<number>;
  /** A base64 slice of the finished file. */
  readChunk(offset: number, length: number): string;
  /** The clips on the audio timeline, for a sync report. */
  audioClips(): Array<{ url: string; startTime: number; duration: number; gain: number }>;
}

declare global {
  interface Window {
    __manimRender?: RenderHandle;
  }
}

async function isVideoSupported(codec: string, width: number, height: number, fps: number) {
  if (typeof VideoEncoder === 'undefined') return false;
  try {
    const res = await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps });
    return res.supported === true;
  } catch {
    return false;
  }
}

async function isAudioSupported(codec: string) {
  if (typeof AudioEncoder === 'undefined') return false;
  try {
    const res = await AudioEncoder.isConfigSupported({
      codec,
      sampleRate: 48_000,
      numberOfChannels: 2,
      bitrate: 128_000,
    });
    return res.supported === true;
  } catch {
    return false;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

/**
 * Register `scene` for command-line rendering (see the module comment).
 *
 * @returns The handle, also stored on `window.__manimRender`
 */
export function registerRender<S extends RenderableScene>(
  scene: S,
  registration: RenderRegistration<S> = {},
): RenderHandle {
  let session: Awaited<ReturnType<WebCodecsExporter['startCapture']>> | null = null;
  let done = false;
  let failure: string | null = null;
  let output: Uint8Array | null = null;
  let isDoneByButton: () => boolean = () => false;

  /** Record the first failure of the scene code and end the render. */
  const fail = (err: unknown): void => {
    failure ??= err instanceof Error ? err.message : String(err);
    done = true;
  };
  // A #playBtn handler runs outside our promise chain: its errors and
  // rejections reach only these window events. Any of them fails the render.
  const onError = (event: ErrorEvent): void => fail(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent): void => fail(event.reason);

  const runScene = (): void => {
    if (registration.construct) {
      Promise.resolve()
        .then(() => registration.construct?.(scene))
        .then(() => {
          done = true;
        }, fail);
      return;
    }
    const button = document.getElementById('playBtn') as HTMLButtonElement | null;
    if (!button) {
      logger.warn('registerRender: no construct and no #playBtn; render runs until --duration.');
      return;
    }
    button.click();
    isDoneByButton = () => !button.disabled;
  };

  const handle: RenderHandle = {
    version: 1,
    async probe(width, height, fps) {
      return {
        webCodecs: WebCodecsExporter.isSupported(),
        avc: await isVideoSupported(avcCodecString(width, height, fps), width, height, fps),
        vp9: await isVideoSupported('vp09.00.10.08', width, height, fps),
        aac: await isAudioSupported('mp4a.40.2'),
        opus: await isAudioSupported(audioCodecForFormat('webm')),
      };
    },
    async start(options) {
      if (session) throw new Error('registerRender: start() was already called');
      if (scene.getWidth() !== options.width || scene.getHeight() !== options.height) {
        scene.setFrameAspect(options.width, options.height);
      }
      scene.audioManager.startTimelineClock();
      const exporter = new WebCodecsExporter(scene, {
        width: options.width,
        height: options.height,
        fps: options.fps,
        format: options.format,
        codec: options.codec,
        bitrate: options.bitrate,
        includeAudio: options.includeAudio ?? true,
      });
      session = await exporter.startCapture();
      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
      runScene();
      return { hasAudio: session.hasAudio };
    },
    isBusy: () => scene.audioManager.pendingLoads > 0,
    // A failure counts as done, so the script stops and reads error().
    isDone: () => done || isDoneByButton(),
    error: () => failure,
    async captureFrame() {
      if (!session) throw new Error('registerRender: call start() first');
      // Draw now: the WebGL drawing buffer may already be cleared after the
      // last composite, and render() always draws (even off screen).
      scene.render();
      await session.captureFrame();
      return session.frameCount;
    },
    async finish() {
      if (!session) throw new Error('registerRender: call start() first');
      const blob = await session.finish();
      output = new Uint8Array(await blob.arrayBuffer());
      return output.byteLength;
    },
    audioClips() {
      return scene.audioManager.tracks.map((t) => ({
        url: t.url,
        startTime: t.startTime,
        duration: t.duration,
        gain: t.gain,
      }));
    },
    readChunk(offset, length) {
      if (!output) throw new Error('registerRender: call finish() first');
      return toBase64(output.subarray(offset, offset + length));
    },
  };

  if (typeof window !== 'undefined') window.__manimRender = handle;
  return handle;
}
