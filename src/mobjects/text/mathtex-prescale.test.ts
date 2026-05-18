// @vitest-environment happy-dom
/**
 * Regression tests for GitHub issue #324.
 *
 * `MathTex` glyphs are built asynchronously. Calling `scale(...)` before
 * `waitForRender()` used to be a silent no-op because `VGroup.scale` iterated
 * children, and at that moment the glyphs were not rendered yet. After the
 * fix in `VGroup.scale`, the pre-render scale is stored on the group's own
 * `scaleVector` and applied via Three.js once children are populated.
 *
 * Mirrors the shape of the `shift()` fallback fix (issue #318).
 */

import { describe, it, expect } from 'vitest';
import { MathTex } from './MathTex';

describe('MathTex pre-render scale (issue #324)', () => {
  it('records scale on parent scaleVector when called before render', () => {
    const tex = new MathTex({ latex: 'x^2' });
    tex.scale(2);
    expect(tex.scaleVector.x).toBe(2);
    expect(tex.scaleVector.y).toBe(2);
    expect(tex.scaleVector.z).toBe(2);
  });

  it('bakes the pre-render scale into geometry once render completes', async () => {
    const tex = new MathTex({ latex: 'x' });
    tex.scale(2);
    await tex.waitForRender();
    // After bake, parent scale is back to identity so subsequent transforms
    // run in the same coordinate frame as the rendered glyphs.
    expect(tex.scaleVector.x).toBe(1);
    expect(tex.scaleVector.y).toBe(1);
    expect(tex.scaleVector.z).toBe(1);
  });

  it('single-glyph: bounding box reflects pre-render scale after waitForRender', async () => {
    const baseline = new MathTex({ latex: 'x' });
    const scaled = new MathTex({ latex: 'x' });
    scaled.scale(2);

    await Promise.all([baseline.waitForRender(), scaled.waitForRender()]);

    const ba = baseline.getBoundingBox();
    const bs = scaled.getBoundingBox();
    expect(bs.width).toBeCloseTo(ba.width * 2, 2);
    expect(bs.height).toBeCloseTo(ba.height * 2, 2);
  });

  it('multi-glyph: bounding box reflects pre-render scale after waitForRender', async () => {
    const baseline = new MathTex({ latex: 'x^2' });
    const scaled = new MathTex({ latex: 'x^2' });
    scaled.scale(2);

    await Promise.all([baseline.waitForRender(), scaled.waitForRender()]);

    const ba = baseline.getBoundingBox();
    const bs = scaled.getBoundingBox();
    expect(bs.width).toBeCloseTo(ba.width * 2, 2);
    expect(bs.height).toBeCloseTo(ba.height * 2, 2);
  });

  it('multi-part: bounding box reflects pre-render scale after waitForRender', async () => {
    const baseline = new MathTex({ latex: ['a', '+', 'b'] });
    const scaled = new MathTex({ latex: ['a', '+', 'b'] });
    scaled.scale(2);

    await Promise.all([baseline.waitForRender(), scaled.waitForRender()]);

    const ba = baseline.getBoundingBox();
    const bs = scaled.getBoundingBox();
    expect(bs.width).toBeCloseTo(ba.width * 2, 2);
    expect(bs.height).toBeCloseTo(ba.height * 2, 2);
  });

  it('matches reporter repro shape: scale then moveTo before render', async () => {
    const baseline = new MathTex({ latex: 'x' });
    baseline.moveTo([-2, 0, 0]);

    const scaled = new MathTex({ latex: 'x' });
    scaled.scale(2);
    scaled.moveTo([2, 0, 0]);

    await Promise.all([baseline.waitForRender(), scaled.waitForRender()]);

    const ba = baseline.getBoundingBox();
    const bs = scaled.getBoundingBox();
    expect(bs.height).toBeCloseTo(ba.height * 2, 2);
    expect(scaled.getCenter()[0]).toBeCloseTo(2, 2);
    expect(baseline.getCenter()[0]).toBeCloseTo(-2, 2);
  });

  it('pre-render scale then post-render shift preserves world-space translation', async () => {
    const baseline = new MathTex({ latex: 'x' });
    const tex = new MathTex({ latex: 'x' });
    tex.scale(2);
    await Promise.all([baseline.waitForRender(), tex.waitForRender()]);

    tex.shift([1, 0, 0]);

    // Logical center matches rendered position: both should land at x = 1.
    expect(tex.getCenter()[0]).toBeCloseTo(1, 2);
    // Width still doubled.
    expect(tex.getBoundingBox().width).toBeCloseTo(baseline.getBoundingBox().width * 2, 2);
  });

  it('pre-render scale then post-render moveTo lands at target', async () => {
    const tex = new MathTex({ latex: 'x' });
    tex.scale(2);
    await tex.waitForRender();

    tex.moveTo([3, -1, 0]);

    expect(tex.getCenter()[0]).toBeCloseTo(3, 2);
    expect(tex.getCenter()[1]).toBeCloseTo(-1, 2);
  });

  it('non-uniform pre-render scale is preserved', async () => {
    const baseline = new MathTex({ latex: 'x' });
    const scaled = new MathTex({ latex: 'x' });
    scaled.scale([2, 3, 1]);

    expect(scaled.scaleVector.x).toBe(2);
    expect(scaled.scaleVector.y).toBe(3);
    expect(scaled.scaleVector.z).toBe(1);

    await Promise.all([baseline.waitForRender(), scaled.waitForRender()]);

    const ba = baseline.getBoundingBox();
    const bs = scaled.getBoundingBox();
    expect(bs.width).toBeCloseTo(ba.width * 2, 2);
    expect(bs.height).toBeCloseTo(ba.height * 3, 2);
  });
});
