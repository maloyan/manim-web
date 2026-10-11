/**
 * Regression tests for issue #448: CyclicReplace moved neighbouring items in
 * opposite directions ("sometimes up, sometimes down") because the old code
 * flipped the arc direction by index parity (`i % 2`). The cycle must read as a
 * single consistent rotational shift, matching Manim CE's `path_arc`: every item
 * that moves the same way arcs the same way, and only the wrapping item (which
 * travels the opposite way) arcs opposite.
 */
import { describe, it, expect } from 'vitest';
import { Circle } from '../../mobjects/geometry/Circle';
import { CyclicReplace } from './MovementTransforms';

function circleAt(x: number, y: number): Circle {
  const c = new Circle({ radius: 0.5 });
  c.moveTo([x, y, 0]);
  return c;
}

describe('CyclicReplace arc consistency (issue #448)', () => {
  it('cycles the three centers: each item takes the next slot, last wraps', () => {
    const blue = circleAt(-2, 0);
    const green = circleAt(0, 0);
    const red = circleAt(2, 0);
    const anim = new CyclicReplace([blue, green, red]);
    anim.begin();
    anim.finish();

    expect(blue.getCenter()[0]).toBeCloseTo(0, 5); // blue -> green's slot
    expect(green.getCenter()[0]).toBeCloseTo(2, 5); // green -> red's slot
    expect(red.getCenter()[0]).toBeCloseTo(-2, 5); // red wraps -> blue's slot
    for (const m of [blue, green, red]) {
      expect(m.getCenter()[1]).toBeCloseTo(0, 5);
    }
  });

  it('keeps alpha=0 and alpha=1 exact (no arc residue at the endpoints)', () => {
    const blue = circleAt(-2, 0);
    const green = circleAt(0, 0);
    const red = circleAt(2, 0);
    const anim = new CyclicReplace([blue, green, red]);
    anim.begin();

    anim.interpolate(0);
    expect(blue.getCenter()).toEqual([expect.closeTo(-2, 6), expect.closeTo(0, 6), 0]);
    expect(green.getCenter()[0]).toBeCloseTo(0, 6);
    expect(red.getCenter()[0]).toBeCloseTo(2, 6);

    anim.interpolate(1);
    expect(blue.getCenter()[0]).toBeCloseTo(0, 6);
    expect(blue.getCenter()[1]).toBeCloseTo(0, 6);
    expect(green.getCenter()[0]).toBeCloseTo(2, 6);
    expect(red.getCenter()[0]).toBeCloseTo(-2, 6);
  });

  it('items moving the same way arc the same way; the wrapping item arcs opposite', () => {
    const blue = circleAt(-2, 0); // moves +x to 0
    const green = circleAt(0, 0); // moves +x to 2 (same direction as blue)
    const red = circleAt(2, 0); // wraps -x to -2 (opposite direction)
    const anim = new CyclicReplace([blue, green, red]);
    anim.begin();
    anim.interpolate(0.5);

    const blueY = blue.getCenter()[1];
    const greenY = green.getCenter()[1];
    const redY = red.getCenter()[1];

    // The bug: blueY and greenY had opposite signs (0.785 vs -0.785). The fix
    // makes the two same-direction movers deviate identically.
    expect(Math.abs(blueY)).toBeGreaterThan(0.1);
    expect(greenY).toBeCloseTo(blueY, 6);

    // The wrapping item travels the other way, so it arcs to the opposite side.
    expect(Math.sign(redY)).toBe(-Math.sign(blueY));
    expect(Math.abs(redY)).toBeGreaterThan(0.1);
  });

  it('matches Manim CE path_arc=PI/2 geometry for a +x move', () => {
    // blue: start (-2,0) end (0,0), arc PI/2. Manim path_along_arc puts the
    // arc midpoint at x = -1, y = -(1 - cos(PI/4)) * r_chord-derived offset.
    const blue = circleAt(-2, 0);
    const green = circleAt(0, 0);
    const red = circleAt(2, 0);
    const anim = new CyclicReplace([blue, green, red]);
    anim.begin();
    anim.interpolate(0.5);

    // Closed form: chord length 2, center offset 1 above midpoint, rel rotated
    // 45deg => x=-1, y = 1 - sqrt(2)/... computed to -0.41421356.
    expect(blue.getCenter()[0]).toBeCloseTo(-1, 5);
    expect(blue.getCenter()[1]).toBeCloseTo(-0.41421356, 5);
  });
});
