import { test, expect } from '@playwright/test';

/**
 * Browser regressions for two docs examples that rendered an all-black frame
 * with no console error.
 *
 * Headless unit tests mock WebGL, so they cannot catch an off-screen or
 * zero-size render. These mount each scene in a real browser and assert that
 * the expected content actually draws (non-background pixels).
 */

async function readCanvasReport(page: import('@playwright/test').Page) {
  return page.evaluate(
    () => (window as unknown as { __render?: Record<string, number> }).__render ?? null,
  );
}

test('SVG import example renders the gradient rect and text (not an all-black frame)', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/examples/svg_gradient_text_example.html');
  await expect(page.locator('#status')).toHaveText(/RENDERED/, { timeout: 20_000 });

  const report = await readCanvasReport(page);
  expect(report, 'no __render report produced').not.toBeNull();
  // The gradient rect alone covers thousands of pixels; a black frame is 0.
  expect(report!.nonBlack).toBeGreaterThan(2000);
  // A white outline is grayscale; the gradient fill and text add real color.
  expect(report!.colored).toBeGreaterThan(2000);
  expect(consoleErrors, `unexpected console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
});

test('ParticleSystem example spawns and renders particles during wait()', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/examples/particle_system_example.html');
  await expect(page.locator('#status')).toHaveText(/RENDERED/, { timeout: 20_000 });

  const report = await readCanvasReport(page);
  expect(report, 'no __render report produced').not.toBeNull();
  // The emitter must tick during wait(999999): particles alive and drawn.
  expect(report!.living).toBeGreaterThan(50);
  expect(report!.nonBlack).toBeGreaterThan(1000);
  expect(consoleErrors, `unexpected console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
});
