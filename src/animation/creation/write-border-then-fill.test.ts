// @vitest-environment happy-dom
/**
 * Write on a VMobject follows Manim CE: each family member draws a thin
 * outline in the first half of its lag window, then fills in. The default
 * lag ratio is min(4 / members, 0.2) and the default rate function is linear.
 */
import { describe, it, expect } from 'vitest';
import { Square } from '../../mobjects/geometry/Rectangle';
import { VGroup } from '../../core/VGroup';
import { Write } from './Create';

describe('Write border then fill', () => {
  // MIGRATION: example for the property
  //   ∀ VMobject family of n members, linear time t:
  //   member i under Write has sub = clamp(t·((n−1)·r + 1) − i·r), r = min(4/n, 0.2);
  //   sub < 1/2 ⇒ fill 0 and outline revealed to 2·sub;
  //   sub ≥ 1/2 ⇒ fill = original · (2·sub − 1); finish restores the style.
  // Replace with a property test once the suite lands.
  it('outlines each member, then fills it, staggered by the Manim CE lag', () => {
    const squares = [0, 1, 2, 3, 4].map(
      (i) => new Square({ sideLength: 1, fillOpacity: 1 }).shift([i * 1.5, 0, 0]) as Square,
    );
    const group = new VGroup(...squares);
    const anim = new Write(group, { duration: 1 });
    anim.begin();

    // n = 5 ⇒ lag 0.2, full length 1.8. At t = 0.25: sub0 = 0.45, sub1 = 0.25.
    anim.update(0, 0);
    anim.update(0, 0.25);
    expect(squares[0].fillOpacity).toBe(0);
    expect(squares[0].strokeWidth).toBe(2);
    const firstLine = squares[0].getOwnStrokeLines()[0];
    expect(firstLine.visible).toBe(true);
    expect(squares[4].getOwnStrokeLines()[0].visible).toBe(false);

    // t = 0.5: sub0 = 0.9 ⇒ fill 0.8 (linear rate, no easing).
    anim.update(0, 0.5);
    expect(squares[0].fillOpacity).toBeCloseTo(0.8, 6);

    anim.finish();
    for (const sq of squares) {
      expect(sq.fillOpacity).toBe(1);
      expect(sq.strokeWidth).toBe(new Square().strokeWidth);
    }
  });
});
