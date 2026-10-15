// @vitest-environment happy-dom
/**
 * Guard for the KaTeX stylesheet version.
 *
 * MathTexImage renders LaTeX with the bundled KaTeX engine but paints the DOM
 * KaTeX produces onto a canvas, so KaTeX's own CSS must be present AND must
 * match the engine version. KaTeX renames layout classes between releases
 * (`sizing` in 0.16 became `katex-sizing` in 0.18). A stylesheet pinned to a
 * different major/minor than the engine then fails, silently, to scale script
 * content: subscripts and superscripts render at full size (x_1 looks like
 * "x1"). The URL is therefore derived from `katex.version`; this test fails if
 * that link is ever hard-pinned away from the installed engine again.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import katex from 'katex';

describe('KaTeX stylesheet version', () => {
  beforeEach(() => {
    // Fresh module state + a clean head so each import appends its own link.
    document.head.innerHTML = '';
  });

  it('loads the stylesheet for the exact installed KaTeX engine version', async () => {
    const mod = await import('./katexStyles');
    // The <link> is created and appended synchronously inside the promise
    // executor, so it is in the DOM before the (network-bound) load resolves.
    // Inspect it directly; do not await, as happy-dom never fires link.onload.
    void mod.waitForKatexStyles();
    const link = document.getElementById('manimweb-katex-styles') as HTMLLinkElement | null;
    expect(link, 'a KaTeX stylesheet link should be injected').not.toBeNull();
    expect(link!.href).toContain(`katex@${katex.version}/`);
  });
});
