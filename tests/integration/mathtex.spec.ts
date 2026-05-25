import { test, expect } from '@playwright/test';

/**
 * Browser regression for issue #396.
 *
 * When manim-web was loaded through esm.sh, `MathTex` failed with
 * `Can't find handler for document` because the `@mathjax/src` singleton was
 * duplicated across chunks. The fix collapses every MathJax import behind
 * `MathJaxBundle.ts`, so a single dynamic import chunk owns the singleton.
 *
 * This test reuses the user-supplied reproduction (radius label `r`) and
 * confirms MathTex actually renders without a render error in the browser.
 */

test('issue #396 — MathTex renders inside a ThreeDScene', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/examples/issue_396_repro.html');

  await expect(page.locator('#status')).toHaveText(/MathTex rendered/, { timeout: 20_000 });

  // The exact runtime error from the issue must not appear.
  const handlerError = consoleErrors.find((m) => /Can't find handler for document/.test(m));
  expect(handlerError, `unexpected MathJax handler error: ${handlerError}`).toBeUndefined();
});
