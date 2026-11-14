/**
 * Audio track support for {@link WebCodecsExporter}.
 *
 * The exporter mixes the scene's audio timeline down to one buffer with
 * `AudioManager.mixdown`, encodes it with the WebCodecs `AudioEncoder`, and
 * hands the encoded chunks to the muxer. AAC goes into mp4, Opus into webm.
 *
 * Sync rule: the mixdown always covers exactly `frameCount / fps` seconds and
 * starts at timeline time 0, the same origin as the first video frame. So the
 * audio track and the video track have the same start and the same length.
 */

import { logger } from '../utils/logger';

/**
 * The part of an AudioManager the exporter needs. `AudioManager` satisfies it.
 */
export interface AudioMixdownSource {
  /** The scheduled clips. An empty list means there is no audio to export. */
  readonly tracks: ReadonlyArray<unknown>;
  /** Render the whole timeline (from time 0) into one buffer. */
  mixdown(duration?: number, sampleRate?: number): Promise<AudioBuffer>;
}

/** The audio codec of the exported track. */
export type WebCodecsAudioCodec = 'aac' | 'opus';

/** A checked, supported audio track configuration. */
export interface AudioTrackPlan {
  codec: WebCodecsAudioCodec;
  /** AudioEncoder `codec` string. */
  encoderCodec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate: number;
  /**
   * Encoder delay in samples (AAC priming). The encoder output starts with
   * this many extra samples. The exporter encodes every source sample and
   * adds an mp4 edit list that skips the priming (see `addAudioEditList`),
   * so the decoded track lines up with timeline time 0.
   */
  encoderDelay: number;
}

/** Samples per AudioData block handed to the encoder (about 0.1 s at 48 kHz). */
const BLOCK_FRAMES = 4800;

const ENCODER_CODEC: Record<WebCodecsAudioCodec, string> = {
  aac: 'mp4a.40.2',
  opus: 'opus',
};

/** The audio codec for a container: AAC for mp4, Opus for webm. */
export function audioCodecForFormat(format: 'mp4' | 'webm'): WebCodecsAudioCodec {
  return format === 'mp4' ? 'aac' : 'opus';
}

/**
 * Check that the browser can encode the audio codec for `format`.
 *
 * @returns The plan, or null (after one `logger.warn`) when `AudioEncoder` or
 *   the codec is not available. The caller then exports video only.
 */
export async function planAudioTrack(
  format: 'mp4' | 'webm',
  sampleRate: number,
  bitrate: number,
): Promise<AudioTrackPlan | null> {
  const codec = audioCodecForFormat(format);
  const plan: AudioTrackPlan = {
    codec,
    encoderCodec: ENCODER_CODEC[codec],
    sampleRate,
    numberOfChannels: 2,
    bitrate,
    encoderDelay: 0,
  };
  if (typeof window === 'undefined' || typeof window.AudioEncoder === 'undefined') {
    logger.warn('WebCodecs AudioEncoder is not available; exporting video without audio.');
    return null;
  }
  const encoder = window.AudioEncoder;
  if (typeof encoder.isConfigSupported === 'function') {
    try {
      const support = await encoder.isConfigSupported(toEncoderConfig(plan));
      if (support.supported === false) {
        logger.warn(`This browser cannot encode ${codec} audio; exporting video without audio.`);
        return null;
      }
    } catch (err) {
      logger.warn(`Audio codec check for ${codec} failed; exporting video without audio:`, err);
      return null;
    }
  }
  // Opus carries its pre-skip in the stream header, so players remove it.
  if (codec === 'aac') plan.encoderDelay = await measureEncoderDelay(plan);
  return plan;
}

/** Opus pre-skip of libopus at 48 kHz, used when the encoder gives no OpusHead. */
const DEFAULT_OPUS_PRE_SKIP = 312;

