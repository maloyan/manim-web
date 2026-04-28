import { describe, expect, it } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Circle } from '../../mobjects/geometry/Circle';
import { alignVmobjectPair, pairLeafSnapshotsByIndex } from './TransformPairing';

function vmWithPoints(pts: number[][]) {
  const vm = new VMobject();
  vm.setPoints(pts);
  return vm;
}

describe('TransformPairing core', () => {
  it('alignVmobjectPair keeps exact final target topology while returning aligned interpolation points', () => {
    const source = vmWithPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);
    const target = vmWithPoints([
      [0, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 0],
      [0, 0, 0],
      [0.8, 0.8, 0],
      [1.2, 0.8, 0],
      [1.2, 1.2, 0],
      [0.8, 1.2, 0],
      [0.8, 0.8, 0],
    ]);

    (source as VMobject & { getSubpathLengths?: () => number[] }).getSubpathLengths = () => [5];
    (target as VMobject & { getSubpathLengths?: () => number[] }).getSubpathLengths = () => [5, 5];

    const aligned = alignVmobjectPair(source, target);

    expect(aligned.alignedSubpathLengths).toEqual([64, 64]);
    expect(aligned.startPoints.length).toBe(128);
    expect(aligned.targetPoints.length).toBe(128);

    expect(aligned.finalTargetPoints).toEqual(target.getPoints());
    expect(aligned.finalTargetSubpathLengths).toEqual([5, 5]);
  });

  it('alignVmobjectPair falls back to alignPoints for simple paths', () => {
    const source = new Circle({ radius: 1 });
    const target = new Circle({ radius: 2 });

    const aligned = alignVmobjectPair(source, target);

    expect(aligned.startPoints.length).toBe(aligned.targetPoints.length);
    expect(aligned.alignedSubpathLengths).toBeUndefined();
    expect(aligned.finalTargetPoints).toEqual(target.getPoints());
  });

  it('pairLeafSnapshotsByIndex preserves left-to-right leaf order and unmatched tails', () => {
    const a = new Circle({ radius: 1 });
    const b = new Circle({ radius: 0.8 });
    const c = new Circle({ radius: 0.6 });
    const source = new VGroup(new VGroup(a, b), c);

    const t0 = new Circle({ radius: 1.2 });
    const target = new VGroup(t0);

    const pairs = pairLeafSnapshotsByIndex(source, target);

    expect(pairs.length).toBe(3);

    expect(pairs[0].source?.leaf).toBe(a);
    expect(pairs[0].target?.leaf).toBe(t0);

    expect(pairs[1].source?.leaf).toBe(b);
    expect(pairs[1].target).toBeUndefined();

    expect(pairs[2].source?.leaf).toBe(c);
    expect(pairs[2].target).toBeUndefined();
  });
});
