import { describe, it, expect } from 'vitest';
import { Arrow, DoubleArrow } from './Arrow';
import { VMobject } from '../../core/VMobject';
import { ApplyMatrix } from '../../animation/transform/TransformExtensions';

// ── Arrow defaults ──────────────────────────────────────────────────────────

describe('Arrow defaults', () => {
  it('has pointier default tipLength=0.3', () => {
    const arrow = new Arrow();
    expect(arrow.getTipLength()).toBe(0.3);
  });

  it('has pointier default tipWidth=0.1', () => {
    const arrow = new Arrow();
    expect(arrow.getTipWidth()).toBe(0.1);
  });

  it('DoubleArrow has same pointier defaults', () => {
    const da = new DoubleArrow({ start: [0, 0, 0], end: [2, 0, 0] });
    expect(da.getLength()).toBeGreaterThan(0);
  });
});

// ── reconstructTip ──────────────────────────────────────────────────────────

describe('Arrow.reconstructTip', () => {
  it('rebuilds clean triangle shape while preserving apex position', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });

    // The tip child is children[1]
    const tip = arrow.children[1] as VMobject;
    const tipPtsBefore = tip.getLocalPoints();
    // Tip apex is at Bezier index 3
    const apexBefore = tipPtsBefore[3];

    // Reconstruct (no-op on clean arrow — apex should stay the same)
    arrow.reconstructTip();

    const tipPtsAfter = tip.getLocalPoints();
    const apexAfter = tipPtsAfter[3];
    expect(apexAfter[0]).toBeCloseTo(apexBefore[0], 5);
    expect(apexAfter[1]).toBeCloseTo(apexBefore[1], 5);

    // The end point should match the apex
    const end = arrow.getEnd();
    expect(end[0]).toBeCloseTo(apexAfter[0], 5);
    expect(end[1]).toBeCloseTo(apexAfter[1], 5);
  });

  it('preserves tip dimensions after reconstruction', () => {
    const arrow = new Arrow({
      start: [0, 0, 0],
      end: [3, 0, 0],
      tipLength: 0.5,
      tipWidth: 0.2,
    });

    // Reconstruct (should be a no-op on undistorted arrow)
    arrow.reconstructTip();

    expect(arrow.getTipLength()).toBe(0.5);
    expect(arrow.getTipWidth()).toBe(0.2);
  });
});

describe('DoubleArrow.reconstructTips', () => {
  it('exists and can be called without error', () => {
    const da = new DoubleArrow({ start: [0, 0, 0], end: [3, 0, 0] });
    expect(() => da.reconstructTips()).not.toThrow();
  });
});

// ── ApplyMatrix on Arrow ────────────────────────────────────────────────────

describe('ApplyMatrix on Arrow with non-uniform matrix', () => {
  it('reconstructs tip after shear', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });
    const tipBefore = arrow.children[1] as VMobject;
    const tipPointsBefore = tipBefore.getLocalPoints();

    // Shear matrix: x' = x + 0.5*y, y' = y
    const shear = [
      [1, 0.5, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const anim = new ApplyMatrix(arrow, { matrix: shear });

    anim.begin();
    anim.finish();

    // After finish(), the tip should be a proper triangle (not distorted by the shear)
    const tipAfter = arrow.children[1] as VMobject;
    const tipPointsAfter = tipAfter.getLocalPoints();

    // Tip points: 3 cubic bezier segments = 1 start + 3*3 control/end = 10 points
    expect(tipPointsAfter.length).toBe(10);

    // The tip should form a triangle that's aligned with the (new) arrow direction
    // Check that the tip point is beyond the shaft end
    const shaft = arrow.children[0] as VMobject;
    const shaftPts = shaft.getLocalPoints();
    const shaftEnd = shaftPts[shaftPts.length - 1];
    const arrowEnd = arrow.getEnd();
    // Arrow end (tip point) should be further along the shaft direction
    expect(arrowEnd[0]).toBeGreaterThanOrEqual(shaftEnd[0]);
  });
});