/** The pre-skip (samples at 48 kHz) of an OpusHead, or null when `head` is not one. */
function opusPreSkip(head: AllowSharedBufferSource | undefined): number | null {
  if (!head) return null;
  const bytes = ArrayBuffer.isView(head)
    ? new Uint8Array(head.buffer, head.byteOffset, head.byteLength)
    : new Uint8Array(head);
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(0, 8)) !== 'OpusHead') {
    return null;
  }
  return bytes[10] | (bytes[11] << 8);
}

/** AAC priming of most encoders (Apple AudioToolbox, FDK), used when measuring fails. */
const DEFAULT_AAC_DELAY = 2112;

/**
 * Measure the encoder delay: encode one impulse, decode it again with
 * `AudioDecoder`, and return how many samples later the peak comes out.
 *
 * @post result >= 0
 */
async function measureEncoderDelay(plan: AudioTrackPlan): Promise<number> {
  if (typeof window.AudioDecoder === 'undefined') return DEFAULT_AAC_DELAY;
  const impulseAt = 4096;
  const length = 4 * impulseAt;
  let encoder: AudioEncoder | null = null;
  let decoder: AudioDecoder | null = null;
  try {
    const chunks: EncodedAudioChunk[] = [];
    let config: AudioDecoderConfig | undefined;
    encoder = new window.AudioEncoder({
      output: (chunk, meta) => {
        if (meta?.decoderConfig) config = meta.decoderConfig;
        chunks.push(chunk);
      },
      error: () => {},
    });
    encoder.configure({ ...toEncoderConfig(plan), numberOfChannels: 1 });
    const input = new Float32Array(length);
    input[impulseAt] = 0.9;
    const data = new window.AudioData({
      format: 'f32-planar',
      sampleRate: plan.sampleRate,
      numberOfFrames: length,
      numberOfChannels: 1,
      timestamp: 0,
      data: input,
    });
    try {
      encoder.encode(data);
    } finally {
      data.close();
    }
    await encoder.flush();
    closeCodec(encoder);
    if (!config) return DEFAULT_AAC_DELAY;

    const decoded: number[] = [];
    decoder = new window.AudioDecoder({
      output: (audio) => {
        const plane = new Float32Array(audio.numberOfFrames);
        audio.copyTo(plane, { planeIndex: 0, format: 'f32-planar' });
        audio.close();
        for (const v of plane) decoded.push(v);
      },
      error: () => {},
    });
    decoder.configure(config);
    for (const chunk of chunks) decoder.decode(chunk);
    await decoder.flush();
    closeCodec(decoder);

    let peak = -1;
    for (let i = 0; i < decoded.length; i++) {
      if (peak < 0 || Math.abs(decoded[i]) > Math.abs(decoded[peak])) peak = i;
    }
    const delay = peak - impulseAt;
    return delay >= 0 && delay < plan.sampleRate ? delay : DEFAULT_AAC_DELAY;
  } catch (err) {
    logger.debug('AAC encoder delay measurement failed; using the default:', err);
    return DEFAULT_AAC_DELAY;
  } finally {
    // Every exit path releases the native codecs (a no-op when already closed).
    if (encoder) closeCodec(encoder);
    if (decoder) closeCodec(decoder);
  }
}

/**
 * Close a WebCodecs codec unless it is closed already (a native fatal error
 * closes it, and a second `close()` throws). Never throws, so a cleanup can
 * not replace the error that caused it.
 *
 * @post codec.state === 'closed'
 */
function closeCodec(codec: { state: string; close(): void }): void {
  if (codec.state === 'closed') return;
  try {
    codec.close();
  } catch {
    /* already closed by the browser in the meantime */
  }
}

function toEncoderConfig(plan: AudioTrackPlan): AudioEncoderConfig {
  return {
    codec: plan.encoderCodec,
    sampleRate: plan.sampleRate,
    numberOfChannels: plan.numberOfChannels,
    bitrate: plan.bitrate,
  };
}

/**
 * Mix the audio source down to `duration` seconds. When the mixdown fails, log
 * one warning and return silence, so the audio track keeps the video length.
 *
 * @post result.length === plan.numberOfChannels
 * @post result[i].length === Math.round(duration * plan.sampleRate)
 */
