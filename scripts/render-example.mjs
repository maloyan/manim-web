#!/usr/bin/env node
/**
 * render-example.mjs - render an example page to a video file.
 *
 * Usage:
 *   node scripts/render-example.mjs <example-name> [--width 1080] [--height 1080]
 *     [--fps 30] [--out out.mp4] [--url http://...] [--port 5200]
 *     [--duration <max seconds>] [--bitrate 8000000] [--no-audio] [--headed]
 *     [--browser chrome|chromium]
 *
 * The example opts in with one line, `registerRender(scene)` (see
 * src/export/renderHarness.ts). The script:
 *   1. starts vite on a free port in 5200-5209 (or uses --url),
 *   2. opens the page in headless Chrome through Playwright with a paused fake
 *      clock (GPU flags on macOS, because software GL is very slow),
 *   3. moves the clock one frame at a time and encodes each frame in the page
 *      with WebCodecs, then adds the mixed-down audio track,
 *   4. writes the file to --out.
 *
 * Browser and codec: the installed Google Chrome (channel 'chrome') comes first,
 * because it has H.264 and AAC encoders. Playwright's bundled Chromium usually
 * has no H.264 encoder; then the script writes WebM (VP9 + Opus) next to --out
 * and prints the ffmpeg command that converts it to mp4.
 *
 * Exit code: 0 on success, 1 on any failure, 130 / 143 / 129 on SIGINT /
 * SIGTERM / SIGHUP. A page error or an unhandled promise rejection after the
 * render starts is a failure: the script then writes no file. Vite and the
 * browser stop on every exit path (failure, startup timeout, signal).
 */
import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { createServer } from 'net';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHUNK = 4 * 1024 * 1024;
const MAX_SECONDS_DEFAULT = 300;

/** The processes to stop on every exit path (normal end, failure, signal). */
const live = { vite: null, browser: null };

/** The one teardown in flight; every caller (end, failure, signal) awaits it. */
let cleaning = null;

/**
 * Stop vite and close the browser. Safe to call more than once: all callers
 * share one promise. The handles stay in `live` until teardown is complete,
 * so the exit hook can still kill vite if the process ends meanwhile.
 */
function cleanup() {
  cleaning ??= (async () => {
    const { browser, vite } = live;
    if (isRunning(vite)) signalVite(vite, 'SIGTERM'); // before the browser wait
    if (browser) await Promise.race([browser.close().catch(() => {}), sleep(5000)]);
    await stopVite(vite);
    live.browser = null;
    live.vite = null;
  })();
  return cleaning;
}

// Last resort: vite runs in its own process group (detached), so it would
// outlive this process. Kill it synchronously on any exit.
process.on('exit', () => {
  if (isRunning(live.vite)) signalVite(live.vite, 'SIGKILL');
});
for (const [signal, code] of [
  ['SIGINT', 130],
  ['SIGTERM', 143],
  ['SIGHUP', 129],
]) {
  process.on(signal, () => {
    // A second signal during teardown: kill vite now, then finish the teardown.
    if (cleaning && isRunning(live.vite)) signalVite(live.vite, 'SIGKILL');
    console.error(`\nrender-example: ${signal}, stopping vite and the browser`);
    cleanup().finally(() => process.exit(code));
  });
}

function parseArgs(argv) {
  const opts = {
    name: null,
    width: 1080,
    height: 1080,
    fps: 30,
    out: null,
    url: null,
    port: null,
    duration: null,
    bitrate: null,
    audio: true,
    headed: false,
    browser: 'chrome',
  };
  const numeric = new Set(['width', 'height', 'fps', 'port', 'duration', 'bitrate']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-audio') opts.audio = false;
    else if (arg === '--headed') opts.headed = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[++i];
      if (!(key in opts) || value === undefined) throw new Error(`Unknown or empty option ${arg}`);
      opts[key] = numeric.has(key) ? Number(value) : value;
      if (numeric.has(key) && !Number.isFinite(opts[key])) {
        throw new Error(`Option ${arg} needs a number, got "${value}"`);
      }
    } else if (!opts.name) opts.name = arg;
    else throw new Error(`Unexpected argument "${arg}"`);
  }
  if (opts.help) return opts;
  if (!opts.name) throw new Error('Missing <example-name>');
  if (opts.width % 2 || opts.height % 2) throw new Error('Width and height must be even');
  if (!['chrome', 'chromium'].includes(opts.browser)) {
    throw new Error(`--browser must be chrome or chromium, got "${opts.browser}"`);
  }
  opts.out = resolve(opts.out ?? `${opts.name}.mp4`);
  opts.bitrate ??= Math.round(opts.width * opts.height * opts.fps * 0.2);
  return opts;
}

