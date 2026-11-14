#!/usr/bin/env node
/**
 * generate.mjs - make the narration clips and the music bed of the
 * `cell_tour_3d` example. Local only: no outside service gets the text.
 *
 * Usage (from the repo root):
 *   node examples/audio/cell_tour/generate.mjs [--engine kokoro|say]
 *        [--voice <name>] [--speed <x>] [--rate <wpm>] [--only <id>] [--no-music]
 *
 *   --engine kokoro  (default) Kokoro-82M, Apache-2.0, through kokoro-onnx in
 *                    Python (kokoro_tts.py next to this file). Voice ids such as
 *                    af_heart (default), af_bella, am_michael, bm_george.
 *                    --speed sets the speaking speed (default from lines.json).
 *   --engine say     macOS `say`. --voice is a name from `say -v '?'`
 *                    (default Daniel), --rate is words per minute (default 172).
 *   --only <id>      remake one clip only (the music bed is not touched).
 *   --no-music       do not remake music.mp3.
 *
 * Kokoro setup, once (any virtual environment, Python 3.10 to 3.13):
 *   python3 -m venv ~/.venvs/kokoro
 *   ~/.venvs/kokoro/bin/pip install kokoro-onnx==0.6.1 soundfile
 *   mkdir -p ~/.cache/kokoro-onnx && cd ~/.cache/kokoro-onnx
 *   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
 *   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
 * Then: KOKORO_PYTHON=~/.venvs/kokoro/bin/python node examples/audio/cell_tour/generate.mjs
 * (KOKORO_MODEL_DIR points at another folder with the two model files.)
 *
 * Input:  lines.json next to this file:
 *         { engine, voice, speed, sayVoice, sayRate, lines: [{ id, text, speak?, speed? }] }.
 *         `text` is the written line; `speak`, when present, is what the voice
 *         reads instead (acronyms spelled out, symbols as words). In `speak`,
 *         [word](/IPA/) pins one word's sound for Kokoro (`say` reads the word).
 *         A line's `speed` multiplies the Kokoro speed (short lines read slower).
 * Output: <id>.mp3 per line and music.mp3 (a 20 s chord pad that loops without
 *         a seam), next to this file. Each clip is mono, 48 kHz, 64 kbps,
 *         loudness -18 LUFS (two-pass loudnorm, true peak -1.5 dB), starts with
 *         exactly 60 ms of silence and ends with a 60 ms fade-out.
 *
 * The scene waits for each clip, so its timeline follows the new lengths.
 * You can also replace the clips with your own recordings under the same names.
 */
import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(readFileSync(join(HERE, 'lines.json'), 'utf8'));

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const engine = opt('engine', script.engine ?? 'kokoro');
if (engine !== 'kokoro' && engine !== 'say') {
  console.error(`unknown --engine ${engine} (use kokoro or say)`);
  process.exit(2);
}
const voice = opt('voice', engine === 'say' ? script.sayVoice : script.voice);
const speed = String(opt('speed', script.speed ?? 1));
const rate = String(opt('rate', script.sayRate ?? 172));
const only = opt('only', null);
const music = !only && !args.includes('--no-music');

const lines = script.lines.filter(({ id }) => !only || id === only);
if (only && lines.length === 0) {
  console.error(`no line with id ${only} in lines.json`);
  process.exit(2);
}

const work = mkdtempSync(join(tmpdir(), 'cell-tour-'));
const ffmpeg = (input, output, filters, rateHz = 48000) =>
  execFileSync('ffmpeg', [
    ...['-v', 'error', '-y', '-i', input, '-af', filters],
    ...['-ac', '1', '-ar', String(rateHz), '-c:a', 'libmp3lame', '-b:a', '64k', output],
  ]);