export async function renderAudioChannels(
  source: AudioMixdownSource,
  duration: number,
  plan: AudioTrackPlan,
): Promise<Float32Array[]> {
  const length = Math.max(0, Math.round(duration * plan.sampleRate));
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < plan.numberOfChannels; ch++) channels.push(new Float32Array(length));
  if (length === 0) return channels;
  try {
    const buffer = await source.mixdown(duration, plan.sampleRate);
    for (let ch = 0; ch < plan.numberOfChannels; ch++) {
      const data = buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1));
      channels[ch].set(data.subarray(0, length));
    }
  } catch (err) {
    logger.warn('Audio mixdown failed; the exported audio track is silent:', err);
  }
  return channels;
}

/**
 * Encode planar float channels with the WebCodecs `AudioEncoder`.
 *
 * The track keeps every source sample. For AAC the mp4 edit list then trims
 * it to the input length exactly. For Opus, webm-muxer (5.x) cannot write
 * end trimming (`DiscardPadding`), so the decoded track ends on a whole Opus
 * frame: it is up to one frame (20 ms) longer than the input, never shorter.
 *
 * @pre channels.every((c) => c.length === channels[0].length)
 * @post every encoded chunk with timestamp < input length + encoder delay
 *   (AAC priming, or the Opus pre-skip) went to `onChunk`, in order
 */
export async function encodeAudioChannels(
  channels: Float32Array[],
  plan: AudioTrackPlan,
  onChunk: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void,
): Promise<void> {
  let failure: unknown = null;
  const total = channels.length > 0 ? channels[0].length : 0;
  // The encoder output is longer than the input by its delay (AAC priming,
  // Opus pre-skip), and the encoder pads its last frame and may add a flush
  // frame. Keep every chunk that carries input (it starts before input end +
  // delay) and drop the rest, so the track holds all source samples.
  const inputUs = (total / plan.sampleRate) * 1_000_000;
  let delayUs =
    ((plan.codec === 'opus' ? DEFAULT_OPUS_PRE_SKIP : plan.encoderDelay) / plan.sampleRate) *
    1_000_000;
  const encoder = new window.AudioEncoder({
    output: (chunk, meta) => {
      const preSkip = plan.codec === 'opus' ? opusPreSkip(meta?.decoderConfig?.description) : null;
      // The Opus pre-skip is always counted at 48 kHz (RFC 7845).
      if (preSkip !== null) delayUs = (preSkip / 48_000) * 1_000_000;
      if (chunk.timestamp < inputUs + delayUs) onChunk(chunk, meta);
    },
    error: (err: DOMException) => {
      failure = err;
    },
  });
  try {
    encoder.configure(toEncoderConfig(plan));
    encodeBlocks(encoder, channels, plan);
    await encoder.flush();
  } finally {
    // Also on a throw from encode() or flush(): the error above propagates.
    closeCodec(encoder);
  }
  if (failure) {
    throw failure instanceof Error ? failure : new Error(String(failure));
  }
}

/** Feed every source sample to `encoder`, from sample 0, in blocks. */
function encodeBlocks(encoder: AudioEncoder, channels: Float32Array[], plan: AudioTrackPlan): void {
  const total = channels.length > 0 ? channels[0].length : 0;
  // The container skips the encoder priming (an edit list in mp4; the Opus
  // header in webm).
  for (let start = 0; start < total; start += BLOCK_FRAMES) {
    const frames = Math.min(BLOCK_FRAMES, total - start);
    const planar = new Float32Array(frames * channels.length);
    channels.forEach((channel, ch) =>
      planar.set(channel.subarray(start, start + frames), ch * frames),
    );
    const data = new window.AudioData({
      format: 'f32-planar',
      sampleRate: plan.sampleRate,
      numberOfFrames: frames,
      numberOfChannels: channels.length,
      timestamp: Math.round((start / plan.sampleRate) * 1_000_000),
      data: planar,
    });
    try {
      encoder.encode(data);
    } finally {
      data.close();
    }
  }
}