function isPortFree(port) {
  return new Promise((res) => {
    const srv = createServer();
    srv.once('error', () => res(false));
    srv.listen(port, '127.0.0.1', () => srv.close(() => res(true)));
  });
}

async function pickPort(wanted) {
  const candidates = wanted ? [wanted] : Array.from({ length: 10 }, (_, i) => 5200 + i);
  for (const port of candidates) if (await isPortFree(port)) return port;
  throw new Error(`No free port in ${candidates.join(', ')}`);
}

function findPage(name) {
  for (const dir of ['examples', 'examples/3d-scenes']) {
    if (existsSync(join(ROOT, dir, `${name}.html`))) return `${dir}/${name}.html`;
  }
  throw new Error(`No page examples/${name}.html or examples/3d-scenes/${name}.html`);
}

async function startVite(port) {
  const bin = join(ROOT, 'node_modules', '.bin', 'vite');
  const child = spawn(bin, ['--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  // Register at once: a startup timeout or a signal must stop it too.
  live.vite = child;
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 300; i++) {
    if (child.exitCode !== null) throw new Error(`vite exited early:\n${log}`);
    try {
      const res = await globalThis.fetch(`${base}/`);
      if (res.status < 500) return { child, base };
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  // The shared teardown keeps the handle until vite has exited, so a signal
  // in this window still finds it (and the exit hook can still kill it).
  await cleanup();
  throw new Error(`vite did not start on port ${port}:\n${log}`);
}

const isRunning = (child) => child && child.exitCode === null && child.signalCode === null;

/** Signal vite's process group (it is detached, so it has its own). */
function signalVite(child, signal) {
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

/** Stop vite: SIGTERM, wait up to 3 s for it to exit, then SIGKILL. */
async function stopVite(child) {
  if (!isRunning(child)) return;
  const exited = new Promise((res) => child.once('exit', res));
  signalVite(child, 'SIGTERM');
  await Promise.race([exited, sleep(3000)]);
  if (isRunning(child)) signalVite(child, 'SIGKILL');
}

function launchArgs() {
  const args = ['--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist'];
  if (process.platform === 'darwin') args.push('--use-angle=metal', '--enable-gpu');
  return args;
}

async function launchBrowser(headed, preferred) {
  // The script handles the signals itself (it must also stop vite).
  const base = {
    headless: !headed,
    args: launchArgs(),
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  };
  if (preferred === 'chromium') {
    return { browser: await chromium.launch(base), label: 'chromium (bundled)' };
  }
  try {
    return { browser: await chromium.launch({ ...base, channel: 'chrome' }), label: 'chrome' };
  } catch (err) {
    console.warn(`Google Chrome (channel 'chrome') not available: ${err.message.split('\n')[0]}`);
    console.warn("Falling back to Playwright's bundled Chromium.");
    return { browser: await chromium.launch(base), label: 'chromium (bundled)' };
  }
}

async function openPage(browser, opts, url) {
  const context = await browser.newContext({
    viewport: { width: Math.max(1280, opts.width + 64), height: Math.max(800, opts.height + 64) },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  // Uncaught errors and unhandled rejections in the page. After start() each
  // one fails the render.
  const fatal = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    fatal.push(e.message);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    // "Failed to load resource" repeats a response error without its URL.
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
      errors.push(m.text());
    }
    if (m.type() === 'warning' && m.text().includes('[manim-web]'))
      console.warn(`page: ${m.text()}`);
  });
  // A paused fake clock: the scene moves only when the script moves the clock.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  for (let i = 0; i < 300; i++) {
    if (await page.evaluate(() => Boolean(globalThis.__manimRender)))
      return { page, errors, fatal };
    await sleep(100);
  }
  if (errors.length) {
    throw new Error(`The page failed to load:\n  ${errors.join('\n  ')}`);
  }
  throw new Error(
    `The page never registered a render handle. Add one line to the example:\n` +
      `  registerRender(scene);  // import { registerRender } from '../src/index.ts'`,
  );
}

/** Pick the container and codecs this browser can encode. */
function chooseFormat(probe, opts, label) {
  if (!probe.webCodecs) throw new Error(`${label} has no WebCodecs VideoEncoder.`);
  const wantMp4 = extname(opts.out).toLowerCase() !== '.webm';
  if (wantMp4 && probe.avc) {
    if (opts.audio && !probe.aac) console.warn(`${label} cannot encode AAC: the mp4 has no audio.`);
    return { format: 'mp4', codec: 'avc', out: opts.out, convert: null };
  }
  if (!probe.vp9) {
    throw new Error(`${label} can encode neither H.264 nor VP9 at ${opts.width}x${opts.height}.`);
  }
  if (!wantMp4) return { format: 'webm', codec: 'vp9', out: opts.out, convert: null };
  const out = opts.out.replace(/\.[^.]+$/, '') + '.webm';
  console.warn(
    `${label} has no H.264 encoder (Playwright's bundled Chromium ships without one). ` +
      `Install Google Chrome for a direct mp4. Writing WebM (VP9 + Opus) instead.`,
  );
  const convert = `ffmpeg -i "${out}" -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 160k "${opts.out}"`;
  return { format: 'webm', codec: 'vp9', out, convert };
}

async function waitWhileBusy(page) {
  for (let i = 0; i < 600; i++) {
    if (!(await page.evaluate(() => globalThis.__manimRender.isBusy()))) return;
    await sleep(10);
  }
  throw new Error('An audio file did not load within 6 s.');
}

/** Throw when the page reported a failure (scene error, page error, rejection). */
function assertNoFailure(state, fatal) {
  if (state.error) throw new Error(`The scene code failed: ${state.error}`);
  if (fatal.length) throw new Error(`The page threw during the render: ${fatal[0]}`);
}

/** Let the page run one task (MessageChannel is not faked by the paused clock). */
function settle(page) {
  return page.evaluate(
    () =>
      new Promise((res) => {
        const channel = new globalThis.MessageChannel();
        channel.port1.onmessage = () => res();
        channel.port2.postMessage(0);
      }),
  );
}

async function renderFrames(page, opts, fatal) {
  const maxSeconds = opts.duration ?? MAX_SECONDS_DEFAULT;
  const maxFrames = Math.ceil(maxSeconds * opts.fps);
  const started = Date.now();
  let lastReport = 0;
  let clockMs = 0;
  let frames = 0;
  let done = false;
  while (frames < maxFrames) {
    if (frames > 0) {
      const target = Math.round((frames * 1000) / opts.fps);
      await page.clock.runFor(target - clockMs);
      clockMs = target;
    }
    await waitWhileBusy(page);
    const state = await page.evaluate(async () => {
      const r = globalThis.__manimRender;
      const count = await r.captureFrame();
      return { count, done: r.isDone(), error: r.error() };
    });
    frames = state.count;
    assertNoFailure(state, fatal);
    const now = Date.now();
    if (now - lastReport > 1000) {
      lastReport = now;
      const fps = frames / ((now - started) / 1000);
      process.stdout.write(
        `\rframe ${frames} (${(frames / opts.fps).toFixed(1)} s video) at ${fps.toFixed(1)} fps   `,
      );
    }
    if (state.done) {
      done = true;
      break;
    }
  }
  // An error thrown as the scene ends (e.g. by a #playBtn handler that then
  // re-enables the button) is reported one task later: wait for it.
  await settle(page);
  assertNoFailure(await page.evaluate(() => ({ error: globalThis.__manimRender.error() })), fatal);
  const seconds = (Date.now() - started) / 1000;
  process.stdout.write('\n');
  if (!done) {
    console.warn(
      `Stopped at ${maxSeconds} s: the scene did not finish (a forever wait or a loop?). ` +
        `Set --duration to choose the length.`,
    );
  }
  return { frames, seconds };
}

/**
 * Write `data` to `out` through a temporary sibling file and a rename, so a
 * failed write never leaves a truncated file or replaces an older render.
 */
function writeAtomically(out, data) {
  mkdirSync(dirname(out), { recursive: true });
  const tmp = `${out}.partial-${process.pid}`;
  try {
    writeFileSync(tmp, data);
    renameSync(tmp, out);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw new Error(`Could not write ${out}: ${err.message}`);
  }
}

async function readOutput(page, size) {
  const parts = [];
  for (let offset = 0; offset < size; offset += CHUNK) {
    const b64 = await page.evaluate(
      ([o, n]) => globalThis.__manimRender.readChunk(o, n),
      [offset, CHUNK],
    );
    parts.push(Buffer.from(b64, 'base64'));
  }
  return Buffer.concat(parts);
}

/** Vite answers a new lazy dependency by re-optimizing; the first import of it then fails once. */
const VITE_REOPTIMIZE =
  /Failed to fetch dynamically imported module|Outdated Optimize Dep|error loading dynamically imported module/;

async function openAndStart(browser, opts, url, label) {
  for (let attempt = 1; ; attempt++) {
    const { page, errors, fatal } = await openPage(browser, opts, url);
    try {
      const probe = await page.evaluate(
        ([w, h, f]) => globalThis.__manimRender.probe(w, h, f),
        [opts.width, opts.height, opts.fps],
      );
      const choice = chooseFormat(probe, opts, label);
      // Errors while the page loaded stay warnings; from start() on they fail.
      fatal.length = 0;
      const { hasAudio } = await page.evaluate((o) => globalThis.__manimRender.start(o), {
        width: opts.width,
        height: opts.height,
        fps: opts.fps,
        format: choice.format,
        codec: choice.codec,
        bitrate: opts.bitrate,
        includeAudio: opts.audio,
      });
      return { page, errors, fatal, choice, hasAudio };
    } catch (err) {
      await page.context().close();
      if (attempt >= 3 || !VITE_REOPTIMIZE.test(err.message)) throw err;
      console.warn('vite re-optimized its dependencies; reloading the page.');
    }
  }
}

const HELP = `Usage: node scripts/render-example.mjs <example-name> [--width 1080] [--height 1080]
  [--fps 30] [--out out.mp4] [--url URL] [--port 5200] [--duration SECONDS]
  [--bitrate BPS] [--no-audio] [--headed] [--browser chrome|chromium]`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  try {
    let url = opts.url;
    if (!url) {
      const page = findPage(opts.name);
      const port = await pickPort(opts.port);
      const server = await startVite(port);
      url = `${server.base}/${page}`;
      console.log(`vite on port ${port}`);
    }
    const launched = await launchBrowser(opts.headed, opts.browser);
    const browser = launched.browser;
    live.browser = browser;
    console.log(`browser: ${launched.label} ${browser.version()}`);
    const { page, errors, fatal, choice, hasAudio } = await openAndStart(
      browser,
      opts,
      url,
      launched.label,
    );
    console.log(
      `rendering ${url} at ${opts.width}x${opts.height} ${opts.fps} fps, ` +
        `${choice.format}/${choice.codec}, audio: ${hasAudio ? (choice.format === 'mp4' ? 'aac' : 'opus') : 'none'}`,
    );

    const { frames, seconds } = await renderFrames(page, opts, fatal);
    const clips = await page.evaluate(() => globalThis.__manimRender.audioClips());
    if (hasAudio && clips.length === 0) console.log('no audio clips: the audio track is silent');
    for (const c of clips) {
      console.log(
        `audio clip at ${c.startTime.toFixed(3)} s for ${c.duration.toFixed(3)} s, gain ${c.gain}: ${c.url}`,
      );
    }
    const size = await page.evaluate(() => globalThis.__manimRender.finish());
    const data = await readOutput(page, size);
    assertNoFailure({ error: null }, fatal);
    writeAtomically(choice.out, data);
    if (errors.length) console.warn(`page errors during the render:\n  ${errors.join('\n  ')}`);
    console.log(
      `wrote ${choice.out} (${(size / 1e6).toFixed(2)} MB, ${frames} frames, ` +
        `${(frames / opts.fps).toFixed(2)} s) in ${seconds.toFixed(1)} s = ${(frames / seconds).toFixed(1)} fps`,
    );
    if (choice.convert) console.log(`convert to mp4:\n  ${choice.convert}`);
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error(`render-example: ${err.message}`);
  process.exitCode = 1;
});
