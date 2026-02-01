/**
 * AudioManager - Audio playback and synchronization for manim-js.
 *
 * Manages loading, scheduling, and playing audio clips in sync with
 * the Scene animation timeline. Uses the Web Audio API exclusively
 * (no external libraries).
 *
 * Supports:
 * - Adding sounds at absolute times or synced to animation starts
 * - Per-track and master gain control
 * - Fade in / fade out envelopes
 * - Looping
 * - Transport controls (play / pause / seek)
 * - Buffer caching (same URL loads once)
 * - Offline mixdown to a single AudioBuffer
 * - WAV export as a Blob
 */

import { Animation } from '../animation/Animation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options when adding a sound to the audio manager.
 */
export interface AddSoundOptions {
  /** Absolute time (in seconds) when the sound should start playing. Defaults to 0. */
  time?: number;
  /** Volume gain (0 = silent, 1 = full). Defaults to 1. */
  gain?: number;
  /** Whether to loop the clip. Defaults to false. */
  loop?: boolean;
  /** Fade-in duration in seconds. Defaults to 0. */
  fadeIn?: number;
  /** Fade-out duration in seconds. Defaults to 0. */
  fadeOut?: number;
  /** Offset into the audio buffer to start playback from (seconds). Defaults to 0. */
  offset?: number;
  /** Duration to play (seconds). Defaults to the full buffer length. */
  duration?: number;
}

/**
 * Represents a single audio clip scheduled on the timeline.
 */
export interface AudioTrack {
  /** Unique identifier for this track. */
  id: number;
  /** URL the audio was loaded from. */
  url: string;
  /** Decoded audio buffer (null until loaded). */
  buffer: AudioBuffer | null;
  /** When the track starts on the timeline (seconds). */
  startTime: number;
  /** How long the clip plays (seconds). Derived from buffer or explicit option. */
  duration: number;
  /** Volume gain [0, 1]. */
  gain: number;
  /** Whether the clip loops. */
  loop: boolean;
  /** Fade-in duration (seconds). */
  fadeIn: number;
  /** Fade-out duration (seconds). */
  fadeOut: number;
  /** Offset into the buffer (seconds). */
  offset: number;
  /** Whether this track is currently playing. */
  playing: boolean;
  /** Whether this track is paused. */
  paused: boolean;
}

// ---------------------------------------------------------------------------
// AudioManager
// ---------------------------------------------------------------------------

/**
 * Manages audio playback synchronized with the manim-js Scene timeline.
 *
 * Usage:
 * ```ts
 * const audio = new AudioManager();
 * await audio.addSound('/sounds/click.wav', { time: 0.5 });
 * audio.play();             // start playback
 * audio.seek(2.0);          // jump to 2 s
 * const wav = await audio.exportWAV();
 * ```
 */
export class AudioManager {
  // -- Web Audio graph nodes -------------------------------------------------
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;

  // -- Track state -----------------------------------------------------------
  private _tracks: AudioTrack[] = [];
  private _nextId: number = 1;

  // -- Buffer cache (URL -> AudioBuffer) ------------------------------------
  private _bufferCache: Map<string, AudioBuffer> = new Map();

  // -- Transport state -------------------------------------------------------
  private _isPlaying: boolean = false;
  private _startedAt: number = 0;   // AudioContext.currentTime when play() was called
  private _pauseOffset: number = 0; // timeline seconds elapsed before pause

