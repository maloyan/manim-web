#!/usr/bin/env node
/**
 * Frame-time benchmark for manim-web.
 *
 *   node bench/run.mjs [--label NAME] [--runs N] [--throttle X] [--scene NAME ...]
 *   node bench/run.mjs --compare bench/results/a.json bench/results/b.json
 *   node bench/run.mjs --profile --scene NAME
 *
 * Starts a Vite dev server, opens `bench/index.html` in Chromium (real GPU when
 * available), and runs each scene `--runs` times (default 5) after one warm-up.
 * `--throttle 4` applies CDP CPU throttling to approximate a low-end laptop or
 * phone. Results are medians over runs, written to `bench/results/<label>.json`,
 * with the mid and end frames saved under `bench/results/frames/<label>/`.
 *
 * `--compare` prints the timing deltas and a per-pixel diff of the saved frames,
 * so a performance change can show it renders the same image.
 * `--profile` prints the top self-time functions from a CDP CPU profile.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
  options: {
    label: { type: 'string', default: 'current' },
    runs: { type: 'string', default: '5' },
    throttle: { type: 'string', default: '1' },
    scene: { type: 'string', multiple: true },
    compare: { type: 'boolean', default: false },
    profile: { type: 'boolean', default: false },
    headed: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

function compareTimings(a, b) {
  const pct = (x, y) => (x === 0 ? 'n/a' : `${(((y - x) / x) * 100).toFixed(0)}%`);
  const rows = [];
  for (const [name, ra] of Object.entries(a.scenes)) {
    const rb = b.scenes[name];
    if (!rb) continue;
    rows.push({
      scene: name,
      'cpu mean': `${ra.cpuMean} -> ${rb.cpuMean} (${pct(ra.cpuMean, rb.cpuMean)})`,
      'cpu p95': `${ra.cpuP95} -> ${rb.cpuP95} (${pct(ra.cpuP95, rb.cpuP95)})`,
      draws: `${ra.drawCalls} -> ${rb.drawCalls}`,
      triangles: `${ra.triangles} -> ${rb.triangles}`,
      'heap MB': `${ra.heapDeltaMB} -> ${rb.heapDeltaMB}`,
    });
  }
  console.log(`${a.label} -> ${b.label} (ms per frame, median of runs)`);
  console.table(rows);
}

async function comparePixels(page, aLabel, bLabel, names) {
  const read = (label, name, which) => {
    try {
      const f = resolve(root, `bench/results/frames/${label}/${name}-${which}.png`);
      return 'data:image/png;base64,' + readFileSync(f).toString('base64');
    } catch {
      return null;
    }
  };
  const rows = [];
  for (const name of names) {
    for (const which of ['mid', 'end']) {
      const a = read(aLabel, name, which);
      const b = read(bLabel, name, which);
      if (!a || !b) continue;
      const d = await page.evaluate(([x, y]) => window.diffImages(x, y), [a, b]);
      rows.push({ scene: name, frame: which, ...d });
    }
  }
  console.log(`pixels ${aLabel} vs ${bLabel} (changedPct = pixels differing by > 8/255)`);
  console.table(rows);
}

function printProfile(name, profile) {
  const dt = new Map();
  profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0)));
  const self = new Map();
  let total = 0;
  for (const node of profile.nodes) {
    const f = node.callFrame;
    if (f.functionName === '(idle)' || f.functionName === '(program)') continue;
    const t = dt.get(node.id) ?? 0;
    const file = f.url.split('/').pop()?.split('?')[0] ?? '';
    const key = `${f.functionName || '(anon)'}  ${file}:${f.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + t);
    total += t;
  }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log(`\n== ${name}: top self time (total ${(total / 1000).toFixed(0)} ms)`);
  for (const [k, t] of top) console.log(`${((t / total) * 100).toFixed(1).padStart(5)}%  ${k}`);
}

async function main() {
  const compareFiles = values.compare ? positionals.filter((x) => x.endsWith('.json')) : null;
  const compareData = compareFiles?.map((f) => JSON.parse(readFileSync(f, 'utf8')));
  if (compareData) compareTimings(...compareData);

  const { createServer } = await import('vite');
  const { chromium } = await import('@playwright/test');

  const server = await createServer({ root, logLevel: 'error', server: { port: 5199 } });
  await server.listen();
  const url = `http://localhost:${server.config.server.port}/bench/index.html`;

  const browser = await chromium.launch({
    headless: !values.headed,
    // The full Chromium build (not headless-shell) can use the real GPU when headless.
    channel: 'chromium',
    args: [
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc',
      '--ignore-gpu-blocklist',
      '--enable-gpu',
      ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []),
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => document.title === 'bench-ready', null, { timeout: 120_000 });

  const close = async () => {
    await browser.close();
    await server.close();
  };

  if (compareData) {
    await comparePixels(
      page,
      compareData[0].label,
      compareData[1].label,
      Object.keys(compareData[0].scenes),
    );
    return close();
  }

  const throttle = Number(values.throttle);
  if (throttle > 1) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  }

  const gpu = await page.evaluate(() => window.glInfo());
  const all = await page.evaluate(() => window.benchScenes);
  const names = values.scene?.length ? values.scene : all;

  if (values.profile) {
    const cdp = await page.context().newCDPSession(page);
    for (const name of names) {
      await page.evaluate((n) => window.runBench(n), name);
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
      await cdp.send('Profiler.start');
      for (let i = 0; i < 3; i++) await page.evaluate((n) => window.runBench(n), name);
      const { profile } = await cdp.send('Profiler.stop');
      printProfile(name, profile);
      if (process.env.BENCH_DUMP) {
        writeFileSync(resolve(root, `bench/results/${name}.cpuprofile`), JSON.stringify(profile));
      }
    }
    return close();
  }

  const runs = Number(values.runs);
  const out = {
    label: values.label,
    gpu,
    throttle,
    runs,
    date: new Date().toISOString(),
    scenes: {},
  };
  const shotDir = resolve(root, `bench/results/frames/${values.label}`);
  mkdirSync(shotDir, { recursive: true });

  for (const name of names) {
    // One untimed warm-up run so JIT and shader compilation are not measured.
    await page.evaluate((n) => window.runBench(n), name);
    const results = [];
    for (let i = 0; i < runs; i++) {
      await page.evaluate(() => window.gc?.());
      results.push(await page.evaluate((n) => window.runBench(n), name));
    }
    results[0].frames.forEach((dataUrl, i) => {
      const file = resolve(shotDir, `${name}-${i === 0 ? 'mid' : 'end'}.png`);
      writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    });
    out.scenes[name] = {
      frames: results[0].frameCount,
      buildMs: median(results.map((r) => r.buildMs)),
      cpuMean: median(results.map((r) => r.cpuMs.mean)),
      cpuP95: median(results.map((r) => r.cpuMs.p95)),
      totalMean: median(results.map((r) => r.totalMs.mean)),
      totalP95: median(results.map((r) => r.totalMs.p95)),
      drawCalls: median(results.map((r) => r.drawCalls)),
      triangles: median(results.map((r) => r.triangles)),
      geometries: median(results.map((r) => r.geometries)),
      heapDeltaMB: median(results.map((r) => r.heapDeltaMB)),
    };
    console.log(name, JSON.stringify(out.scenes[name]));
  }
  await close();

  const file = resolve(root, `bench/results/${values.label}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  console.log(`GPU: ${gpu}  throttle: ${throttle}x  -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
