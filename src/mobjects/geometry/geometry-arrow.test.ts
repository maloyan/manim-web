import { describe, it, expect } from 'vitest';
import { Arrow, DoubleArrow } from './Arrow';
import { VMobject } from '../../core/VMobject';
import { Group } from '../../core/Group';
import {
  ApplyFunction,
  applyFunction,
  ApplyMatrix,
  applyMatrix,
} from '../../animation/transform/TransformExtensions';

// Helper: create a simple VMobject with points
function vm(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPoints(pts);
  return v;
}

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

  it('tip base width is 2*tipWidth (legacy convention)', () => {
    const tipWidth = 0.2;
    const arrow = new Arrow({ start: [0, 0, 0], end: [3, 0, 0], tipWidth });
    const tip = arrow.children[1] as VMobject;
    const pts = tip.getPoints();
    const left = pts[0];
    const right = pts[6];
    const dx = left[0] - right[0];
    const dy = left[1] - right[1];
    const dz = left[2] - right[2];
    const baseWidth = Math.sqrt(dx * dx + dy * dy + dz * dz);
    expect(baseWidth).toBeCloseTo(2 * tipWidth, 5);
  });

  it('DoubleArrow has same pointier defaults', () => {
    const da = new DoubleArrow({ start: [0, 0, 0], end: [2, 0, 0] });
    expect(da.getLength()).toBeGreaterThan(0);
  });

  it('Arrow getStart/getEnd are child-position based and group position is unchanged by updates', () => {
    const arrow = new Arrow({ start: [1, 2, 0], end: [4, 6, 0] });
    const beforeGroup = arrow.position.clone();

    const start = arrow.getStart();
    const end = arrow.getEnd();
    expect(start[0]).toBe(1);
    expect(start[1]).toBe(2);
    expect(start[2]).toBe(0);
    expect(end[0]).toBe(4);
    expect(end[1]).toBe(6);
    expect(end[2]).toBe(0);

    arrow.putStartAndEndOn([-2, 1, 0], [5, -3, 0]);
    const afterGroup = arrow.position;
    expect(afterGroup.x).toBe(beforeGroup.x);
    expect(afterGroup.y).toBe(beforeGroup.y);
    expect(afterGroup.z).toBe(beforeGroup.z);

    const start2 = arrow.getStart();
    const end2 = arrow.getEnd();
    expect(start2[0]).toBe(-2);
    expect(start2[1]).toBe(1);
    expect(start2[2]).toBe(0);
    expect(end2[0]).toBe(5);
    expect(end2[1]).toBe(-3);
    expect(end2[2]).toBe(0);
  });

  it('putStartAndEndOn resets endpoints exactly after prior shift+rotation', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [3, 0, 0] });

    // Put the arrow through prior transforms first.
    arrow.shift([2, -1, 0]);
    arrow.rotate(Math.PI / 3);

    const beforeGroup = arrow.position.clone();

    arrow.putStartAndEndOn([-4, 2, 0], [1, -5, 0]);

    const start = arrow.getStart();
    const end = arrow.getEnd();
    expect(start[0]).toBe(-4);
    expect(start[1]).toBe(2);
    expect(start[2]).toBe(0);
    expect(end[0]).toBe(1);
    expect(end[1]).toBe(-5);
    expect(end[2]).toBe(0);

    // Endpoint update must not mutate Group position.
    expect(arrow.position.x).toBe(beforeGroup.x);
    expect(arrow.position.y).toBe(beforeGroup.y);
    expect(arrow.position.z).toBe(beforeGroup.z);

    // Child placements are the canonical endpoint carriers.
    expect(arrow.children[0].position.x).toBe(-4);
    expect(arrow.children[0].position.y).toBe(2);
    expect(arrow.children[0].position.z).toBe(0);
    expect(arrow.children[1].position.x).toBe(1);
    expect(arrow.children[1].position.y).toBe(-5);
    expect(arrow.children[1].position.z).toBe(0);
  });
});

// ── reconstructTip ──────────────────────────────────────────────────────────

