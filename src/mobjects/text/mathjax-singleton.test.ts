// @vitest-environment happy-dom

/**
 * Regression for issue #396.
 *
 * MathTex broke when manim-web was loaded through esm.sh because
 * `RegisterHTMLHandler(adaptor)` and `mathjax.document(...)` ended up running
 * against two different copies of the `mathjax` singleton (the downstream
 * bundler re-inlined `@mathjax/src/mjs/mathjax.js` into multiple chunks).
 *
 * The fix collapses every `@mathjax/src` access into `./MathJaxBundle.ts`.
 * These tests verify the invariant that callers can rely on:
 *
 *   1. `renderLatexToSVG` succeeds — confirming no "Can't find handler for
 *      document" leak when MathJax is consumed through the wrapper.
 *   2. After bundle load the `mathjax` singleton has the HTML handler that
 *      `RegisterHTMLHandler` returned, i.e. the renderer is talking to the
 *      same object that holds the handler list.
 *
 * Order matters: the render test runs first so it cannot be falsely greened
 * by handler registration performed inside another test in this file.
 */

import { describe, expect, it } from "vitest";
import {
  MathJaxSingletonMismatchError,
  renderLatexToSVG,
} from "./MathJaxRenderer";

describe("MathJax singleton (issue #396)", () => {
  it('renders LaTeX without throwing "Can\'t find handler for document"', async () => {
    // First test in the file: if `loadMathJax` ever stops calling
    // RegisterHTMLHandler internally, the singleton stays empty and this
    // call throws the issue #396 error before any other test can prime it.
    const result = await renderLatexToSVG("x");
    expect(result.vmobjectGroup.children.length).toBeGreaterThan(0);
  });

  it("points renderer and RegisterHTMLHandler at the same singleton", async () => {
    const bundle = await import("./MathJaxBundle");
    const adaptor = bundle.liteAdaptor();
    const registered = bundle.RegisterHTMLHandler(adaptor) as unknown;

    const mathjax = bundle.mathjax as unknown as {
      handlers: Iterable<unknown>;
    };

    // The exact handler RegisterHTMLHandler returned must be reachable from
    // mathjax.handlers; this proves both sides share state, which is what
    // breaks under esm.sh's chunk duplication. PrioritizedList wraps each
    // entry as { item, priority }, so unwrap before checking.
    const items = Array.from(mathjax.handlers).map((entry) =>
      (entry as { item: unknown }).item
    );
    expect(items).toContain(registered);
  });

  it("exports a typed mismatch error so the CDN fallback can catch it", () => {
    const err = new MathJaxSingletonMismatchError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MathJaxSingletonMismatchError");
  });
});
