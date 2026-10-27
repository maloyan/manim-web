// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { Scene } from '../../../core/Scene';
import { TangleTex } from './TangleTex';

function make(expanded = false): TangleTex {
  return new TangleTex({
    latex: String.raw`y = \tanglematrix{R} x + \tangle{b}`,
    parameters: { k: { value: 2, step: 0.1 }, b: { value: 1, step: 0.5 } },
    matrices: {
      R: {
        expanded,
        entries: [
          [String.raw`\tangle{k}\cos t`, 0],
          [0, String.raw`\tangle{k}`],
        ],
      },
    },
  }).shift([1, -0.5, 0]);
}

/** World-space bounds as [left, right, bottom, top]. */
function bounds(tex: TangleTex): number[] {
  return [tex.getLeft()[0], tex.getRight()[0], tex.getBottom()[1], tex.getTop()[1]];
}

function expectClose(actual: number[], expected: number[]): void {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('TangleExpand / TangleCollapse', { timeout: 20000 }, () => {
  // MIGRATION: example for the property
  //   ∀ TangleTex t, matrix m: running t.expand(m) to the end leaves t
  //   looking exactly like a TangleTex built expanded (same world bounds,
  //   same glyph count, same glyph lookup), and reset() restores the start.
  // Replace with a property test once the suite lands.
  it('morphs to exactly the expanded render, and reset() restores the start', async () => {
    const tex = make();
    const reference = make(true);
    const anim = tex.expand('R');
    await Promise.all([tex.waitForRender(), reference.waitForRender()]);
    const before = bounds(tex);
    const startChildren = tex.children.length;

    anim.begin();
    expectClose(bounds(tex), before); // alpha = 0 looks like the start
    anim.interpolate(0.5);
    expect(tex.children.length).toBeGreaterThan(startChildren); // matrix fading in
    anim.interpolate(1);
    anim.finish();

    expect(tex.isExpanded('R')).toBe(true);
    expect(tex.getLatex()).toBe(reference.getLatex());
    expect(tex.children.length).toBe(reference.children.length);
    expectClose(bounds(tex), bounds(reference));
    expect(tex.getParameterOccurrences('k')).toEqual([0, 1]);

    anim.reset();
    expect(tex.isExpanded('R')).toBe(false);
    expect(tex.children.length).toBe(startChildren);
    expectClose(bounds(tex), before);
  });

  it('holds tracker updates until the morph ends, then applies them', async () => {
    const tex = make(true);
    const anim = tex.collapse('R');
    await tex.waitForRender();
    anim.begin();
    tex.getTracker('b').setValue(3);
    tex.update(1 / 60); // would re-render now if not held
    expect(tex.getLatex()).not.toContain('{{3.0}}');
    anim.interpolate(1);
    anim.finish();
    await tex.waitForRender();

    expect(tex.isExpanded('R')).toBe(false);
    expect(tex.getLatex()).toContain('{{3.0}}');
    expect(tex.getMatrixGlyphs('R')).toHaveLength(1);
  });

  it('plays through scene.play, which waits for the target render', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new Scene(container, { width: 400, height: 300, headless: true });
    try {
      const tex = make();
      scene.add(tex);
      await scene.play(tex.expand('R', { duration: 0.1 }));
      expect(tex.isExpanded('R')).toBe(true);
      expect(tex.getParameterGlyphs('k').length).toBeGreaterThan(0);
    } finally {
      scene.dispose();
      container.remove();
    }
  });
});
