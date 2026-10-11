import { WebCodecsExporter } from './WebCodecsExporter';

/**
 * Which video export backend to use.
 * - `webcodecs`: deterministic, frame-accurate, no dropped frames.
 * - `mediarecorder`: real-time `captureStream` recording (VideoExporter).
 */
export type VideoExporterStrategy = 'webcodecs' | 'mediarecorder';

/**
 * Pick the video export backend.
 *
 * WebCodecs seeks and encodes one frame at a time, so the output is
 * frame-accurate and independent of the display refresh rate. It is therefore
 * preferred whenever the browser supports it. When it is unavailable, the
 * MediaRecorder-based VideoExporter is used as a fallback.
 *
 * @param supported - WebCodecs availability. Defaults to feature detection.
 * @returns The strategy to use.
 */
export function chooseVideoExporterStrategy(
  supported: boolean = WebCodecsExporter.isSupported(),
): VideoExporterStrategy {
  return supported ? 'webcodecs' : 'mediarecorder';
}
