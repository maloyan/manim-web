// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { encodeAudioChannels, planAudioTrack, type AudioTrackPlan } from './webCodecsAudio';

afterEach(() => vi.unstubAllGlobals());

/** An OpusHead (RFC 7845) with the given pre-skip. */
function opusHead(preSkip: number): Uint8Array {
  const head = new Uint8Array(19);
  head.set(new TextEncoder().encode('OpusHead'), 0);
  head[8] = 1; // version
  head[9] = 2; // channels
  head[10] = preSkip & 0xff;
  head[11] = preSkip >> 8;
  return head;
}

/**
 * A fake Opus encoder: 960-sample packets at k * 20 ms, the output delayed by
 * `preSkip` samples, plus one extra flush packet, like libopus.
 */
function stubOpusEncoder(preSkip: number) {
  class FakeEncoder {
    private _samples = 0;
    constructor(private init: { output: (chunk: unknown, meta?: unknown) => void }) {}
    configure() {}
    encode(data: { numberOfFrames: number }) {
      this._samples += data.numberOfFrames;
    }
    async flush() {
      const packets = Math.ceil((this._samples + preSkip) / 960) + 1;
      for (let k = 0; k < packets; k++) {
        const meta = k === 0 ? { decoderConfig: { description: opusHead(preSkip) } } : undefined;
        this.init.output({ timestamp: k * 20_000 }, meta);
      }
    }
    close() {}
  }
  class FakeAudioData {
    numberOfFrames: number;
    constructor(init: { numberOfFrames: number }) {
      this.numberOfFrames = init.numberOfFrames;
    }
    close() {}
  }
  vi.stubGlobal('AudioEncoder', FakeEncoder);
  vi.stubGlobal('AudioData', FakeAudioData);
}

describe('encodeAudioChannels (Opus)', () => {
  // MIGRATION: example for the property
  //   ∀ input length n, Opus pre-skip p: the kept packets cover n + p samples
  //   (ceil((n + p) / 960) packets), so no source sample is cut at the end,
  //   and the trailing flush packet is dropped.
  // Replace with a property test once the suite lands.
  it('keeps the packets that carry the last samples after the pre-skip', async () => {
    stubOpusEncoder(312);
    const plan: AudioTrackPlan = {
      codec: 'opus',
      encoderCodec: 'opus',
      sampleRate: 48_000,
      numberOfChannels: 1,
      bitrate: 128_000,
      encoderDelay: 0,
    };
    const kept: number[] = [];
    // 4800 samples = exactly 5 Opus frames; with 312 pre-skip they need 6 packets.
    await encodeAudioChannels([new Float32Array(4800)], plan, (chunk) =>
      kept.push(chunk.timestamp),
    );
    expect(kept).toEqual([0, 20_000, 40_000, 60_000, 80_000, 100_000]);
  });
});

/**
 * A mock AudioEncoder with a `state` and a `close` spy. `failAt` makes the
 * n-th `encode()` throw; `closedByError` marks the encoder closed (as a native
 * fatal error does) before `flush()` rejects.
 */
function stubClosableEncoder(options: { failAt?: number; closedByError?: boolean } = {}) {
  const encoders: Array<{ state: string; close: ReturnType<typeof vi.fn> }> = [];
  const datas: Array<{ closed: boolean }> = [];
  const encodeError = new DOMException('encode failed', 'EncodingError');
  class MockEncoder {
    state = 'unconfigured';
    calls = 0;
    close = vi.fn(() => {
      if (this.state === 'closed') throw new DOMException('closed', 'InvalidStateError');
      this.state = 'closed';
    });
    constructor(private init: { output: (chunk: unknown, meta?: unknown) => void }) {
      encoders.push(this);
    }
    static isConfigSupported = () => Promise.resolve({ supported: true });
    configure() {
      this.state = 'configured';
    }
    encode(data: { timestamp: number }) {
      if (++this.calls === options.failAt) throw encodeError;
      this.init.output({ timestamp: data.timestamp }, undefined);
    }
    flush() {
      if (options.closedByError) {
        this.state = 'closed';
        return Promise.reject(encodeError);
      }
      return Promise.resolve();
    }
  }
  class MockAudioData {
    closed = false;
    timestamp: number;
    constructor(init: { timestamp: number }) {
      this.timestamp = init.timestamp;
      datas.push(this);
    }
    close() {
      this.closed = true;
    }
  }
  vi.stubGlobal('AudioEncoder', MockEncoder);
  vi.stubGlobal('AudioData', MockAudioData);
  return { encoders, datas, encodeError };
}

const AAC_PLAN: AudioTrackPlan = {
  codec: 'aac',
  encoderCodec: 'mp4a.40.2',
  sampleRate: 48_000,
  numberOfChannels: 1,
  bitrate: 128_000,
  encoderDelay: 2112,
};

describe('encodeAudioChannels releases its encoder', () => {
  // MIGRATION: example for the property
  //   ∀ failing call k of encode() (or a flush that rejects): the encode error
  //   propagates, every AudioData is closed, and the encoder is closed once
  //   (not again when a native error already closed it).
  // Replace with a property test once the suite lands.
  it('closes the encoder and every AudioData when encode() throws', async () => {
    for (const failAt of [1, 10]) {
      const { encoders, datas, encodeError } = stubClosableEncoder({ failAt });
      const input = [new Float32Array(48_000 * 2)]; // 20 blocks
      await expect(encodeAudioChannels(input, AAC_PLAN, () => {})).rejects.toBe(encodeError);
      expect(encoders[0].close).toHaveBeenCalledTimes(1);
      expect(datas).toHaveLength(failAt);
      expect(datas.every((d) => d.closed)).toBe(true);
    }
  });

  it('closes the encoder once on success and not again after a native close', async () => {
    const ok = stubClosableEncoder();
    await encodeAudioChannels([new Float32Array(9600)], AAC_PLAN, () => {});
    expect(ok.encoders[0].close).toHaveBeenCalledTimes(1);

    const dead = stubClosableEncoder({ closedByError: true });
    await expect(encodeAudioChannels([new Float32Array(9600)], AAC_PLAN, () => {})).rejects.toBe(
      dead.encodeError,
    );
    expect(dead.encoders[0].close).not.toHaveBeenCalled();
  });
});

describe('planAudioTrack (AAC delay measurement) releases its encoder', () => {
  // MIGRATION: example for the property
  //   ∀ failure while measuring the AAC delay, the measuring encoder is closed
  //   and the plan falls back to 2112 samples.
  // Replace with a property test once the suite lands.
  it('closes the measuring encoder when encode() throws and falls back to 2112', async () => {
    const { encoders } = stubClosableEncoder({ failAt: 1 });
    vi.stubGlobal('AudioDecoder', class {});
    const plan = await planAudioTrack('mp4', 48_000, 128_000);
    expect(plan?.encoderDelay).toBe(2112);
    expect(encoders[0].close).toHaveBeenCalledTimes(1);
  });
});
