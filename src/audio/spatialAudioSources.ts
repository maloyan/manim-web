/**
 * Transport sources for {@link SpatialAudio}.
 *
 * A {@link PositionalSource} is the audible part of a positional sound: it
 * owns the Web Audio source node and exposes play / pause / stop / volume. The
 * {@link SpatialAudio} class owns the spatial part (the `PannerNode` and the
 * `AudioListener`) and never touches the source node directly.
 *
 * Two concrete sources are provided:
 *   - {@link MediaElementSource} wraps an `<audio>` / `<video>` element,
 *   - {@link BufferSource} plays a decoded `AudioBuffer`.
 *
 * These classes only run in a real browser. In Node / jsdom the
 * {@link SpatialAudio} factories never construct them, so no Web Audio access
 * happens. Tests inject their own stub source instead.
 */

/**
 * The transport contract {@link SpatialAudio} drives. A real source wires its
 * own output node into the panner; these methods control playback only.
 */
export interface PositionalSource {
  /** Start (or resume) playback. */
  play(): void;
  /** Pause playback, keeping the position when the source supports it. */
  pause(): void;
  /** Stop playback and reset to the start. */
  stop(): void;
  /** Set the source volume, clamped to `[0, 1]`. */
  setVolume(value: number): void;
}

/** Clamp `value` to the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * A {@link PositionalSource} backed by an `<audio>` / `<video>` element.
 *
 * The caller wires the element's `MediaElementAudioSourceNode` into the panner
 * before constructing this wrapper; the wrapper controls transport only.
 */
export class MediaElementSource implements PositionalSource {
  constructor(private readonly _element: HTMLMediaElement) {}

  play(): void {
    // play() returns a promise that rejects if autoplay is blocked; ignore it.
    void this._element.play();
  }

  pause(): void {
    this._element.pause();
  }

  stop(): void {
    this._element.pause();
    this._element.currentTime = 0;
  }

  setVolume(value: number): void {
    this._element.volume = clamp(value, 0, 1);
  }
}

/**
 * A {@link PositionalSource} that plays a decoded `AudioBuffer`.
 *
 * A Web Audio `AudioBufferSourceNode` plays once, so this wrapper builds a
 * fresh node on each {@link play}. A shared `GainNode` carries the volume and
 * stays connected to the panner, so volume survives a replay.
 */
export class BufferSource implements PositionalSource {
  private _node: AudioBufferSourceNode | null = null;

  /**
   * @param _context - The owning context (makes the source nodes)
   * @param _buffer - The decoded audio to play
   * @param _gain - A gain node already connected to the panner
   * @param loop - Whether playback repeats
   */
  constructor(
    private readonly _context: BaseAudioContext,
    private readonly _buffer: AudioBuffer,
    private readonly _gain: GainNode,
    private readonly _loop: boolean = false,
  ) {}

  play(): void {
    this._stopNode();
    const node = this._context.createBufferSource();
    node.buffer = this._buffer;
    node.loop = this._loop;
    node.connect(this._gain);
    node.start();
    this._node = node;
  }

  pause(): void {
    // A buffer source cannot resume; pausing stops the current playback.
    this._stopNode();
  }

  stop(): void {
    this._stopNode();
  }

  setVolume(value: number): void {
    this._gain.gain.value = clamp(value, 0, 1);
  }

  private _stopNode(): void {
    if (!this._node) return;
    try {
      this._node.stop();
    } catch {
      /* already stopped */
    }
    this._node = null;
  }
}
