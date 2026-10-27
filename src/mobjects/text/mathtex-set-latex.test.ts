// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { Scene } from '../../core/Scene';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { MathTex } from './MathTex';
import { Tex } from './Tex';

/** World-space bounds as [left, right, bottom, top]. */
function bounds(tex: MathTex): number[] {
  return [tex.getLeft()[0], tex.getRight()[0], tex.getBottom()[1], tex.getTop()[1]];
}

function expectClose(actual: number[], expected: number[]): void {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('MathTex.setLatex', { timeout: 20000 }, () => {
  // MIGRATION: example for the property
  //   ∀ latex L, transform sequence T applied to a rendered MathTex m:
  //   after m.setLatex(m.getLatex()), m's world bounds equal those before.
  // Replace with a property test once the suite lands.
  it('keeps every transform, including ones baked in by normalizeTransform', async () => {
    const tex = new MathTex({ latex: 'x^2 + 1' }).scale(2); // pre-render scale: baked on render
    await tex.waitForRender();
    tex.rotate(0.3).shift([1, -2, 0]);
    new VGroup(tex); // normalizes: bakes position/rotation into the glyphs
    tex.scale(0.5).shift([-0.5, 0.25, 0]); // deferred again
    const before = bounds(tex);

    await tex.setLatex('x^2 + 1');

    expectClose(bounds(tex), before);
  });

  // MIGRATION: example for the property
  //   ∀ latex A, B, anchor a: with m = MathTex(A, anchor a), after
  //   m.setLatex(B) the world x of m's `a` point is unchanged.
  // Replace with a property test once the suite lands.
  it('holds the anchor point fixed when the width changes', async () => {
    const left = new MathTex({ latex: '1.0x', anchor: 'left' }).shift([2, 1, 0]);
    const center = new MathTex({ latex: '1.0x' }).shift([2, 1, 0]);
    await Promise.all([left.waitForRender(), center.waitForRender()]);
    const leftEdge = left.getLeft()[0];
    const centerX = center.getCenter()[0];
    const width = left.getWidth();

    await Promise.all([left.setLatex('-10.0x'), center.setLatex('-10.0x')]);

    expect(left.getWidth()).toBeGreaterThan(width);
    expect(left.getLeft()[0]).toBeCloseTo(leftEdge, 6);
    expect(center.getCenter()[0]).toBeCloseTo(centerX, 6);
  });

  // MIGRATION: example for the property
  //   ∀ call sequences setLatex(L1) … setLatex(Ln) issued without awaiting,
  //   once all settle the glyphs are those of Ln.
  // Replace with a property test once the suite lands.
  it('applies only the latest of overlapping calls', async () => {
    const tex = new MathTex({ latex: 'a' });
    const reference = new MathTex({ latex: 'abc' });
    const first = tex.setLatex('ab');
    const second = tex.setLatex('abc');
    await Promise.all([first, second, reference.waitForRender()]);

    expect(tex.getLatex()).toBe('abc');
    expect(tex.getFamily().length).toBe(reference.getFamily().length);
  });

  // MIGRATION: example for the property
  //   ∀ burst of n setLatex calls made while no render runs: exactly one
  //   MathJax render starts (for the last call).
  // Replace with a property test once the suite lands.
  it('renders a burst of calls once, and waitForRender waits for the last', async () => {
    const tex = new MathTex({ latex: 'a' });
    await tex.waitForRender();
    const spy = vi.spyOn(tex as unknown as { _render: () => Promise<void> }, '_render');

    void tex.setLatex('ab');
    void tex.setLatex('abc');
    const waiting = tex.waitForRender();
    void tex.setLatex('abcd'); // requested while waitForRender is pending
    await waiting;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(tex.children).toHaveLength(4);
  });

  it('keeps per-part colors of a multi-part expression', async () => {
    const tex = new MathTex({ latex: ['a', '=', 'b'] });
    await tex.waitForRender();
    tex.getPart(2).setColor('#ff0000');

    await tex.setLatex(['a', '=', 'bc']);

    expect(tex.getPart(2).color).toBe('#ff0000');
    expect(tex.getPart(0).color).not.toBe('#ff0000');
  });

  it('wraps Tex text the same way the constructor does', async () => {
    const tex = new Tex({ latex: 'hello' });
    await tex.setLatex('world');
    expect(tex.getLatex()).toBe('\\text{world}');
    expect(tex.copy().getLatex()).toBe('\\text{world}');
  });
  // MIGRATION: example for the property
  //   ∀ MathTex m in a scene: after m.setLatex(L), every node of m's Three.js
  //   subtree has m's renderOrder (new glyphs keep m's place in the layering).
  // Replace with a property test once the suite lands.
  it('gives new glyphs the scene layering of the MathTex', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new Scene(container, { width: 400, height: 300, headless: true });
    try {
      const tex = new MathTex({ latex: 'a' });
      await tex.waitForRender();
      // tex gets a non-default renderOrder, and the last rectangle draws above it.
      scene.add(new Rectangle(), tex, new Rectangle());
      await tex.setLatex('a + b');
      const order = tex.getThreeObject().renderOrder;
      const orders = new Set<number>();
      tex.getThreeObject().traverse((node) => orders.add(node.renderOrder));
      expect([...orders]).toEqual([order]);
    } finally {
      scene.dispose();
      container.remove();
    }
  });
});
