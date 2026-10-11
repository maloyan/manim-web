/**
 * Regression tests for issue #535: "GrowFromPoint makes other methods behave
 * weirdly" when used on a DashedLine. Reported against 0.3.24, where the dashed
 * line collapsed to a point after the grow and a later FadeOut on an unrelated
 * line blanked the scene. On current main the DashedLine stores its dashes as
 * child Lines and GrowFromPoint only touches the parent transform, which it
 * restores on finish, so the shared-state corruption no longer happens.
 *
 * These tests lock that in: the dashed line keeps its full extent after a grow,
 * follow-up animations behave, and a grow on one mobject never leaks into a
 * different one.
 */
import { describe, it, expect } from 'vitest';
import { Scene } from '../../core/Scene';
import { DashedLine } from '../../mobjects/geometry/DashedLine';
import { Line } from '../../mobjects/geometry/Line';
import { GrowFromPoint } from './index';
import { FadeOut } from '../fading/FadeOut';
import { Rotate } from '../movement/Rotate';

function width(m: { getBounds(): { min: { x: number }; max: { x: number } } }): number {
  const b = m.getBounds();
  return b.max.x - b.min.x;
}

describe('GrowFromPoint on DashedLine (issue #535)', () => {
  it('leaves a full-extent line after the grow, not a collapsed point', async () => {
    const scene = Scene.createHeadless();
    const dash = new DashedLine({ start: [1, 1, 0], end: [2, 2, 0] });
    const dashCount = dash.getDashes().length;
    expect(dashCount).toBeGreaterThan(1);

    await scene.play(new GrowFromPoint(dash, { point: [2, 2, 0], duration: 0.05 }));

    // Transform fully restored: not shrunk to the grow point.
    expect(dash.scaleVector.toArray()).toEqual([1, 1, 1]);
    expect(dash.position.toArray()).toEqual([0, 0, 0]);
    // Dash children are untouched and still span the original segment.
    expect(dash.getDashes().length).toBe(dashCount);
    expect(width(dash)).toBeCloseTo(1, 5); // x spans 1 -> 2
    expect(dash.getCenter()[0]).toBeCloseTo(1.5, 5);
    expect(dash.getCenter()[1]).toBeCloseTo(1.5, 5);
    scene.dispose();
  });

  it('allows Rotate then FadeOut to behave normally after the grow', async () => {
    const scene = Scene.createHeadless();
    const dash = new DashedLine({ start: [1, 1, 0], end: [2, 2, 0] });
    scene.add(dash);

    await scene.play(new GrowFromPoint(dash, { point: [2, 2, 0], duration: 0.05 }));
    await scene.play(new Rotate(dash, { angle: Math.PI / 2, duration: 0.05 }));

    // Rotation preserves the segment length (still a line, not a point).
    expect(dash.getDashes().length).toBeGreaterThan(1);
    const b = dash.getBounds();
    const diag = Math.hypot(b.max.x - b.min.x, b.max.y - b.min.y);
    expect(diag).toBeCloseTo(Math.hypot(1, 1), 4);

    await scene.play(new FadeOut(dash, { duration: 0.05 }));
    expect(dash.opacity).toBe(0);
    expect(dash.getDashes()[0].opacity).toBe(0); // FadeOut reaches the dash children
    expect(scene.mobjects.has(dash)).toBe(false); // remover cleaned it up
    scene.dispose();
  });

  it('does not leak into a different line: FadeOut on another line affects only it', async () => {
    const scene = Scene.createHeadless();
    const dash = new DashedLine({ start: [1, 1, 0], end: [2, 2, 0] });
    const other = new Line({ start: [-2, 0, 0], end: [2, 0, 0] });
    scene.add(other);

    await scene.play(new GrowFromPoint(dash, { point: [2, 2, 0], duration: 0.05 }));

    // The unrelated line is still fully present before FadeOut plays.
    expect(other.opacity).toBe(1);
    expect(scene.mobjects.has(other)).toBe(true);
    expect(width(other)).toBeCloseTo(4, 5);

    await scene.play(new FadeOut(other, { duration: 0.05 }));

    // Only `other` is removed; the dashed line is untouched.
    expect(other.opacity).toBe(0);
    expect(scene.mobjects.has(other)).toBe(false);
    expect(dash.opacity).toBe(1);
    expect(dash.getDashes().length).toBeGreaterThan(1);
    scene.dispose();
  });
});
