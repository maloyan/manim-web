import { describe, it, expect } from 'vitest';
import { VMobject } from '../core/VMobject';
import { Rotate } from './movement/Rotate';
import { Scale } from './movement/Scale';
import { Rotating } from './utility/index';

function makeUnitSquare(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [-1, -1, 0],
    [-1, 1, 0],
    [1, 1, 0],
    [1, -1, 0],
  ]);
  return vm;
}

describe('Rotate animation with aboutEdge (#218)', () => {
  it('accepts aboutEdge option', () => {
    const vm = makeUnitSquare();
    const anim = new Rotate(vm, { angle: Math.PI / 2, aboutEdge: [1, 0, 0] });
    // aboutEdge [1,0,0] should resolve to the right edge center [1,0,0]
    expect(anim.aboutPoint).toBeDefined();
    expect(anim.aboutPoint![0]).toBeCloseTo(1);
    expect(anim.aboutPoint![1]).toBeCloseTo(0);
    expect(anim.aboutPoint![2]).toBeCloseTo(0);
  });

  it('throws when both aboutPoint and aboutEdge are provided', () => {
    const vm = makeUnitSquare();
    expect(
      () =>
        new Rotate(vm, {
          angle: Math.PI / 2,
          aboutPoint: [0, 0, 0],
          aboutEdge: [1, 0, 0],
        }),
    ).toThrow();
  });
});

describe('Scale animation with aboutEdge (#218)', () => {
  it('accepts aboutEdge option', () => {
    const vm = makeUnitSquare();
    const anim = new Scale(vm, { scaleFactor: 2, aboutEdge: [0, 1, 0] });
    // aboutEdge [0,1,0] should resolve to top edge center [0,1,0]
    expect(anim.aboutPoint).toBeDefined();
    expect(anim.aboutPoint![0]).toBeCloseTo(0);
    expect(anim.aboutPoint![1]).toBeCloseTo(1);
    expect(anim.aboutPoint![2]).toBeCloseTo(0);
  });

  it('throws when both aboutPoint and aboutEdge are provided', () => {
    const vm = makeUnitSquare();
    expect(
      () =>
        new Scale(vm, {
          scaleFactor: 2,
          aboutPoint: [0, 0, 0],
          aboutEdge: [1, 0, 0],
        }),
    ).toThrow();
  });
});

describe('Rotating animation with aboutEdge (#218)', () => {
  it('accepts aboutEdge option', () => {
    const vm = makeUnitSquare();
    const anim = new Rotating(vm, { aboutEdge: [1, 0, 0] });
    // aboutEdge [1,0,0] should resolve to the right edge center [1,0,0]
    expect(anim.aboutPoint).toBeDefined();
    expect(anim.aboutPoint![0]).toBeCloseTo(1);
    expect(anim.aboutPoint![1]).toBeCloseTo(0);
    expect(anim.aboutPoint![2]).toBeCloseTo(0);
  });

  it('throws when both aboutPoint and aboutEdge are provided', () => {
    const vm = makeUnitSquare();
    expect(
      () =>
        new Rotating(vm, {
          aboutPoint: [0, 0, 0],
          aboutEdge: [1, 0, 0],
        }),
    ).toThrow();
  });
});
