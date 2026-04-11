import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';

describe('applyMatrix', () => {
  it('applies a 3x3 identity matrix (no change)', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 2, 0],
      [3, 4, 0],
      [5, 6, 0],
      [7, 8, 0],
    ]);
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    vm.applyMatrix(identity);
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(1);
    expect(pts[0][1]).toBeCloseTo(2);
    expect(pts[3][0]).toBeCloseTo(7);
    expect(pts[3][1]).toBeCloseTo(8);
  });

  it('applies a 3x3 scaling matrix', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const scaleMatrix = [
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 1],
    ];
    vm.applyMatrix(scaleMatrix);
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[1][0]).toBeCloseTo(4);
    expect(pts[2][0]).toBeCloseTo(6);
    expect(pts[3][0]).toBeCloseTo(8);
  });

  it('applies a 3x3 rotation matrix (90 degrees CCW)', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const rotMatrix = [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ];
    vm.applyMatrix(rotMatrix);
    const pts = vm.getPoints();
    // [1,0,0] -> [0,1,0]
    expect(pts[0][0]).toBeCloseTo(0);
    expect(pts[0][1]).toBeCloseTo(1);
    // [4,0,0] -> [0,4,0]
    expect(pts[3][0]).toBeCloseTo(0);
    expect(pts[3][1]).toBeCloseTo(4);
  });

  it('applies a matrix with aboutPoint', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    // Scale by 2 about [1,0,0] -> [1,0,0] stays, [4,0,0] -> [7,0,0]
    const scaleMatrix = [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 1],
    ];
    vm.applyMatrix(scaleMatrix, { aboutPoint: [1, 0, 0] });
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(1); // fixed point
    expect(pts[1][0]).toBeCloseTo(3); // (2-1)*2+1 = 3
    expect(pts[2][0]).toBeCloseTo(5); // (3-1)*2+1 = 5
    expect(pts[3][0]).toBeCloseTo(7); // (4-1)*2+1 = 7
  });

  it('applies a matrix with aboutEdge', () => {
    const vm = new VMobject();
    // A unit square centered at origin
    vm.setPoints([
      [-1, -1, 0],
      [-1, 1, 0],
      [1, 1, 0],
      [1, -1, 0],
    ]);
    // Scale by 2 about the right edge center [1,0,0]
    const scaleMatrix = [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 1],
    ];
    vm.applyMatrix(scaleMatrix, { aboutEdge: [1, 0, 0] });
    const pts = vm.getPoints();
    // Right edge center is [1,0,0], so points are transformed about that
    // [-1,-1,0] -> (-1-1)*2+1 = -3, (-1-0)*2+0 = -2 -> [-3,-2,0]
    expect(pts[0][0]).toBeCloseTo(-3);
    expect(pts[0][1]).toBeCloseTo(-2);
    // [1,-1,0] -> (1-1)*2+1 = 1, (-1-0)*2+0 = -2 -> [1,-2,0]
    expect(pts[3][0]).toBeCloseTo(1);
    expect(pts[3][1]).toBeCloseTo(-2);
  });

  it('works on nested VMobjects in a VGroup', () => {
    const child = new VMobject();
    child.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const group = new VGroup(child);
    const scaleMatrix = [
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    group.applyMatrix(scaleMatrix);
    const pts = child.getPoints();
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[1][0]).toBeCloseTo(4);
  });

  it('supports 2x2 matrix', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    // 2x2 scaling matrix: scale x by 2, y by 3
    const matrix2 = [
      [2, 0],
      [0, 3],
    ];
    vm.applyMatrix(matrix2);
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(2);
    expect(pts[0][1]).toBeCloseTo(0);
    expect(pts[1][0]).toBeCloseTo(4);
    expect(pts[1][1]).toBeCloseTo(0);
  });

  it('returns this for chaining', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = vm.applyMatrix(identity);
    expect(result).toBe(vm);
  });
});
