// @vitest-environment happy-dom
/**
 * Create on a plain Group (e.g. Axes, which is not a VMobject) draws its
 * vector descendants stroke by stroke like Manim CE, instead of fading the
 * whole group in.
 */
import { describe, it, expect } from 'vitest';
import { Group } from '../../core/Group';
import { Line } from '../../mobjects/geometry/Line';
import { Axes } from '../../mobjects/graphing/Axes';
import { Create } from './Create';

describe('Create on a Group', () => {
  // MIGRATION: example for the property
  //   ∀ Group g whose vector family is non-empty: Create(g) reveals the
  //   members' strokes in order (lagRatio 1) and never changes their opacity.
  // Replace with a property test once the suite lands.
  it('draws the members one after another instead of fading', () => {
    const a = new Line({ start: [-1, 0, 0], end: [1, 0, 0] });
    const b = new Line({ start: [-1, 1, 0], end: [1, 1, 0] });
    const group = new Group(a, b);
    const anim = new Create(group, { duration: 1 });
    anim.begin();

    anim.interpolate(0.25);
    expect(a.opacity).toBe(1);
    expect(a.getOwnStrokeLines()[0].visible).toBe(true);
    expect(b.getOwnStrokeLines()[0].visible).toBe(false);

    anim.finish();
    expect(b.getOwnStrokeLines()[0].visible).toBe(true);
  });

  it('draws Axes strokes instead of fading them', () => {
    const axes = new Axes({ xRange: [-3, 3, 1], yRange: [-2, 2, 1] });
    const anim = new Create(axes, { duration: 1 });
    anim.begin();
    anim.interpolate(0.01);
    const xAxisLine = axes.children[0];
    expect(xAxisLine.opacity).toBe(1);
    anim.finish();
  });
});
