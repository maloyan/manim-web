// @vitest-environment node

/**
 * Build-shape regression for issue #396.
 *
 * The issue #396 bug only manifests when downstream bundlers re-bundle each
 * emitted chunk independently (e.g. esm.sh). Source-level tests cannot catch
 * a regression that re-externalizes `@mathjax/src` in `vite.config.ts`, so we
 * assert against the published `dist/` shape directly:
 *
 *   - `dist/src-*.js` must contain exactly one `await import("./MathJaxBundle*")`
 *     and no other `@mathjax/src` dynamic imports. Any other MathJax chunk
 *     name (mathjax-*, tex-*, svg-*, html-*, liteAdaptor-*, AmsConfiguration*,
 *     NewcommandConfiguration*, ConfigMacrosConfiguration*) means the
 *     singleton can be duplicated again under re-bundling.
 *
 * The test is skipped when `dist/` is absent (developer who has not run
 * `npm run build`); CI runs `npm run build` first.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(__dirname, '..', '..', '..', 'dist');

const SPLIT_CHUNK_PATTERNS = [
  /mathjax-[A-Za-z0-9_-]+\.js/,
  /^tex-[A-Za-z0-9_-]+\.js/,
  /^svg-[A-Za-z0-9_-]+\.js/,
  /^html-[A-Za-z0-9_-]+\.js/,
  /liteAdaptor-[A-Za-z0-9_-]+\.js/,
  /AmsConfiguration-[A-Za-z0-9_-]+\.js/,
  /NewcommandConfiguration-[A-Za-z0-9_-]+\.js/,
  /ConfigMacrosConfiguration-[A-Za-z0-9_-]+\.js/,
];

describe('dist/ MathJax chunk shape (issue #396)', () => {
  if (!existsSync(DIST)) {
    it.skip('dist/ not built — skipping shape assertion', () => {});
    return;
  }

  const files = readdirSync(DIST);

  it('emits a single MathJaxBundle chunk and no split MathJax chunks', () => {
    const bundles = files.filter((f) => /^MathJaxBundle-[A-Za-z0-9_-]+\.js$/.test(f));
    expect(
      bundles.length,
      `expected exactly one MathJaxBundle chunk, got: ${bundles.join(', ')}`,
    ).toBe(1);

    for (const pattern of SPLIT_CHUNK_PATTERNS) {
      const offenders = files.filter((f) => pattern.test(f));
      expect(
        offenders,
        `dist/ must not contain ${pattern} — these chunks split the mathjax singleton and reintroduce #396`,
      ).toEqual([]);
    }
  });

  it('renderer dynamic-imports only the MathJaxBundle chunk', () => {
    const srcChunks = files.filter((f) => /^src-[A-Za-z0-9_-]+\.js$/.test(f));
    expect(srcChunks.length, 'expected a dist/src-*.js entry chunk').toBeGreaterThan(0);

    for (const chunk of srcChunks) {
      const body = readFileSync(join(DIST, chunk), 'utf8');
      const dynImports = [...body.matchAll(/await import\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
      const mathjaxImports = dynImports.filter((n) =>
        /MathJax|mathjax|tex-|svg-|html-|liteAdaptor|Configuration/i.test(n),
      );
      expect(
        mathjaxImports,
        `dist/${chunk} must only dynamic-import MathJaxBundle, got: ${mathjaxImports.join(', ')}`,
      ).toSatisfy((arr: string[]) => arr.every((n) => /^MathJaxBundle-/.test(n)));
    }
  });
});
