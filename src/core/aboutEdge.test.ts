import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';

/**
 * Tests for aboutPoint / aboutEdge support across Mobject transform methods.
 * See https://github.com/maloyan/manim-web/issues/218
 */

function makeUnitSquare(): VMobject {
  const vm = new VMobject();
  // A 2×2 square centered at origin: corners at (±1, ±1)
  vm.setPoints([
    [-1, -1, 0],
    [-1, 1, 0],
    [1, 1, 0],
    [1, -1, 0],
  ]);
  return vm;
}

describe('scale with aboutPoint and aboutEdge (#218)', () => {
  it('scales about a specific point', () => {
    const vm = makeUnitSquare();
    // Scale by 2 about the right edge center [1, 0, 0]
    // Point [-1,-1,0]: (-1-1)*2+1 = -3, (-1-0)*2+0 = -2
    vm.scale(2, { aboutPoint: [1, 0, 0] });
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(-3);
    expect(pts[0][1]).toBeCloseTo(-2);
    // Point [1,-1,0]: (1-1)*2+1 = 1, (-1-0)*2+0 = -2
    expect(pts[3][0]).toBeCloseTo(1);
    expect(pts[3][1]).toBeCloseTo(-2);
  });

  it('scales about an edge (RIGHT)', () => {
    const vm = makeUnitSquare();
    // aboutEdge [1,0,0] resolves to right edge center [1,0,0]
    vm.scale(2, { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(-3);
    expect(pts[0][1]).toBeCloseTo(-2);
    expect(pts[3][0]).toBeCloseTo(1);
    expect(pts[3][1]).toBeCloseTo(-2);
  });

  it('scales about an edge (UP)', () => {
    const vm = makeUnitSquare();
    // aboutEdge [0,1,0] resolves to top edge center [0,1,0]
    vm.scale(3, { aboutEdge: [0, 1, 0] });
    const pts = vm.getPoints();
    // [-1,-1,0]: (-1-0)*3+0 = -3, (-1-1)*3+1 = -5
    expect(pts[0][0]).toBeCloseTo(-3);
    expect(pts[0][1]).toBeCloseTo(-5);
    // [1,1,0]: (1-0)*3+0 = 3, (1-1)*3+1 = 1 (fixed along y)
    expect(pts[2][0]).toBeCloseTo(3);
    expect(pts[2][1]).toBeCloseTo(1);
  });
});

describe('stretch with aboutPoint and aboutEdge (#218)', () => {
  it('stretches along x axis', () => {
    const vm = makeUnitSquare();
    vm.stretch(2, 0);
    const pts = vm.getPoints();
    // x doubles, y unchanged
    expect(pts[0][0]).toBeCloseTo(-2);
    expect(pts[0][1]).toBeCloseTo(-1);
    expect(pts[2][0]).toBeCloseTo(2);
    expect(pts[2][1]).toBeCloseTo(1);
  });

  it('stretches along y axis about a point', () => {
    const vm = makeUnitSquare();
    // Stretch y by 3 about top edge [0,1,0]
    vm.stretch(3, 1, { aboutPoint: [0, 1, 0] });
    const pts = vm.getPoints();
    // [-1,-1,0]: y = (-1-1)*3+1 = -5
    expect(pts[0][1]).toBeCloseTo(-5);
    // [1,1,0]: y = (1-1)*3+1 = 1 (fixed)
    expect(pts[2][1]).toBeCloseTo(1);
    // x unchanged
    expect(pts[0][0]).toBeCloseTo(-1);
  });

  it('stretches about an edge', () => {
    const vm = makeUnitSquare();
    // Stretch x by 2 about right edge [1,0,0] -> resolves to [1,0,0]
    vm.stretch(2, 0, { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    // [-1,-1,0]: x = (-1-1)*2+1 = -3, y unchanged = -1
    expect(pts[0][0]).toBeCloseTo(-3);
    expect(pts[0][1]).toBeCloseTo(-1);
    // [1,1,0]: x = (1-1)*2+1 = 1 (fixed), y unchanged = 1
    expect(pts[2][0]).toBeCloseTo(1);
    expect(pts[2][1]).toBeCloseTo(1);
  });

  it('throws when both aboutPoint and aboutEdge are specified', () => {
    const vm = makeUnitSquare();
    expect(() => vm.stretch(2, 0, { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] })).toThrow();
  });

  it('throws for invalid dim', () => {
    const vm = makeUnitSquare();
    expect(() => vm.stretch(2, 3)).toThrow();
    expect(() => vm.stretch(2, -1)).toThrow();
    expect(() => vm.stretch(2, 1.5)).toThrow();
  });

  it('handles empty options object same as no options', () => {
    const vm1 = makeUnitSquare();
    const vm2 = makeUnitSquare();
    vm1.stretch(2, 0);
    vm2.stretch(2, 0, {});
    const pts1 = vm1.getPoints();
    const pts2 = vm2.getPoints();
    for (let i = 0; i < pts1.length; i++) {
      expect(pts2[i][0]).toBeCloseTo(pts1[i][0]);
      expect(pts2[i][1]).toBeCloseTo(pts1[i][1]);
    }
  });
});

describe('rotate with aboutEdge (#218)', () => {
  it('rotates about an edge (RIGHT)', () => {
    const vm = makeUnitSquare();
    // aboutEdge [1,0,0] resolves to right edge center [1,0,0]
    // Rotate 90 degrees CCW about [1,0,0]
    vm.rotate(Math.PI / 2, { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    // [-1,-1,0] relative to [1,0,0]: (-2,-1) -> rotated 90 CCW: (1,-2) -> absolute: (2,-2)
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[0][1]).toBeCloseTo(-2);
  });
});

describe('flip with aboutPoint and aboutEdge (#218)', () => {
  it('flips about a specific point along x-axis', () => {
    const vm = new VMobject();
    vm.setPoints([
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
    ]);
    // Flip x about point [2,0,0]: reflects x around x=2
    // [2,0,0] -> 2, [3,0,0] -> 1, [4,0,0] -> 0, [5,0,0] -> -1
    vm.flip([1, 0, 0], { aboutPoint: [2, 0, 0] });
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[1][0]).toBeCloseTo(1);
    expect(pts[2][0]).toBeCloseTo(0);
    expect(pts[3][0]).toBeCloseTo(-1);
  });

  it('flips about an edge', () => {
    const vm = makeUnitSquare();
    // aboutEdge [1,0,0] -> right edge center [1,0,0]
    // Flip x about x=1: point [-1,y,0] -> 2*1-(-1) = 3
    vm.flip([1, 0, 0], { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(3); // was -1
    expect(pts[2][0]).toBeCloseTo(1); // was 1, stays
  });
});

describe('aboutPoint and aboutEdge conflict (#218)', () => {
  it('throws when both aboutPoint and aboutEdge are specified', () => {
    const vm = makeUnitSquare();
    expect(() => vm.scale(2, { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] })).toThrow();
    expect(() => vm.rotate(Math.PI / 2, { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] })).toThrow();
    expect(() => vm.flip([1, 0, 0], { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] })).toThrow();
    expect(() =>
      vm.applyFunction((p) => p, { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] }),
    ).toThrow();
    expect(() =>
      vm.applyMatrix(
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        { aboutPoint: [0, 0, 0], aboutEdge: [1, 0, 0] },
      ),
    ).toThrow();
  });
});

describe('applyFunction with aboutPoint and aboutEdge (#218)', () => {
  it('applies function about a specific point', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    // Scale x by 2 about point [1,0,0]
    vm.applyFunction((p) => [p[0] * 2, p[1], p[2]], { aboutPoint: [1, 0, 0] });
    const pts = vm.getPoints();
    // [1,0,0] -> translate to [0,0,0], apply *2 -> [0,0,0], translate back -> [1,0,0]
    expect(pts[0][0]).toBeCloseTo(1);
    // [4,0,0] -> translate to [3,0,0], apply *2 -> [6,0,0], translate back -> [7,0,0]
    expect(pts[3][0]).toBeCloseTo(7);
  });

  it('applies function about an edge', () => {
    const vm = makeUnitSquare();
    // aboutEdge [1,0,0] -> right edge center [1,0,0]
    // Scale x by 2 about [1,0,0]
    vm.applyFunction((p) => [p[0] * 2, p[1], p[2]], { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    // [-1,-1,0]: translate -> [-2,-1,0], apply -> [-4,-1,0], translate back -> [-3,-1,0]
    expect(pts[0][0]).toBeCloseTo(-3);
    // [1,-1,0]: translate -> [0,-1,0], apply -> [0,-1,0], translate back -> [1,-1,0]
    expect(pts[3][0]).toBeCloseTo(1);
  });
});
