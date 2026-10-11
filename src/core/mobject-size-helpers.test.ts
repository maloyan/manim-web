import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';

/**
 * Tests for the size-to-fit and match helpers added to the base Mobject.
 * Parity with Manim CE: scale_to_fit_*, set_*, match_*, match_x/y/z.
 *
 * Note: VMobject smooths its points into bezier curves, so the rendered
 * bounding box is not the raw point extent. Assertions therefore check the
 * invariants the helpers guarantee (target dimension reached, aspect ratio
 * preserved, center coordinate aligned), not hard-coded extents.
 */

/** A mobject with distinct width, height, and depth, centered at the origin. */
function makeBox(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [-1, -2, -3],
    [1, -2, -3],
    [1, 2, 3],
    [-1, 2, 3],
  ]);
  return vm;
}

describe('Mobject size-to-fit helpers', () => {
  it('scaleToFitWidth reaches the target width and keeps aspect ratio', () => {
    const m = makeBox();
    const bb0 = m.getBoundingBox();
    m.scaleToFitWidth(4);
    expect(m.getWidth()).toBeCloseTo(4, 6);
    // Uniform scale: height/width and depth/width ratios are unchanged.
    expect(m.getHeight() / m.getWidth()).toBeCloseTo(bb0.height / bb0.width, 6);
    expect(m.getDepth() / m.getWidth()).toBeCloseTo(bb0.depth / bb0.width, 6);
  });

  it('scaleToFitHeight reaches the target height and keeps aspect ratio', () => {
    const m = makeBox();
    const bb0 = m.getBoundingBox();
    m.scaleToFitHeight(10);
    expect(m.getHeight()).toBeCloseTo(10, 6);
    expect(m.getWidth() / m.getHeight()).toBeCloseTo(bb0.width / bb0.height, 6);
  });

  it('scaleToFitDepth reaches the target depth and keeps aspect ratio', () => {
    const m = makeBox();
    const bb0 = m.getBoundingBox();
    m.scaleToFitDepth(3);
    expect(m.getDepth()).toBeCloseTo(3, 6);
    expect(m.getWidth() / m.getDepth()).toBeCloseTo(bb0.width / bb0.depth, 6);
  });

  it('setWidth/setHeight/setDepth are uniform aliases of scaleToFit*', () => {
    const w = makeBox();
    const wr = w.getBoundingBox();
    w.setWidth(5);
    expect(w.getWidth()).toBeCloseTo(5, 6);
    expect(w.getHeight() / w.getWidth()).toBeCloseTo(wr.height / wr.width, 6);

    const h = makeBox();
    h.setHeight(7);
    expect(h.getHeight()).toBeCloseTo(7, 6);

    const d = makeBox();
    d.setDepth(9);
    expect(d.getDepth()).toBeCloseTo(9, 6);
  });

  it('is a no-op when the measured dimension is zero', () => {
    const empty = new VMobject(); // no points -> zero-size bounding box
    expect(empty.getWidth()).toBe(0);
    empty.scaleToFitWidth(5);
    empty.scaleToFitHeight(5);
    empty.scaleToFitDepth(5);
    expect(empty.getWidth()).toBe(0);
    expect(empty.getHeight()).toBe(0);
    expect(empty.getDepth()).toBe(0);
  });
});

describe('Mobject match helpers', () => {
  it('matchWidth/Height/Depth copy the target size', () => {
    const target = makeBox();
    target.scaleToFitWidth(8); // give the target a distinctive size

    const w = makeBox();
    w.matchWidth(target);
    expect(w.getWidth()).toBeCloseTo(target.getWidth(), 6);

    const h = makeBox();
    h.matchHeight(target);
    expect(h.getHeight()).toBeCloseTo(target.getHeight(), 6);

    const d = makeBox();
    d.matchDepth(target);
    expect(d.getDepth()).toBeCloseTo(target.getDepth(), 6);
  });

  it('matchX/Y/Z align the center coordinate to the target', () => {
    const target = makeBox().shift([3, -4, 5]);

    const x = makeBox();
    x.matchX(target);
    expect(x.getCenter()[0]).toBeCloseTo(3, 6);
    expect(x.getCenter()[1]).toBeCloseTo(0, 6); // other axes unchanged
    expect(x.getCenter()[2]).toBeCloseTo(0, 6);

    const y = makeBox();
    y.matchY(target);
    expect(y.getCenter()[1]).toBeCloseTo(-4, 6);

    const z = makeBox();
    z.matchZ(target);
    expect(z.getCenter()[2]).toBeCloseTo(5, 6);
  });
});

describe('Mobject size helpers are chainable', () => {
  it('each helper returns the same instance', () => {
    const m = makeBox();
    const other = makeBox();
    expect(m.scaleToFitWidth(3)).toBe(m);
    expect(m.scaleToFitHeight(3)).toBe(m);
    expect(m.scaleToFitDepth(3)).toBe(m);
    expect(m.setWidth(3)).toBe(m);
    expect(m.setHeight(3)).toBe(m);
    expect(m.setDepth(3)).toBe(m);
    expect(m.matchWidth(other)).toBe(m);
    expect(m.matchHeight(other)).toBe(m);
    expect(m.matchDepth(other)).toBe(m);
    expect(m.matchX(other)).toBe(m);
    expect(m.matchY(other)).toBe(m);
    expect(m.matchZ(other)).toBe(m);
  });
});
