/**
 * Browser side of the ManimCE parity harness. `run.mjs` loads this page and
 * calls `window.renderParity(name, frames)`.
 *
 * The scene's real `construct` runs under a virtual clock: requestAnimationFrame,
 * setTimeout/setInterval and performance.now() all read virtual time, which
 * advances exactly 1/FPS per step. Frame `i` is captured right after the step
 * that brings virtual time to `i / FPS`, the same timestamp as ManimCE's
 * video frame `i`. Real async work (fonts, MathJax) still resolves on the real
 * event loop; virtual time only advances when the scene is waiting on it.
 */
import { Scene } from '../src/index.ts';
import { SCENES } from './scenes.ts';

const FPS = 30;
/** Grayscale level above which a pixel counts as content, not background. */
const CONTENT_LEVEL = 16;
const STEP_MS = 1000 / FPS;

const real = {
  setTimeout: window.setTimeout.bind(window),
  now: performance.now.bind(performance),
};

let virtualMs = 0;
let nextId = 1;
let rafQueue: Array<{ id: number; cb: FrameRequestCallback }> = [];
interface Timer {
  id: number;
  due: number;
  cb: () => void;
  interval: number | null;
}
let timers: Timer[] = [];

function installVirtualClock(): void {
  performance.now = () => virtualMs;
  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    rafQueue.push({ id, cb });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    rafQueue = rafQueue.filter((e) => e.id !== id);
  };
  const schedule = (cb: TimerHandler, ms = 0, interval: boolean) => {
    const id = nextId++;
    const fn = typeof cb === 'function' ? (cb as () => void) : () => {};
    timers.push({ id, due: virtualMs + ms, cb: fn, interval: interval ? Math.max(ms, 1) : null });
    return id;
  };
  const clear = (id?: number) => {
    timers = timers.filter((t) => t.id !== id);
  };
  (window as unknown as { setTimeout: unknown }).setTimeout = (cb: TimerHandler, ms?: number) =>
    schedule(cb, ms, false);
  (window as unknown as { setInterval: unknown }).setInterval = (cb: TimerHandler, ms?: number) =>
    schedule(cb, ms, true);
  window.clearTimeout = clear;
  window.clearInterval = clear;
}

/** Let promise chains and real I/O callbacks run before the next virtual step. */
const realYield = () => new Promise<void>((r) => real.setTimeout(r, 0));

function step(): void {
  virtualMs += STEP_MS;
  // Fire due timers in due order; an interval re-arms itself.
  for (;;) {
    timers.sort((a, b) => a.due - b.due);
    const t = timers[0];
    if (!t || t.due > virtualMs + 1e-6) break;
    if (t.interval !== null) t.due += t.interval;
    else timers.shift();
    t.cb();
  }
  const queue = rafQueue;
  rafQueue = [];
  for (const { cb } of queue) cb(virtualMs);
}

interface ParityResult {
  frames: Record<number, string>;
  durationFrames: number;
  error?: string;
}

async function renderParity(name: string, wanted: number[]): Promise<ParityResult> {
  const construct = SCENES[name];
  if (!construct) return { frames: {}, durationFrames: 0, error: `no manim-web twin for ${name}` };

  const container = document.getElementById('container')!;
  container.innerHTML = '';
  virtualMs = 0;
  rafQueue = [];
  timers = [];
  installVirtualClock();

  // The page runs at devicePixelRatio 1, so the canvas is exactly 1280x720,
  // matching ManimCE's 720p output.
  const scene = new Scene(container, { width: 1280, height: 720, backgroundColor: '#000000' });
  const canvas = scene.getCanvas();

  const pending = new Set(wanted);
  const frames: Record<number, string> = {};
  const capture = (frame: number) => {
    if (!pending.has(frame)) return;
    pending.delete(frame);
    scene.render();
    frames[frame] = canvas.toDataURL('image/png');
  };

  let done = false;
  let error: string | undefined;
  construct(scene).then(
    () => (done = true),
    (e: unknown) => {
      error = e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e);
      done = true;
    },
  );

  let frame = 0;
  let idleMs = 0;
  capture(0);
  while (!done) {
    await realYield();
    if (done) break;
    if (rafQueue.length === 0 && timers.length === 0) {
      // Waiting on real async work (font or LaTeX loading): let real time pass.
      await new Promise((r) => real.setTimeout(r, 5));
      idleMs += 5;
      if (idleMs > 30_000) {
        error = 'scene stalled: no frames or timers for 30 s';
        break;
      }
      continue;
    }
    idleMs = 0;
    step();
    frame++;
    capture(frame);
    if (frame > FPS * 120) {
      error = 'scene ran longer than 120 s of virtual time';
      break;
    }
  }
  // Frames past the end of the scene show its final state, like ManimCE's last frame.
  for (const f of [...pending]) capture(f);
  scene.dispose();
  return { frames, durationFrames: frame, error };
}

