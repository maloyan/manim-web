import { describe, it, expect } from 'vitest';
import '../../core/AnimateProxy';
import { DashedLine } from './DashedLine';

const round = (v: number[]) => v.map((x) => Math.round(x * 100) / 100);

describe('DashedLine keeps its transform (#906)', () => {
  // MIGRATION: example for the property
  //   ∀ DashedLine d, ∀ shift/rotate/scale applied to d:
  //   d.copy().getCenter() === d.getCenter() and the copy's endpoints follow.
  // Replace with a property test once the suite lands.
  it('copy() of a shifted DashedLine keeps the shift', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [3, -1, 0] });
    const before = dl.getCenter();
    dl.shift([1, 2, 0]);
    const clone = dl.copy();
    expect(round(clone.getCenter())).toEqual(round([before[0] + 1, before[1] + 2, 0]));
    expect(round(clone.getStart())).toEqual([1, 2, 0]);
    expect(round(clone.getEnd())).toEqual([4, 1, 0]);
  });

  it('animate.shift moves the dashes midway through the animation', () => {
    const dl = new DashedLine({ start: [0, 0, 0], end: [3, -1, 0] });
    const [x0, y0] = dl.getCenter();
    const anim = dl.animate.shift([1, 2, 0]);
    anim.begin();
    anim.interpolate(0.5);
    const [xm, ym] = dl.getCenter();
    expect(xm - x0).toBeCloseTo(0.5, 2);
    expect(ym - y0).toBeCloseTo(1, 2);
    anim.finish();
    const [x1, y1] = dl.getCenter();
    expect(x1 - x0).toBeCloseTo(1, 2);
    expect(y1 - y0).toBeCloseTo(2, 2);
  });
});