const seconds = (file) =>
  Number(
    execFileSync('ffprobe', [
      ...['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    ]).toString(),
  );

// ── speech: one WAV per line in `work` ───────────────────────────────────
const spoken = lines.map(({ id, text, speak, speed: k }) => ({
  id,
  text: speak ?? text,
  speed: k,
}));
if (engine === 'kokoro') {
  const python = process.env.KOKORO_PYTHON ?? 'python3';
  const res = spawnSync(
    python,
    [join(HERE, 'kokoro_tts.py'), '--out-dir', work, '--voice', voice, '--speed', speed],
    { input: JSON.stringify(spoken), stdio: ['pipe', 'inherit', 'inherit'] },
  );
  if (res.error || res.status !== 0) {
    if (res.error) console.error(`cannot run ${python}: ${res.error.message}`);
    console.error(
      'Kokoro failed. Set KOKORO_PYTHON (see the top of this file) or pass --engine say.',
    );
    rmSync(work, { recursive: true, force: true });
    process.exit(1);
  }
} else {
  for (const { id, text: pinned } of spoken) {
    // `say` has no IPA input: a pinned word "[word](/IPA/)" is read as the word.
    const text = pinned.replace(/\[([^\]]+)\]\(\/[^/]+\/\)/g, '$1');
    execFileSync('say', [
      '-v',
      voice,
      '-r',
      rate,
      '-o',
      join(work, `${id}.wav`),
      '--data-format=LEF32@24000',
      text,
    ]);
  }
}

// ── post: trim, 60 ms lead-in, two-pass loudnorm, fade-out, mp3 ─────────
const LEAD = 0.06;
const TAIL = 0.15;
const FADE = 0.06;
const LOUD = 'I=-18:TP=-1.5:LRA=11';
const trim =
  'silenceremove=start_periods=1:start_threshold=-50dB,' +
  'areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,' +
  `adelay=${LEAD * 1000}:all=1,apad=pad_dur=${TAIL}`;
let total = 0;
for (const { id, text } of spoken) {
  const raw = join(work, `${id}.wav`);
  const trimmed = join(work, `${id}.trim.wav`);
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-i',
    raw,
    '-af',
    trim,
    '-ac',
    '1',
    '-ar',
    '48000',
    trimmed,
  ]);
  const d = seconds(trimmed);
  // Pass 1 measures the loudness; pass 2 applies one fixed gain (linear mode).
  const probe = spawnSync('ffmpeg', [
    ...[
      '-hide_banner',
      '-i',
      trimmed,
      '-af',
      `loudnorm=${LOUD}:print_format=json`,
      '-f',
      'null',
      '-',
    ],
  ]).stderr.toString();
  const m = JSON.parse(probe.slice(probe.lastIndexOf('{'), probe.lastIndexOf('}') + 1));
  const measured =
    `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:` +
    `measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const out = join(HERE, `${id}.mp3`);
  ffmpeg(
    trimmed,
    out,
    `loudnorm=${LOUD}:${measured},afade=t=out:st=${(d - FADE).toFixed(3)}:d=${FADE}`,
  );
  const len = seconds(out);
  total += len;
  console.log(`${id.padEnd(14)} ${len.toFixed(2)} s  ${text}`);
}
const who = engine === 'say' ? `say ${voice} rate ${rate}` : `kokoro ${voice} speed ${speed}`;
console.log(`narration total ${total.toFixed(1)} s, ${who}`);

// ── music bed: our own chord pad, synthesized here ───────────────────────
// Four chords, 5 s each. Each chord has a cos^2 window of half-width 5 s around
// its centre, so neighbouring windows always sum to 1 (a smooth crossfade), and
// the windows wrap around the 20 s loop. Every frequency is a multiple of
// 0.05 Hz, so each sine ends its 20 s on a whole number of cycles: no seam.
if (music) {
  const SR = 44100;
  const LOOP = 20;
  const hz = (midi) => Math.round(440 * 2 ** ((midi - 69) / 12) * 20) / 20;
  const chords = [
    [45, 52, 57, 60, 64], // A minor
    [41, 48, 57, 60, 64], // F major 7
    [48, 55, 60, 64, 67], // C major
    [43, 50, 59, 62, 67], // G major
  ].map((c) => c.map(hz));
  const n = SR * LOOP;
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    chords.forEach((freqs, k) => {
      let d = Math.abs(t - (k * 5 + 2.5));
      d = Math.min(d, LOOP - d);
      if (d >= 5) return;
      const w = Math.cos((Math.PI * d) / 10) ** 2;
      for (const f of freqs) {
        // Two slightly detuned voices and a soft octave: a warm, slow pad.
        const a = Math.sin(2 * Math.PI * (f - 0.15) * t) + Math.sin(2 * Math.PI * (f + 0.15) * t);
        v += w * (a + 0.15 * Math.sin(2 * Math.PI * 2 * f * t)) * (f < 120 ? 0.7 : 0.45);
      }
    });
    const swell = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.1 * t);
    pcm[i] = Math.round(Math.max(-1, Math.min(1, 0.15 * v * swell)) * 32767);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.byteLength, 40);
  const wav = join(work, 'music.wav');
  writeFileSync(wav, Buffer.concat([header, Buffer.from(pcm.buffer)]));
  // A gentle low-pass keeps the pad behind the voice. (No loudnorm here: it
  // changes the gain over time, and the loop would no longer meet itself.)
  ffmpeg(wav, join(HERE, 'music.mp3'), 'lowpass=f=1800', SR);
  console.log(`music.mp3 ${seconds(join(HERE, 'music.mp3')).toFixed(2)} s`);
}
rmSync(work, { recursive: true, force: true });