/** SSIM on downscaled grayscale, plus mean absolute difference, for two PNGs. */
async function compareImages(a: string, b: string, scale = 4) {
  const load = async (src: string) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = Math.round(img.width / scale);
    const h = Math.round(img.height / scale);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(w * h);
    for (let i = 0; i < g.length; i++) {
      g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    }
    return { g, w, h };
  };
  const [x, y] = await Promise.all([load(a), load(b)]);
  if (x.w !== y.w || x.h !== y.h) return { ssim: 0, mad: 255 };

  // Mean SSIM over 8x8 windows (stride 4), standard constants for 8-bit images.
  // Only windows with content in either image count: on a mostly-black frame,
  // plain SSIM is dominated by identical empty background and hides real
  // differences (a square where a circle should be still scored 0.94).
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  let total = 0;
  let n = 0;
  let absDiff = 0;
  for (let i = 0; i < x.g.length; i++) absDiff += Math.abs(x.g[i] - y.g[i]);
  for (let wy = 0; wy + 8 <= x.h; wy += 4) {
    for (let wx = 0; wx + 8 <= x.w; wx += 4) {
      let mx = 0;
      let my = 0;
      let peak = 0;
      for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
          const k = (wy + j) * x.w + wx + i;
          mx += x.g[k];
          my += y.g[k];
          peak = Math.max(peak, x.g[k], y.g[k]);
        }
      }
      if (peak < CONTENT_LEVEL) continue;
      mx /= 64;
      my /= 64;
      let vx = 0;
      let vy = 0;
      let cov = 0;
      for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
          const k = (wy + j) * x.w + wx + i;
          const dx = x.g[k] - mx;
          const dy = y.g[k] - my;
          vx += dx * dx;
          vy += dy * dy;
          cov += dx * dy;
        }
      }
      vx /= 63;
      vy /= 63;
      cov /= 63;
      total += ((2 * mx * my + c1) * (2 * cov + c2)) / ((mx * mx + my * my + c1) * (vx + vy + c2));
      n++;
    }
  }
  // A frame with no content in either image is a perfect match.
  return { ssim: n ? +(total / n).toFixed(4) : 1, mad: +(absDiff / x.g.length).toFixed(2) };
}

/** Side-by-side strip: ManimCE | manim-web | amplified difference. */
async function sideBySide(a: string, b: string): Promise<string> {
  const load = async (src: string) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  };
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = 640;
  const h = 360;
  const c = document.createElement('canvas');
  c.width = w * 3;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(ia, 0, 0, w, h);
  ctx.drawImage(ib, w, 0, w, h);
  const da = ctx.getImageData(0, 0, w, h).data;
  const db = ctx.getImageData(w, 0, w, h).data;
  const diff = ctx.createImageData(w, h);
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.min(
      255,
      3 *
        (Math.abs(da[i] - db[i]) +
          Math.abs(da[i + 1] - db[i + 1]) +
          Math.abs(da[i + 2] - db[i + 2])),
    );
    diff.data[i] = d;
    diff.data[i + 1] = 0;
    diff.data[i + 2] = 0;
    diff.data[i + 3] = 255;
  }
  ctx.putImageData(diff, w * 2, 0);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('ManimCE', 8, 20);
  ctx.fillText('manim-web', w + 8, 20);
  ctx.fillText('difference ×3', 2 * w + 8, 20);
  return c.toDataURL('image/png');
}

Object.assign(window, {
  renderParity,
  compareImages,
  sideBySide,
  parityScenes: Object.keys(SCENES),
});
document.title = 'parity-ready';
