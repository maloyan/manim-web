#!/usr/bin/env node
/**
 * ManimCE ↔ manim-web visual parity harness.
 *
 *   node parity/run.mjs [--scene NAME ...] [--every N] [--python PATH] [--threshold T]
 *
 * For each scene in `parity/scenes.py`:
 *   1. ManimCE renders it at 720p30 (cached until scenes.py changes) and ffmpeg
 *      extracts every frame.
 *   2. Its manim-web twin in `parity/scenes.ts` runs in Chromium under a virtual
 *      30 fps clock, capturing every N-th frame (default 5) and the last one.
 *   3. Each captured frame is scored by SSIM (grayscale, 1/4 scale, content
 *      windows only, so empty background cannot mask a difference) against
 *      ManimCE frames f-1, f, f+1; the best match counts, so a one-frame
 *      scheduling offset is not reported as a difference.
 *
 * Writes `parity/results/report.md`, `report.json`, and for each scene a
 * side-by-side image (ManimCE | manim-web | difference) of its worst frame.
 *
 * Requirements: ManimCE (`pip install manim`, plus LaTeX for MathTex) and
 * ffmpeg on PATH. `--python` (or MANIMCE_PYTHON) picks the interpreter that has
 * ManimCE installed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'parity/results');
const { values } = parseArgs({
  options: {
    scene: { type: 'string', multiple: true },
    every: { type: 'string', default: '5' },
    python: { type: 'string', default: process.env.MANIMCE_PYTHON ?? 'python' },
    threshold: { type: 'string', default: '0.8' },
  },
});
const every = Number(values.every);
const threshold = Number(values.threshold);
const scenesPy = resolve(root, 'parity/scenes.py');

function sceneNames() {
  const src = readFileSync(scenesPy, 'utf8');
  return [...src.matchAll(/^class (\w+)\(\w*Scene\):/gm)].map((m) => m[1]);
}

/** Render with ManimCE and extract frames; returns the sorted PNG paths. */
function renderManimCE(name) {
  const media = resolve(out, 'media');
  const video = resolve(media, 'videos/scenes/720p30', `${name}.mp4`);
  const frameDir = resolve(out, 'manimce', name);
  const stale = !existsSync(video) || statSync(video).mtimeMs < statSync(scenesPy).mtimeMs;
  if (stale) {
    execFileSync(
      values.python,
      ['-m', 'manim', 'render', '-qm', '--disable_caching', '--media_dir', media, scenesPy, name],
      { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
    );
  }
  if (stale || !existsSync(frameDir)) {
    mkdirSync(frameDir, { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, resolve(frameDir, '%05d.png')]);
  }
  return readdirSync(frameDir)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => resolve(frameDir, f));
}

const dataUrl = (file) => 'data:image/png;base64,' + readFileSync(file).toString('base64');

async function main() {
  const names = values.scene?.length ? values.scene : sceneNames();
  mkdirSync(out, { recursive: true });

  const { createServer } = await import('vite');
  const { chromium } = await import('@playwright/test');
  const server = await createServer({ root, logLevel: 'error', server: { port: 5198 } });
  await server.listen();
  const browser = await chromium.launch({
    channel: 'chromium',
    args: [
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
  await page.goto(`http://localhost:${server.config.server.port}/parity/index.html`);
  await page.waitForFunction(() => document.title === 'parity-ready', null, { timeout: 120_000 });

  const report = [];
  for (const name of names) {
    process.stdout.write(`${name}: `);
    let ceFrames;
    try {
      ceFrames = renderManimCE(name);
    } catch (e) {
      const msg = String(e.stderr ?? e.message)
        .split('\n')
        .slice(-6)
        .join('\n');
      report.push({ scene: name, status: 'manimce-error', error: msg });
      console.log('ManimCE failed');
      continue;
    }
    const last = ceFrames.length - 1;
    const wanted = [];
    for (let f = 0; f < last; f += every) wanted.push(f);
    wanted.push(last);

    const web = await page.evaluate(([n, w]) => window.renderParity(n, w), [name, wanted]);
    const rows = [];
    for (const f of wanted) {
      const mine = web.frames[f];
      if (!mine) continue;
      let best = { ssim: -1, mad: 255, ceFrame: f };
      for (const g of [f - 1, f, f + 1]) {
        if (g < 0 || g > last) continue;
        const s = await page.evaluate(
          ([a, b]) => window.compareImages(a, b),
          [dataUrl(ceFrames[g]), mine],
        );
        if (s.ssim > best.ssim) best = { ...s, ceFrame: g };
      }
      rows.push({ frame: f, time: +(f / 30).toFixed(2), ...best });
    }

    const worst = rows.reduce((a, b) => (b.ssim < a.ssim ? b : a), rows[0] ?? { ssim: 0 });
    const minSsim = rows.length ? Math.min(...rows.map((r) => r.ssim)) : 0;
    const meanSsim = rows.length ? rows.reduce((s, r) => s + r.ssim, 0) / rows.length : 0;
    const status = web.error ? 'web-error' : minSsim >= threshold ? 'pass' : 'diff';
    if (worst && web.frames[worst.frame]) {
      const strip = await page.evaluate(
        ([a, b]) => window.sideBySide(a, b),
        [dataUrl(ceFrames[worst.ceFrame]), web.frames[worst.frame]],
      );
      writeFileSync(resolve(out, `${name}-worst.png`), Buffer.from(strip.split(',')[1], 'base64'));
    }
    report.push({
      scene: name,
      status,
      ceDurationFrames: ceFrames.length,
      webDurationFrames: web.durationFrames,
      meanSsim: +meanSsim.toFixed(4),
      minSsim: +minSsim.toFixed(4),
      worstTime: worst?.time,
      error: web.error,
      frames: rows,
    });
    console.log(
      `${status}  mean SSIM ${meanSsim.toFixed(3)}  min ${minSsim.toFixed(3)} @ ${worst?.time}s`,
    );
  }

  await browser.close();
  await server.close();

  writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const lines = [
    '# ManimCE parity report',
    '',
    `Threshold: min SSIM ≥ ${threshold}. Frames sampled every ${every} at 30 fps, each matched against ManimCE frames ±1.`,
    '',
    '| scene | status | mean SSIM | min SSIM | worst at | duration CE / web (frames) |',
    '|---|---|---|---|---|---|',
    ...report.map(
      (r) =>
        `| ${r.scene} | ${r.status} | ${r.meanSsim ?? ''} | ${r.minSsim ?? ''} | ${r.worstTime ?? ''}s | ${r.ceDurationFrames ?? ''} / ${r.webDurationFrames ?? ''} |`,
    ),
    '',
    ...report.filter((r) => r.error).map((r) => `**${r.scene}**: \`${r.error.split('\n')[0]}\``),
  ];
  writeFileSync(resolve(out, 'report.md'), lines.join('\n') + '\n');
  console.log(`\n${resolve(out, 'report.md')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