  // -- Active source nodes (track id -> source) ------------------------------
  private _activeSources: Map<number, AudioBufferSourceNode> = new Map();
  private _activeGains: Map<number, GainNode> = new Map();

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /**
   * Lazily create (or resume) the AudioContext.
   * Must be triggered by a user gesture in most browsers.
   */
  private _ensureContext(): AudioContext {
    if (!this._ctx) {
      this._ctx = new AudioContext();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);
    }
    if (this._ctx.state === 'suspended') {
      // fire-and-forget: browsers gate resume behind user gesture
      this._ctx.resume();
    }
    return this._ctx;
  }

  /**
   * Get the underlying AudioContext (creates one if needed).
   */
  get context(): AudioContext {
    return this._ensureContext();
  }

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------

  /**
   * Load and decode an audio file, with caching.
   * @param url - URL of the audio resource
   * @returns Decoded AudioBuffer
   */
  async loadBuffer(url: string): Promise<AudioBuffer> {
    const cached = this._bufferCache.get(url);
    if (cached) return cached;

    const ctx = this._ensureContext();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`AudioManager: Failed to fetch ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this._bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  // --------------------------------------------------------------------------
  // Adding sounds
  // --------------------------------------------------------------------------

  /**
   * Add a sound to the timeline.
   *
   * @param url - URL of the audio file
   * @param options - Scheduling and playback options
   * @returns The created AudioTrack (buffer may still be loading)
   */
  async addSound(url: string, options: AddSoundOptions = {}): Promise<AudioTrack> {
    const buffer = await this.loadBuffer(url);

    const track: AudioTrack = {
      id: this._nextId++,
      url,
      buffer,
      startTime: options.time ?? 0,
      duration: options.duration ?? buffer.duration,
      gain: options.gain ?? 1,
      loop: options.loop ?? false,
      fadeIn: options.fadeIn ?? 0,
      fadeOut: options.fadeOut ?? 0,
      offset: options.offset ?? 0,
      playing: false,
      paused: false,
    };

    this._tracks.push(track);
    return track;
  }

  /**
   * Add a sound that starts when a given animation begins on the timeline.
   *
   * The animation must already be scheduled (i.e. have a non-null `startTime`).
   * If the animation has not been scheduled yet, `time` falls back to 0.
   *
   * @param animation - Animation whose start time to sync with
   * @param url - URL of the audio file
   * @param options - Additional options (time is overridden by animation)
   * @returns The created AudioTrack
   */
  async addSoundAtAnimation(
    animation: Animation,
    url: string,
    options: Omit<AddSoundOptions, 'time'> & { timeOffset?: number } = {},
  ): Promise<AudioTrack> {
    const animStart = animation.startTime ?? 0;
    const offset = options.timeOffset ?? 0;
    return this.addSound(url, { ...options, time: animStart + offset });
  }

  // --------------------------------------------------------------------------
  // Transport controls
  // --------------------------------------------------------------------------

  /**
   * Start (or resume) audio playback from the current position.
   */
  play(): void {
    if (this._isPlaying) return;

    const ctx = this._ensureContext();
    this._isPlaying = true;
    this._startedAt = ctx.currentTime - this._pauseOffset;

    // Schedule all tracks that should be audible from current offset
    this._scheduleAllTracks();
  }

  /**
   * Pause audio playback, remembering the current position.
   */
  pause(): void {
    if (!this._isPlaying) return;

    this._isPlaying = false;
    const ctx = this._ensureContext();
    this._pauseOffset = ctx.currentTime - this._startedAt;

    // Stop all active sources
    this._stopAllSources();
  }

  /**
   * Seek to an absolute time on the timeline (seconds).
   * If currently playing, audio restarts from the new position.
   */
  seek(time: number): void {
    const wasPlaying = this._isPlaying;

    // Stop everything first
    this._stopAllSources();
    this._isPlaying = false;
    this._pauseOffset = Math.max(0, time);

    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Stop playback and reset to the beginning.
   */
  stop(): void {
    this._stopAllSources();
    this._isPlaying = false;
    this._pauseOffset = 0;
  }

  /**
   * Get the current playback position on the timeline (seconds).
   */
  getCurrentTime(): number {
    if (!this._isPlaying || !this._ctx) return this._pauseOffset;
    return this._ctx.currentTime - this._startedAt;
  }

  // --------------------------------------------------------------------------
  // Gain
  // --------------------------------------------------------------------------

  /**
   * Set the master output volume.
   * @param value - Gain value (0 = silent, 1 = unity)
   */
  setGlobalGain(value: number): void {
    this._ensureContext();
    if (this._masterGain) {
      this._masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, value)),
        this._ctx!.currentTime,
      );
    }
  }

  /**
   * Set the gain for a specific track.
   * @param trackId - Track identifier
   * @param value - Gain value (0 = silent, 1 = unity)
   */
  setTrackGain(trackId: number, value: number): void {
    const track = this._tracks.find(t => t.id === trackId);
    if (track) track.gain = value;

    const gainNode = this._activeGains.get(trackId);
    if (gainNode && this._ctx) {
      gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(1, value)),
        this._ctx.currentTime,
      );
    }
  }

  // --------------------------------------------------------------------------
  // Track management
  // --------------------------------------------------------------------------

  /**
   * Remove a track by id.
   */
  removeTrack(trackId: number): void {
    // Stop if playing
    const source = this._activeSources.get(trackId);
    if (source) {
      try { source.stop(); } catch { /* already stopped */ }
      this._activeSources.delete(trackId);
    }
    this._activeGains.delete(trackId);
    this._tracks = this._tracks.filter(t => t.id !== trackId);
  }

  /**
   * Remove all tracks and stop playback.
   */
  clearTracks(): void {
    this._stopAllSources();
    this._tracks = [];
    this._isPlaying = false;
    this._pauseOffset = 0;
  }

  /**
   * Get a readonly copy of the current track list.
   */
  get tracks(): ReadonlyArray<AudioTrack> {
    return this._tracks;
  }

  /**
   * Whether audio is currently playing.
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Get the total duration of the audio timeline (end of the latest track).
   */
  getDuration(): number {
    let maxEnd = 0;
    for (const t of this._tracks) {
      const end = t.startTime + t.duration;
      if (end > maxEnd) maxEnd = end;
    }
    return maxEnd;
  }

  // --------------------------------------------------------------------------
  // Offline rendering / export
  // --------------------------------------------------------------------------

  /**
   * Render all audio tracks into a single stereo AudioBuffer (offline).
   *
   * @param duration - Total duration to render (seconds). Defaults to getDuration().
   * @param sampleRate - Output sample rate. Defaults to 44100.
   * @returns Mixed-down AudioBuffer
   */
  async mixdown(duration?: number, sampleRate: number = 44100): Promise<AudioBuffer> {
    const totalDuration = duration ?? this.getDuration();
    if (totalDuration <= 0) {
      throw new Error('AudioManager.mixdown: no audio to render');
    }

    const length = Math.ceil(totalDuration * sampleRate);
    const offline = new OfflineAudioContext(2, length, sampleRate);

    const masterGain = offline.createGain();
    masterGain.gain.value = this._masterGain?.gain.value ?? 1;
    masterGain.connect(offline.destination);

    // Schedule every track into the offline context
    for (const track of this._tracks) {
      if (!track.buffer) continue;

      const source = offline.createBufferSource();
      source.buffer = track.buffer;
      source.loop = track.loop;

      const gain = offline.createGain();
      gain.gain.value = track.gain;

      // Fade in
      if (track.fadeIn > 0) {
        gain.gain.setValueAtTime(0, track.startTime);
        gain.gain.linearRampToValueAtTime(track.gain, track.startTime + track.fadeIn);
      }

      // Fade out
      if (track.fadeOut > 0) {
        const fadeStart = track.startTime + track.duration - track.fadeOut;
        gain.gain.setValueAtTime(track.gain, Math.max(track.startTime, fadeStart));
        gain.gain.linearRampToValueAtTime(0, track.startTime + track.duration);
      }

      source.connect(gain);
      gain.connect(masterGain);

      source.start(track.startTime, track.offset, track.loop ? undefined : track.duration);
    }

    return offline.startRendering();
  }

  /**
   * Export all audio tracks as a WAV Blob.
   *
   * @param duration - Total duration (seconds). Defaults to getDuration().
   * @param sampleRate - Sample rate. Defaults to 44100.
   * @returns WAV Blob
   */
  async exportWAV(duration?: number, sampleRate: number = 44100): Promise<Blob> {
    const buffer = await this.mixdown(duration, sampleRate);
    return AudioManager.audioBufferToWAV(buffer);
  }

  /**
   * Get an AudioNode destination suitable for muxing with a MediaRecorder.
   * This creates a MediaStreamAudioDestinationNode that can be combined with
   * a video stream for video+audio export.
   *
   * @returns MediaStreamAudioDestinationNode connected to the master gain
   */
  createStreamDestination(): MediaStreamAudioDestinationNode {
    const ctx = this._ensureContext();
    const dest = ctx.createMediaStreamDestination();
    this._masterGain!.connect(dest);
    return dest;
  }

  // --------------------------------------------------------------------------
  // WAV encoder (static utility)
  // --------------------------------------------------------------------------

  /**
   * Encode an AudioBuffer as a WAV Blob (PCM 16-bit).
   */
  static audioBufferToWAV(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // -- RIFF header --
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(view, 8, 'WAVE');

    // -- fmt sub-chunk --
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);            // sub-chunk size
    view.setUint16(20, 1, true);             // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);            // bits per sample

    // -- data sub-chunk --
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave channels into 16-bit PCM
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(buffer.getChannelData(ch));
    }

    let offset = headerSize;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // --------------------------------------------------------------------------
  // Disposal
  // --------------------------------------------------------------------------

  /**
   * Release all audio resources.
   */
  dispose(): void {
    this._stopAllSources();
    this._tracks = [];
    this._bufferCache.clear();
    if (this._ctx && this._ctx.state !== 'closed') {
      this._ctx.close();
    }
    this._ctx = null;
    this._masterGain = null;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /**
   * Schedule all tracks from the current timeline position.
   */
  private _scheduleAllTracks(): void {
    const ctx = this._ensureContext();
    const now = ctx.currentTime;
    const timelinePos = this._pauseOffset;

    for (const track of this._tracks) {
      if (!track.buffer) continue;

      const trackEnd = track.startTime + track.duration;

      // Skip tracks that have already finished
      if (timelinePos >= trackEnd && !track.loop) continue;

      const source = ctx.createBufferSource();
      source.buffer = track.buffer;
      source.loop = track.loop;

      // Per-track gain
      const gain = ctx.createGain();
      gain.gain.value = track.gain;

      // Fade-in envelope
      if (track.fadeIn > 0) {
        const fadeStartTimeline = track.startTime;
        const fadeEndTimeline = track.startTime + track.fadeIn;

        if (timelinePos < fadeEndTimeline) {
          // We're within the fade-in region or before it
          const contextFadeStart = now + Math.max(0, fadeStartTimeline - timelinePos);
          const contextFadeEnd = now + (fadeEndTimeline - timelinePos);
          gain.gain.setValueAtTime(0, contextFadeStart);
          gain.gain.linearRampToValueAtTime(track.gain, contextFadeEnd);
        }
      }

      // Fade-out envelope
      if (track.fadeOut > 0) {
        const fadeStartTimeline = track.startTime + track.duration - track.fadeOut;
        const fadeEndTimeline = track.startTime + track.duration;

        if (timelinePos < fadeEndTimeline) {
          const contextFadeStart = now + Math.max(0, fadeStartTimeline - timelinePos);
          const contextFadeEnd = now + (fadeEndTimeline - timelinePos);
          gain.gain.setValueAtTime(track.gain, contextFadeStart);
          gain.gain.linearRampToValueAtTime(0, contextFadeEnd);
        }
      }

      source.connect(gain);
      gain.connect(this._masterGain!);

      // Calculate when & where to start in the buffer
      const delayFromNow = Math.max(0, track.startTime - timelinePos);
      const contextStart = now + delayFromNow;

      let bufferOffset = track.offset;
      if (timelinePos > track.startTime) {
        // We're seeking into the middle of this track
        bufferOffset += (timelinePos - track.startTime);
      }

      const remaining = track.duration - (bufferOffset - track.offset);
      if (remaining <= 0 && !track.loop) continue;

      source.start(contextStart, bufferOffset, track.loop ? undefined : remaining);

      // Track the active source so we can stop it later
      source.onended = () => {
        this._activeSources.delete(track.id);
        this._activeGains.delete(track.id);
        track.playing = false;
      };
      track.playing = true;
      track.paused = false;

      this._activeSources.set(track.id, source);
      this._activeGains.set(track.id, gain);
    }
  }

  /**
   * Stop and disconnect all currently playing source nodes.
   */
  private _stopAllSources(): void {
    for (const [id, source] of this._activeSources) {
      try { source.stop(); } catch { /* already stopped */ }
      const track = this._tracks.find(t => t.id === id);
      if (track) {
        track.playing = false;
        track.paused = true;
      }
    }
    this._activeSources.clear();
    this._activeGains.clear();
  }
}

// ---------------------------------------------------------------------------
// Private WAV helper
// ---------------------------------------------------------------------------

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
