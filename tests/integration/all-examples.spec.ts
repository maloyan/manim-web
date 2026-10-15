// Broad render check over every example page.
//
// Each example is loaded in a real browser in ?embed (auto-play) mode. After the
// animation settles we screenshot #container and decode it: a healthy example
// draws real ink, so an empty / all-black final frame (a scene that never built,
// a feature that renders nothing, or an animation that fades to empty) fails
// here, and so does any console/page error.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pngStats } from './pngStats';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function listPages(): string[] {
  const pages: string[] = [];
  for (const dir of ['examples', 'examples/3d-scenes', 'examples/.e2e']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) if (f.endsWith('.html')) pages.push(`${dir}/${f}`);
  }
  return pages.sort();
}

const base = (rel: string) => path.basename(rel, '.html');

// Interactive / audio / hardware / player pages: they need a click, sound, a
// gamepad, or a video the headless run has no frames for. Their final frame is
// legitimately empty, so only their errors are checked.
const NO_CONTENT_ASSERT = new Set([
  'player',
  'slides_mode',
  'slides_mode_loop',
  'web_component',
  'voiceover',
  'broadcast',
  'spatial_audio',
  'video_mobject',
  'game_input',
  'export_animation', // the standalone html is button-driven (docs component is asserted elsewhere)
  // Button-driven / draggable / developer repro pages with no embed auto-play:
  // they open to an empty stage on purpose and need a user action.
  'debug_line2',
  'issue_419_repro',
  'log_callback',
  'cradle_simulation',
  'manim_examples',
]);

// Pages that fetch an external resource the headless run may not reach.
const ALLOW_ERRORS = new Set(['video_mobject', 'svg_from_url']);

for (const rel of listPages()) {
  const name = base(rel);
  test(name, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto(`/${rel}?embed`, { waitUntil: 'load', timeout: 20_000 });

    // Pages that are not embed-auto-play expose a #playBtn — click it once.
    const btn = page.locator('#playBtn');
    if (await btn.count()) {
      await btn.click({ timeout: 1500 }).catch(() => {});
    }

    await page
      .waitForSelector('#container svg, #container canvas', { timeout: 12_000 })
      .catch(() => {});
    await page.waitForTimeout(5500);

    // A viewport screenshot, not a locator one: the container animates, so
    // locator.screenshot waits for it to be "stable" and times out on a
    // looping scene. The viewport is the embedded canvas full-bleed anyway.
    const shot = await page.screenshot({ animations: 'disabled' });
    const stats = pngStats(shot);

    if (!ALLOW_ERRORS.has(name)) {
      expect(errors, `console/page errors:\n${errors.join('\n')}`).toHaveLength(0);
    }
    if (!NO_CONTENT_ASSERT.has(name)) {
      // A healthy final frame draws real ink. The bar is low: it catches an
      // empty / all-black scene, not thin or grayscale ones.
      expect(
        stats.nonBlack,
        `near-empty final frame (nonBlack=${stats.nonBlack}, colored=${stats.colored})`,
      ).toBeGreaterThan(150);
    }
  });
}