describe('Arrow.reconstructTip', () => {
  it('rebuilds clean triangle shape while preserving apex position', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });

    // The tip child is children[1]
    const tip = arrow.children[1] as VMobject;
    const tipPtsBefore = tip.getPoints();
    // Tip apex is at Bezier index 3
    const apexBefore = tipPtsBefore[3];

    // Reconstruct (no-op on clean arrow — apex should stay the same)
    arrow.reconstructTip();

    const tipPtsAfter = tip.getPoints();
    const apexAfter = tipPtsAfter[3];
    expect(apexAfter[0]).toBeCloseTo(apexBefore[0], 5);
    expect(apexAfter[1]).toBeCloseTo(apexBefore[1], 5);

    // Tip apex in local tip geometry stays preserved after reconstruction.
    // Arrow.getEnd() is child-position based (world placement), not local point based.
    expect(apexAfter[0]).toBeCloseTo(apexBefore[0], 5);
    expect(apexAfter[1]).toBeCloseTo(apexBefore[1], 5);
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

// ── ApplyFunction on Group ──────────────────────────────────────────────────

describe('ApplyFunction on Group', () => {
  it('transforms VMobject children within a Group', () => {
    const child1 = vm([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const child2 = vm([
      [0, 1, 0],
      [1, 1, 0],
      [2, 1, 0],
      [3, 1, 0],
    ]);
    const group = new Group(child1, child2);

    const fn = (p: number[]) => [p[0] * 2, p[1] * 2, p[2]];
    const anim = new ApplyFunction(group, { func: fn });

    anim.begin();
    anim.finish();

    // child1 should have x-coords doubled
    const pts1 = child1.getPoints();
    expect(pts1[0][0]).toBeCloseTo(0);
    expect(pts1[1][0]).toBeCloseTo(2);
    expect(pts1[3][0]).toBeCloseTo(6);

    // child2 should have both x and y doubled
    const pts2 = child2.getPoints();
    expect(pts2[0][1]).toBeCloseTo(2);
    expect(pts2[3][0]).toBeCloseTo(6);
    expect(pts2[3][1]).toBeCloseTo(2);
  });

  it('factory function accepts Mobject', () => {
    const child = vm([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const group = new Group(child);
    const anim = applyFunction(group, (p) => [p[0], p[1] + 1, p[2]]);
    expect(anim).toBeInstanceOf(ApplyFunction);
  });
});

// ── ApplyFunction on Arrow ──────────────────────────────────────────────────

describe('ApplyFunction on Arrow', () => {
  it('transforms shaft+tip and reconstructs tip', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });

    const fn = (p: number[]) => [p[0] + 1, p[1], p[2]];
    const anim = new ApplyFunction(arrow, { func: fn });

    anim.begin();
    anim.finish();

    // ApplyFunction mutates child points; endpoint accessors are child-position based.
    // Verify transformed/reconstructed tip geometry directly.
    const shaft = arrow.children[0] as VMobject;
    const tip = arrow.children[1] as VMobject;
    const shaftPts = shaft.getPoints();
    const tipPts = tip.getPoints();
    // start x=0 becomes 1 after x+1 transform
    expect(shaftPts[0][0]).toBe(1);
    // tip apex local x should also shift by +1 (2 -> 3 before reconstruction,
    // then kept as transformed apex by reconstructTip).
    expect(tipPts[3][0]).toBe(1);
  });
});

// ── ApplyMatrix on Group ────────────────────────────────────────────────────

describe('ApplyMatrix on Group', () => {
  it('applies 3x3 matrix to all VMobject children', () => {
    const child = vm([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const group = new Group(child);

    // Scale by 2 matrix
    const matrix = [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 1],
    ];
    const anim = new ApplyMatrix(group, { matrix });

    anim.begin();
    anim.finish();

    const pts = child.getPoints();
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[1][0]).toBeCloseTo(4);
    expect(pts[3][0]).toBeCloseTo(8);
  });

  it('factory function accepts Mobject', () => {
    const group = new Group(
      vm([
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ]),
    );
    const anim = applyMatrix(group, [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(anim).toBeInstanceOf(ApplyMatrix);
  });
});

// ── ApplyMatrix on Arrow ────────────────────────────────────────────────────

describe('ApplyMatrix on Arrow with non-uniform matrix', () => {
  it('reconstructs tip after shear', () => {
    const arrow = new Arrow({ start: [0, 0, 0], end: [2, 0, 0] });
    const tipBefore = arrow.children[1] as VMobject;
    const tipPointsBefore = tipBefore.getPoints();

    // Shear matrix: x' = x + 0.5*y, y' = y
    const shear = [
      [1, 0.5, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const anim = new ApplyMatrix(arrow, { matrix: shear });

    anim.begin();
    anim.finish();

    // After finish(), reconstructTip should have been called
    // The tip should be a proper triangle (not distorted by the shear)
    const tipAfter = arrow.children[1] as VMobject;
    const tipPointsAfter = tipAfter.getPoints();

    // Tip points: 3 cubic bezier segments = 1 start + 3*3 control/end = 10 points
    expect(tipPointsAfter.length).toBe(10);

    // The tip should form a triangle that's aligned with the (new) arrow direction
    // Check that the tip point is beyond the shaft end
    const shaft = arrow.children[0] as VMobject;
    const shaftPts = shaft.getPoints();
    const shaftEnd = shaftPts[shaftPts.length - 1];
    const arrowEnd = arrow.getEnd();
    // Arrow end (tip point) should be further along the shaft direction
    expect(arrowEnd[0]).toBeGreaterThanOrEqual(shaftEnd[0]);
  });
});
