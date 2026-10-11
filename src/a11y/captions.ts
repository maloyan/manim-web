/**
 * WebVTT captions for manim-web — a browser-unique accessibility capability.
 *
 * {@link Voiceover} narration carries timing (each phrase has a start and end
 * in seconds). This module turns those timings into a standards-valid WebVTT
 * (`.vtt`) caption string, and attaches it to an HTML `<video>` as a
 * `<track kind="captions">` so screen-reader and caption users can follow the
 * narration.
 *
 * The module is Node / SSR safe: {@link voiceoverToVTT} and
 * {@link formatVttTimestamp} are pure, and {@link attachCaptionTrack} guards
 * every DOM access and returns `null` when there is no document.
 */

/**
 * One caption cue: the spoken phrase and the window it is shown for, in
 * seconds from the start of the narration.
 */
export interface VoiceoverCaptionCue {
  /** The phrase shown while this cue is active. */
  text: string;
  /** Start time in seconds (>= 0). */
  start: number;
  /** End time in seconds (must be greater than `start`). */
  end: number;
}

/** Options for {@link attachCaptionTrack}. */
export interface CaptionTrackOptions {
  /** Human-readable track name shown in the player menu. Default `Captions`. */
  label?: string;
  /** BCP-47 language tag for the track (`srclang`). Default `en`. */
  language?: string;
  /** Mark the track as the default caption track. Default `false`. */
  isDefault?: boolean;
}

/** A handle to an attached caption track, with a cleanup function. */
export interface CaptionTrackHandle {
  /** The `<track>` element added to the video. */
  track: HTMLTrackElement;
  /** The blob URL backing the track. */
  url: string;
  /** Detach the track and revoke its blob URL. Safe to call more than once. */
  remove(): void;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

/**
 * Format a time in seconds as a WebVTT timestamp `HH:MM:SS.mmm`.
 *
 * Negative and non-finite input clamp to zero. Rounding is done once in
 * integer milliseconds, so a value such as `59.9999` reads `00:01:00.000`
 * instead of an invalid `00:00:60.000`.
 */
export function formatVttTimestamp(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const totalMs = Math.round(safe * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const millis = totalMs % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
}

/**
 * Make cue text safe for a WebVTT body.
 *
 * `&`, `<` and `>` are escaped so the text is not read as a WebVTT tag, and
 * blank lines are collapsed because a blank line terminates a cue in WebVTT.
 */
function escapeCueText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function assertValidCue(cue: VoiceoverCaptionCue, index: number): void {
  const { start, end } = cue;
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error(
      `voiceoverToVTT: cue ${index} has a non-finite timestamp (start=${start}, end=${end}).`,
    );
  }
  if (start < 0) {
    throw new Error(`voiceoverToVTT: cue ${index} start (${start}) must be >= 0.`);
  }
  if (end <= start) {
    throw new Error(
      `voiceoverToVTT: cue ${index} end (${end}) must be greater than start (${start}).`,
    );
  }
}

/**
 * Build a standards-valid WebVTT caption string from voiceover timings.
 *
 * Each cue becomes a numbered WebVTT cue with an `HH:MM:SS.mmm` time range.
 * An empty cue list still yields a valid file with just the `WEBVTT` header.
 *
 * @throws If any cue has a non-finite, negative, or non-increasing timestamp.
 */
export function voiceoverToVTT(cues: ReadonlyArray<VoiceoverCaptionCue>): string {
  const lines: string[] = ['WEBVTT', ''];
  cues.forEach((cue, index) => {
    assertValidCue(cue, index);
    lines.push(String(index + 1));
    lines.push(`${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}`);
    lines.push(escapeCueText(cue.text));
    lines.push('');
  });
  return lines.join('\n');
}

function canUseObjectUrls(): boolean {
  return (
    typeof document !== 'undefined' &&
    !!document.body &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}

/**
 * Attach a WebVTT caption string to a `<video>` as a `<track kind="captions">`.
 *
 * The VTT is wrapped in a blob and exposed through an object URL. The returned
 * handle's `remove()` detaches the track and revokes the URL.
 *
 * @returns A handle, or `null` when there is no DOM (Node / SSR) or the video
 *   cannot take a child. The feature never throws off the browser.
 */
export function attachCaptionTrack(
  video: HTMLVideoElement,
  vtt: string,
  options: CaptionTrackOptions = {},
): CaptionTrackHandle | null {
  if (!canUseObjectUrls() || !video || typeof video.appendChild !== 'function') {
    return null;
  }

  const blob = new Blob([vtt], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  const track = document.createElement('track');
  track.kind = 'captions';
  track.label = options.label ?? 'Captions';
  track.srclang = options.language ?? 'en';
  if (options.isDefault) {
    track.default = true;
  }
  track.src = url;
  video.appendChild(track);

  let removed = false;
  return {
    track,
    url,
    remove(): void {
      if (removed) return;
      removed = true;
      track.parentNode?.removeChild(track);
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    },
  };
}
