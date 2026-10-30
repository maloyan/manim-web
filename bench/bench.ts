/**
 * Browser side of the benchmark. `run.mjs` loads this page and calls
 * `window.runBench(name)` once per scene.
 *
 * The real `Scene.play()` path is timed. `requestAnimationFrame` is replaced
 * with a manual queue driven on a virtual 60 fps clock, so every run steps the
 * same frames regardless of how fast the machine is. Each frame is timed twice:
 * - `cpu`: the rAF callback (timeline update + updaters + scene render submit).
 * - `total`: `cpu` plus `gl.finish()`, so GPU work the frame queued is counted.
 */
import { Scene } from '../src/index.ts';
import { SCENES } from './scenes.ts';

const FRAME_MS = 1000 / 60;

type RafCallback = (time: number) => void;
let rafQueue: Array<{ id: number; cb: RafCallback }> = [];
let rafNextId = 1;
const realNow = performance.now.bind(performance);
window.requestAnimationFrame = (cb: RafCallback) => {
  const id = rafNextId++;
  rafQueue.push({ id, cb });
  return id;
};
window.cancelAnimationFrame = (id: number) => {
  rafQueue = rafQueue.filter((e) => e.id !== id);
};

interface PerformanceMemory {
  usedJSHeapSize: number;
}

function heapBytes(): number {
  const mem = (performance as unknown as { memory?: PerformanceMemory }).memory;
  return mem ? mem.usedJSHeapSize : 0;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

function summarize(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((s, x) => s + x, 0) / Math.max(1, samples.length);
  return {
    mean: +mean.toFixed(3),
    p50: +percentile(sorted, 50).toFixed(3),
    p95: +percentile(sorted, 95).toFixed(3),
    max: +(sorted[sorted.length - 1] ?? 0).toFixed(3),
  };
}

async function runBench(name: string) {
  const def = SCENES[name];
  if (!def) throw new Error(`unknown bench scene: ${name}`);

  const container = document.getElementById('container')!;
  container.innerHTML = '';
  const scene = new Scene(container, { width: 1280, height: 720 });
  const three = scene.renderer.getThreeRenderer();
  const gl = three.getContext();

  const tBuild = realNow();
  const anims = await def.build(scene);
  const buildMs = realNow() - tBuild;

  // Drain the pending add() render so it is not counted as an animation frame.
  await new Promise((r) => setTimeout(r, 0));
  rafQueue = [];

  const heapBefore = heapBytes();
  // Freeze the scene's view of time on the virtual clock, so the first frame's
  // dt (and every alpha after it) is identical on every run.
  let virtual = 0;
  performance.now = () => virtual;
  const playDone = scene.play(...anims);

  const cpu: number[] = [];
  const total: number[] = [];
  const frames: string[] = [];
  const drawCalls: number[] = [];
  const triangles: number[] = [];
  // A hard cap guards against a scene that never stops scheduling frames.
  const maxFrames = Math.ceil((def.duration * 1000) / FRAME_MS) + 30;

  let done = false;
  void playDone.then(() => (done = true));

  for (let f = 0; f < maxFrames && !done;) {
    if (rafQueue.length === 0) {
      // play() can start its loop after async setup (e.g. MathTex layout).
      // Yield untimed until it schedules a frame or settles.
      await new Promise((r) => setTimeout(r, 0));
      continue;
    }
    f++;
    const queue = rafQueue;
    rafQueue = [];
    virtual += FRAME_MS;
    const t0 = realNow();
    for (const { cb } of queue) cb(virtual);
    const t1 = realNow();
    gl.finish();
    const t2 = realNow();
    cpu.push(t1 - t0);
    total.push(t2 - t0);
    drawCalls.push(three.info.render.calls);
    triangles.push(three.info.render.triangles);
    // Capture the middle frame (mid-animation) for pixel comparison. The
    // drawing buffer is still valid within the task that rendered it.
    if (f === Math.round((def.duration * 1000) / FRAME_MS / 2)) {
      frames.push(three.domElement.toDataURL('image/png'));
    }
  }
  await playDone;
  performance.now = realNow;
  frames.push(captureNow(scene));
  const heapAfter = heapBytes();

  const result = {
    scene: name,
    frameCount: cpu.length,
    buildMs: +buildMs.toFixed(1),
    cpuMs: summarize(cpu),
    totalMs: summarize(total),
    drawCalls: Math.max(...drawCalls),
    triangles: Math.max(...triangles),
    geometries: three.info.memory.geometries,
    textures: three.info.memory.textures,
    heapDeltaMB: +((heapAfter - heapBefore) / 1048576).toFixed(2),
    frames: frames,
  };
  scene.dispose();
  return result;
}

function captureNow(scene: Scene): string {
  scene.render();
  return scene.renderer.getThreeRenderer().domElement.toDataURL('image/png');
}

/** Per-pixel comparison of two PNG data URLs. */
async function diffImages(a: string, b: string) {
  const load = async (src: string) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height).data;
  };
  const [da, db] = await Promise.all([load(a), load(b)]);
  if (da.length !== db.length) return { sizeMismatch: true, maxDiff: 255, changedPct: 100 };
  let maxDiff = 0;
  let changed = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.max(
      Math.abs(da[i] - db[i]),
      Math.abs(da[i + 1] - db[i + 1]),
      Math.abs(da[i + 2] - db[i + 2]),
    );
    if (d > maxDiff) maxDiff = d;
    if (d > 8) changed++;
  }
  return {
    sizeMismatch: false,
    maxDiff,
    changedPct: +((changed / (da.length / 4)) * 100).toFixed(3),
  };
}

function glInfo(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return 'no webgl2';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
}

Object.assign(window, { runBench, glInfo, diffImages, benchScenes: Object.keys(SCENES) });
document.title = 'bench-ready';
