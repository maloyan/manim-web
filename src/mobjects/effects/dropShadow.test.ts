import { describe, it, expect } from 'vitest';
import { withDropShadow } from './dropShadow';
import { Circle } from '../geometry/Circle';
import { Square } from '../geometry/Rectangle';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';

/** Leaf VMobjects (own points) of a mobject, including itself when it has points. */
function leaves(mobject: VMobject): VMobject[] {
  return mobject.familyMembersWithPoints();
}

describe('withDropShadow', () => {
  const offset: [number, number] = [0.3, -0.4];

  it('returns a VGroup with the original in front of one shadow copy by default', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle);
    expect(group).toBeInstanceOf(VGroup);
    // One shadow + the original.
    expect(group.children.length).toBe(2);
    // The original is the last child, so it paints on top of the shadow.
    expect(group.children[group.children.length - 1]).toBe(circle);
  });

  it('offsets the shadow by the given offset and keeps it behind the original', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle, { offset });
    const shadow = group.children[0] as VMobject;
    const front = group.children[group.children.length - 1] as VMobject;
    expect(front).toBe(circle);

    const shadowCenter = shadow.getCenter();
    const frontCenter = front.getCenter();
    expect(shadowCenter[0] - frontCenter[0]).toBeCloseTo(offset[0], 6);
    expect(shadowCenter[1] - frontCenter[1]).toBeCloseTo(offset[1], 6);

    // "Behind" = earlier in children order than the original.
    expect(group.children.indexOf(shadow)).toBeLessThan(group.children.indexOf(front));
  });

  it('paints the shadow with the shadow color at reduced opacity', () => {
    const circle = new Circle({ radius: 1 });
    circle.setColor('#ff0000');
    circle.setFillOpacity(1);
    circle.setStrokeOpacity(1);

    const group = withDropShadow(circle, { color: '#123456', opacity: 0.3 });
    const shadow = group.children[0] as VMobject;
    for (const leaf of leaves(shadow)) {
      expect(leaf.color).toBe('#123456');
      expect(leaf.opacity).toBeCloseTo(0.3, 6);
      expect(leaf.fillOpacity).toBeCloseTo(0.3, 6);
    }
    // Reduced relative to the original's opacity.
    expect(leaves(shadow)[0].opacity).toBeLessThan(1);
  });

  it('does not change the original mobject (color, opacity, position, points)', () => {
    const circle = new Circle({ radius: 1 });
    circle.setColor('#00ff00');
    circle.setFillOpacity(0.8);
    circle.shift([1, 2, 0]);

    const colorBefore = circle.color;
    const fillBefore = circle.fillOpacity;
    const strokeOpacityBefore = circle.opacity;
    const centerBefore = circle.getCenter();
    const pointsBefore = circle.getLocalPoints();

    withDropShadow(circle, { color: '#000000', opacity: 0.5, offset });

    expect(circle.color).toBe(colorBefore);
    expect(circle.fillOpacity).toBeCloseTo(fillBefore, 6);
    expect(circle.opacity).toBeCloseTo(strokeOpacityBefore, 6);
    const centerAfter = circle.getCenter();
    expect(centerAfter[0]).toBeCloseTo(centerBefore[0], 6);
    expect(centerAfter[1]).toBeCloseTo(centerBefore[1], 6);
    expect(circle.getLocalPoints()).toEqual(pointsBefore);
  });

  it('does not share geometry with the original (shadow is a deep copy)', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle, { offset });
    const shadow = group.children[0] as VMobject;
    // Distinct instance and distinct point arrays.
    expect(shadow).not.toBe(circle);
    expect(shadow.getLocalPoints()).not.toBe(circle.getLocalPoints());
  });

  it('produces n shadow copies for layers:n', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle, { layers: 4 });
    // 4 shadows + the original.
    expect(group.children.length).toBe(5);
    expect(group.children[group.children.length - 1]).toBe(circle);
    // Every non-last child is a shadow (not the original).
    for (let i = 0; i < group.children.length - 1; i++) {
      expect(group.children[i]).not.toBe(circle);
    }
  });

  it('fades successive layers so none is fully opaque and all are reduced', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle, { layers: 3, opacity: 0.6 });
    const shadowOpacities = group.children.slice(0, -1).map((c) => (c as VMobject).opacity);
    for (const o of shadowOpacities) {
      expect(o).toBeGreaterThan(0);
      expect(o).toBeLessThanOrEqual(0.6);
    }
    // Layers are not all identical — at least one is fainter than the strongest.
    expect(Math.min(...shadowOpacities)).toBeLessThan(Math.max(...shadowOpacities));
  });

  it('uses a sensible default: single black shadow offset down and right', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle);
    const shadow = group.children[0] as VMobject;
    expect(leaves(shadow)[0].color).toBe('#000000');
    const shadowCenter = shadow.getCenter();
    const frontCenter = circle.getCenter();
    // Default offset points right (+x) and down (-y).
    expect(shadowCenter[0]).toBeGreaterThan(frontCenter[0]);
    expect(shadowCenter[1]).toBeLessThan(frontCenter[1]);
  });

  it('scales the shadow when a scale factor is given', () => {
    const circle = new Circle({ radius: 1 });
    const group = withDropShadow(circle, { scale: 2, offset: [0, 0] });
    const shadow = group.children[0] as VMobject;
    const sb = shadow.getBounds();
    const cb = circle.getBounds();
    const shadowWidth = sb.max.x - sb.min.x;
    const circleWidth = cb.max.x - cb.min.x;
    expect(shadowWidth).toBeCloseTo(circleWidth * 2, 4);
  });

  it('works on a VGroup input and keeps the original group in front', () => {
    const a = new Circle({ radius: 1 }).shift([-1, 0, 0]);
    const b = new Square({ sideLength: 1 }).shift([1, 0, 0]);
    const vgroup = new VGroup(a, b);

    const result = withDropShadow(vgroup, { color: '#000000', opacity: 0.4, offset });
    expect(result).toBeInstanceOf(VGroup);
    expect(result.children.length).toBe(2);
    const shadow = result.children[0] as VMobject;
    const front = result.children[result.children.length - 1] as VMobject;
    expect(front).toBe(vgroup);
    expect(shadow).toBeInstanceOf(VGroup);
    // Shadow leaves recolored.
    for (const leaf of leaves(shadow)) {
      expect(leaf.color).toBe('#000000');
    }
    // Shadow offset from the group.
    const shadowCenter = shadow.getCenter();
    const frontCenter = front.getCenter();
    expect(shadowCenter[0] - frontCenter[0]).toBeCloseTo(offset[0], 6);
    expect(shadowCenter[1] - frontCenter[1]).toBeCloseTo(offset[1], 6);
  });
});
