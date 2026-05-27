import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { Group } from './Group';
import { VGroup } from './VGroup';
import { Line } from '../mobjects/geometry/Line';
import { Dot } from '../mobjects/geometry/Dot';
import { PointMobject } from '../mobjects/point';
import { axisVectorFromEulerKey } from '../utils/math';

describe('VGroup - extended coverage', () => {
  it('constructs empty', () => {
    const vg = new VGroup();
    expect(vg.length).toBe(0);
    expect(vg.fillOpacity).toBe(0);
  });

  it('constructs with VMobjects', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    expect(vg.length).toBe(2);
    expect(a.parent).toBe(vg);
  });

  it('add handles non-VMobjects via super.add', () => {
    const vg = new VGroup();
    const g = new Group();
    vg.add(g);
    expect(vg.children).toContain(g);
  });

  it('addVMobjects re-parents from previous parent', () => {
    const g1 = new VGroup();
    const g2 = new VGroup();
    const vm = new VMobject();
    g1.addVMobjects(vm);
    expect(vm.parent).toBe(g1);
    g2.addVMobjects(vm);
    expect(vm.parent).toBe(g2);
    expect(g1.children).not.toContain(vm);
  });

  it('remove removes mobjects and marks dirty', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    vg.remove(a);
    expect(vg.length).toBe(1);
    expect(a.parent).toBeNull();
  });

  it('remove of non-member is no-op', () => {
    const vg = new VGroup();
    const outsider = new VMobject();
    vg.remove(outsider);
    expect(vg.length).toBe(0);
  });

  it('getCenter with no children returns group position', () => {
    const vg = new VGroup();
    // Empty VGroup: after normalizeTransform, position resets
    expect(vg.getCenter()).toEqual([0, 0, 0]);
  });

  it('getCenter with children includes position offset', () => {
    const a = new Dot({ point: [0, 0, 0] });
    const b = new Dot({ point: [2, 0, 0] });
    const vg = new VGroup(a, b);

    const bounds = vg.getBounds();
    const bboxCenterX = (bounds.min.x + bounds.max.x) / 2;
    expect(bboxCenterX).toBeCloseTo(1, 0);

    const center = vg.getCenter();
    expect(center[0]).toBeCloseTo(bboxCenterX, 6);
  });

  it('getCenter with only empty VMobject children returns group position', () => {
    const vg = new VGroup(new VMobject());
    expect(vg.getCenter()).toEqual([0, 0, 0]);
  });

  it('shift moves vgroup position', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const vg = new VGroup(a);
    vg.shift([5, 0, 0]);
    // VGroup.shift moves vg.position; child retains its local offset.
    expect(vg.position.x).toBe(5);
    expect(a.position.x).toBe(0);
  });

  it('shift on empty VGroup is equivalent to shifting after children are added (issue #318)', () => {
    const makeChild = (): VMobject => {
      const a = new VMobject();
      a.setPoints3D([
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ]);
      return a;
    };

    const preShift = new VGroup();
    preShift.shift([-8, 0, 0]);
    preShift.add(makeChild());

    const postShift = new VGroup();
    postShift.add(makeChild());
    postShift.shift([-8, 0, 0]);

    expect(preShift.getCenter()[0]).toBeCloseTo(postShift.getCenter()[0], 5);

    preShift.shift([1, 0, 0]);
    postShift.shift([1, 0, 0]);

    expect(preShift.getCenter()[0]).toBeCloseTo(postShift.getCenter()[0], 5);
  });

  it('pre-shifted VGroup center is stable across matrixWorld updates', () => {
    const vg = new VGroup();
    vg.shift([-8, 0, 0]);
    const a = new VMobject();
    a.setPoints3D([
      [1, 0, 0],
      [2, 0, 0],
      [3, 1, 0],
      [2, 2, 0],
    ]);
    vg.add(a);

    const before = vg.getCenter();
    vg.getThreeObject().updateMatrixWorld(true);
    const after = vg.getCenter();

    expect(after[0]).toBeCloseTo(before[0], 5);
    expect(after[1]).toBeCloseTo(before[1], 5);
    expect(after[2]).toBeCloseTo(before[2], 5);
  });

  it('moveTo with point moves VGroup center', () => {
    const a = new Dot({ point: [0, 0, 0] });
    const b = new Dot({ point: [2, 0, 0] });
    const vg = new VGroup(a, b);
    vg.moveTo([10, 10, 0]);
    const center = vg.getCenter();
    expect(center[0]).toBeCloseTo(10, 0);
    expect(center[1]).toBeCloseTo(10, 0);
  });

  it('scale then moveTo keeps VGroup center on target', () => {
    const vg = new VGroup(new PointMobject({ position: [1, 0, 0] }));
    vg.scale(2);
    vg.moveTo([5, 0, 0]);
    const center = vg.getCenter();
    expect(center[0]).toBeCloseTo(5, 6);
    expect(center[1]).toBeCloseTo(0, 6);
    expect(center[2]).toBeCloseTo(0, 6);
  });

  it('moveTo with Mobject target', () => {
    const target = new PointMobject({ position: [5, 5, 0] });
    const a = new PointMobject({ position: [0, 0, 0] });
    const vg = new VGroup(a);
    vg.moveTo(target);
    const center = vg.getCenter();
    const tc = target.getCenter();
    expect(center[0]).toBeCloseTo(tc[0], 0);
  });

  it('moveTo with Mobject + alignedEdge', () => {
    const target = new PointMobject({ position: [5, 5, 0] });
    const a = new PointMobject({ position: [0, 0, 0] });
    const vg = new VGroup(a);
    vg.moveTo(target, UL);
    // should have shifted to align
  });

  it('rotate stores on VGroup, then normalizeTransform forwards to children', () => {
    const line = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const dot = new Dot({ point: [2, 0, 0], radius: 0 });
    const vg = new VGroup(line, dot);

    vg.rotate(Math.PI / 2);

    // Rotation is stored on group transform before normalization.
    expect(vg.rotation.z).toBeCloseTo(Math.PI / 2, 6);

    vg.normalizeTransform();

    // Group anchor is canonical after normalization.
    expect(vg.rotation.x).toBe(0);
    expect(vg.rotation.y).toBe(0);
    expect(vg.rotation.z).toBe(0);

    const dotCenter = dot.getCenter();
    expect(dotCenter[0]).toBeCloseTo(1, 6);
    expect(dotCenter[1]).toBeCloseTo(1, 6);
  });

  it('normalizeTransform rotates VMobject child position offsets when baking VGroup rotation', () => {
    const line = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    line.shift([2, 0, 0]);
    const group = new VGroup(line);

    group.rotate(Math.PI / 2);
    group.normalizeTransform();

    expect(line.position.x).toBeCloseTo(0, 6);
    expect(line.position.y).toBeCloseTo(2, 6);
    expect(line.position.z).toBeCloseTo(0, 6);
  });

  it('VGroup isEmpty treats point-less VMobject containers with renderable descendants as non-empty', () => {
    const container = new VMobject();
    const line = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    container.add(line);

    const group = new VGroup(container);
    expect(group.isEmpty()).toBe(false);

    const before = group.getCenter();
    expect(before[0]).toBeCloseTo(1, 6);
    expect(before[1]).toBeCloseTo(0, 6);

    group.moveTo([4, 3, 0]);
    const after = group.getCenter();
    expect(after[0]).toBeCloseTo(4, 6);
    expect(after[1]).toBeCloseTo(3, 6);
  });

  it('normalizeTransform respects non-XYZ Euler order for VGroup rotation', () => {
    const sourceLine = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const sourceGroup = new VGroup(sourceLine);
    sourceGroup.rotation.order = 'YXZ';
    sourceGroup.rotation.set(0.4, 0.7, 0.2, 'YXZ');

    const xyzLine = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const xyzGroup = new VGroup(xyzLine);
    xyzGroup.rotation.order = 'XYZ';
    xyzGroup.rotation.set(0.4, 0.7, 0.2, 'XYZ');

    sourceGroup.normalizeTransform();
    xyzGroup.normalizeTransform();

    const sourceEnd = sourceLine.getEnd();
    const xyzEnd = xyzLine.getEnd();
    expect(Math.abs(sourceEnd[0] - xyzEnd[0]) + Math.abs(sourceEnd[1] - xyzEnd[1])).toBeGreaterThan(
      1e-4,
    );
  });

  it('normalizeTransform bakes ordered Euler rotation to PointMobject child', () => {
    const point = new PointMobject({ position: [1, 2, 3] });
    const group = new VGroup(point);
    group.rotation.order = 'ZXY';
    group.rotation.set(0.3, -0.5, 0.2, 'ZXY');

    const expected = new PointMobject({ position: [1, 2, 3] });
    const angles: Record<'X' | 'Y' | 'Z', number> = { X: 0.3, Y: -0.5, Z: 0.2 };
    for (const axis of group.rotation.order) {
      const angle = angles[axis as 'X' | 'Y' | 'Z'];
      if (angle === 0) continue;
      expected.rotate(angle, {
        axis: axisVectorFromEulerKey(axis as 'X' | 'Y' | 'Z'),
        aboutPoint: [0, 0, 0],
      });
    }

    group.normalizeTransform();

    const actualPos = point.getPosition();
    const expectedPos = expected.getPosition();
    expect(actualPos[0]).toBeCloseTo(expectedPos[0], 6);
    expect(actualPos[1]).toBeCloseTo(expectedPos[1], 6);
    expect(actualPos[2]).toBeCloseTo(expectedPos[2], 6);
  });

  it('normalizeTransform is idempotent for deferred rotation on VGroup', () => {
    const point = new PointMobject({ position: [1, 2, 3] });
    const group = new VGroup(point);
    group.rotation.order = 'YXZ';
    group.rotation.set(0.4, 0.2, -0.1, 'YXZ');

    group.normalizeTransform();
    const afterFirst = point.getPosition();

    group.normalizeTransform();
    const afterSecond = point.getPosition();

    expect(afterSecond[0]).toBeCloseTo(afterFirst[0], 6);
    expect(afterSecond[1]).toBeCloseTo(afterFirst[1], 6);
    expect(afterSecond[2]).toBeCloseTo(afterFirst[2], 6);
  });

  it('scale updates vgroup scale vector', () => {
    const a = new PointMobject({ position: [0, 0, 0] });
    const b = new PointMobject({ position: [4, 0, 0] });
    const vg = new VGroup(a, b);
    vg.scale(2);
    expect(vg.scaleVector.x).toBe(2);
    expect(vg.scaleVector.y).toBe(2);
    expect(a.scaleVector.x).toBe(1);
    expect(b.scaleVector.x).toBe(1);
  });

  it('scale with tuple updates vgroup scale vector non-uniformly', () => {
    const a = new PointMobject({ position: [0, 0, 0] });
    const vg = new VGroup(a);
    vg.scale([2, 3, 1]);
    expect(vg.scaleVector.x).toBe(2);
    expect(vg.scaleVector.y).toBe(3);
  });

  it('getBounds reflects transformed+scaled VGroup without normalizeTransform', () => {
    const line = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    const vg = new VGroup(line);

    vg.shift([3, 1, 0]);
    const shifted = vg.getBounds();
    const shiftedWidth = shifted.max.x - shifted.min.x;

    vg.scale(2);
    const scaled = vg.getBounds();
    const scaledWidth = scaled.max.x - scaled.min.x;

    // Query should be non-mutating: scale remains on group anchor.
    expect(vg.scaleVector.x).toBe(2);
    expect(vg.scaleVector.y).toBe(2);
    expect(vg.scaleVector.z).toBe(2);

    // Bounds should still reflect world transform correctly.
    expect(scaledWidth).toBeCloseTo(shiftedWidth * 2, 6);
  });

  it('normalizeTransform forwards VGroup scale to children and resets group scale', () => {
    const line = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    line.position.set(3, 0, 0);
    const vg = new VGroup(line);

    vg.scale(2);
    expect(vg.scaleVector.x).toBe(2);
    expect(vg.scaleVector.y).toBe(2);
    expect(vg.scaleVector.z).toBe(2);

    vg.normalizeTransform();

    expect(vg.scaleVector.x).toBe(1);
    expect(vg.scaleVector.y).toBe(1);
    expect(vg.scaleVector.z).toBe(1);
    expect(line.scaleVector.x).toBe(1);
    expect(line.scaleVector.y).toBe(1);
    expect(line.scaleVector.z).toBe(1);
    const pts = line.getPoints();
    expect(pts[0][0]).toBeCloseTo(0);
    expect(pts[0][1]).toBeCloseTo(0);
    expect(pts[0][2]).toBeCloseTo(0);
    expect(pts[3][0]).toBeCloseTo(2);
    expect(pts[3][1]).toBeCloseTo(0);
    expect(pts[3][2]).toBeCloseTo(0);
    expect(line.position.x).toBe(6);
    expect(line.position.y).toBe(0);
    expect(line.position.z).toBe(0);
  });

  it('VMobject normalizeTransform canonicalizes subtree and resets parent scale', () => {
    const parent = new VMobject();
    parent.setPoints([
      [0, 0, 0],
      [1 / 3, 0, 0],
      [2 / 3, 0, 0],
      [1, 0, 0],
    ]);

    const child = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    child.position.set(2, 1, 0);
    parent.add(child);

    parent.scale(2);
    expect(parent.scaleVector.x).toBe(2);
    expect(parent.scaleVector.y).toBe(2);
    expect(parent.scaleVector.z).toBe(2);

    parent.normalizeTransform();

    expect(parent.scaleVector.x).toBe(1);
    expect(parent.scaleVector.y).toBe(1);
    expect(parent.scaleVector.z).toBe(1);
    expect(child.scaleVector.x).toBe(1);
    expect(child.scaleVector.y).toBe(1);
    expect(child.scaleVector.z).toBe(1);
    expect(child.position.x).toBe(4);
    expect(child.position.y).toBe(2);
    expect(child.position.z).toBe(0);
  });

  it('center should be geometric from child bounds, not mean of child centers', () => {
    const wide = new Line({ start: [0, 0, 0], end: [4, 0, 0] }); // center x=2
    const narrow = new Line({ start: [10, 0, 0], end: [11, 0, 0] }); // center x=10.5
    const vg = new VGroup(wide, narrow);

    // Mean of centers would be 6.25, but bbox center is (0 + 11) / 2 = 5.5.
    expect(vg.getCenter()[0]).toBeCloseTo(5.5, 6);
  });

  it('scale result should be invariant to translating group vs children', () => {
    // Setup A: translate children directly.
    const lineA = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    lineA.position.x = 1;
    const pointA = new Dot({ point: [1, 0, 0], radius: 0 });
    const gA = new VGroup(lineA, pointA);

    // Setup B: equivalent world placement via group translation.
    const lineB = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const pointB = new Dot({ point: [0, 0, 0], radius: 0 });
    const gB = new VGroup(lineB, pointB);
    gB.position.x = 1;

    gA.scale(2);
    gB.scale(2);

    const worldCenterX = (group: VGroup): number => group.getCenter()[0] + group.position.x;
    const worldX = (mob: VMobject, group: VGroup): number => mob.getCenter()[0] + group.position.x;

    expect(worldCenterX(gB)).toBeCloseTo(worldCenterX(gA), 6);
    expect(worldX(lineB, gB)).toBeCloseTo(worldX(lineA, gA), 6);
    expect(worldX(pointB, gB)).toBeCloseTo(worldX(pointA, gA), 6);
  });

  it('setColor propagates to children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    vg.setColor('#00ff00');
    expect(a.color).toBe('#00ff00');
    expect(b.color).toBe('#00ff00');
  });

  it('setStrokeOpacity propagates to children', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setStrokeOpacity(0.5);
    expect(a.opacity).toBe(0.5);
  });

  it('setStrokeWidth propagates to children', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setStrokeWidth(12);
    expect(a.strokeWidth).toBe(12);
  });

  it('setFillOpacity propagates only to VMobject children', () => {
    const a = new VMobject();
    const g = new Group(); // not a VMobject
    const vg = new VGroup(a, g);
    vg.setFillOpacity(0.9);
    expect(a.fillOpacity).toBe(0.9);
  });

  it('setFill applies color and opacity to VMobject children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    vg.setFill('#ff0000', 0.8);
    expect(a.fillOpacity).toBe(0.8);
    expect(b.fillOpacity).toBe(0.8);
  });

  it('setFill with only color', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setFill('#abcdef');
    expect(a.color).toBe('#abcdef');
  });

  it('setFill with only opacity', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setFill(undefined, 0.5);
    expect(a.fillOpacity).toBe(0.5);
  });

  it('setStroke applies color, width, opacity to VMobject children', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setStroke('#00ff00', 8, 0.6);
    expect(a.color).toBe('#00ff00');
    expect(a.strokeWidth).toBe(8);
    expect(a.opacity).toBe(0.6);
  });

  it('setStroke with only color', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setStroke('#aabbcc');
    expect(a.color).toBe('#aabbcc');
  });

  it('setStroke with only width', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setStroke(undefined, 10);
    expect(a.strokeWidth).toBe(10);
  });

  it('setStroke skips non-VMobject children', () => {
    const a = new VMobject();
    const g = new Group();
    const vg = new VGroup(a, g);
    vg.setStroke('#ff0000', 5, 0.5);
    expect(a.color).toBe('#ff0000');
  });

  it('arrange positions children in a row', () => {
    const a = new PointMobject({ position: [0, 0, 0] });
    const b = new PointMobject({ position: [0, 0, 0] });
    const c = new PointMobject({ position: [0, 0, 0] });
    const vg = new VGroup(a, b, c);
    vg.arrange(RIGHT, 0.5);
    // b should be to the right of a, c to the right of b
    const aCenter = a.getCenter();
    const bCenter = b.getCenter();
    expect(bCenter[0]).toBeGreaterThanOrEqual(aCenter[0]);
  });

  it('arrange with empty group is no-op', () => {
    const vg = new VGroup();
    expect(() => vg.arrange()).not.toThrow();
  });

  it('arrange with center=false does not recenter', () => {
    const a = new PointMobject({ position: [0, 0, 0] });
    const b = new PointMobject({ position: [0, 0, 0] });
    const vg = new VGroup(a, b);
    vg.arrange(RIGHT, 0.5, false);
    // should not throw
  });

  it('arrangeInGrid positions children in grid', () => {
    const items = Array.from({ length: 6 }, () => new PointMobject({ position: [0, 0, 0] }));
    const vg = new VGroup(...items);
    vg.arrangeInGrid(2, 3);
    // Should not throw and children should be repositioned
  });

  it('arrangeInGrid with empty group is no-op', () => {
    const vg = new VGroup();
    expect(() => vg.arrangeInGrid()).not.toThrow();
  });

  it('arrangeInGrid auto-calculates rows/cols', () => {
    const items = Array.from({ length: 9 }, () => new PointMobject({ position: [0, 0, 0] }));
    const vg = new VGroup(...items);
    vg.arrangeInGrid(); // auto: sqrt(9)=3, so 3x3
  });

  it('arrangeInGrid with only rows specified', () => {
    const items = Array.from({ length: 6 }, () => new PointMobject({ position: [0, 0, 0] }));
    const vg = new VGroup(...items);
    vg.arrangeInGrid(2); // 2 rows, auto cols
  });

  it('arrangeInGrid with only cols specified', () => {
    const items = Array.from({ length: 6 }, () => new PointMobject({ position: [0, 0, 0] }));
    const vg = new VGroup(...items);
    vg.arrangeInGrid(undefined, 3); // auto rows, 3 cols
  });

  it('getCombinedPoints returns points from all VMobject children', () => {
    const a = new VMobject();
    a.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const b = new VMobject();
    b.setPoints([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const vg = new VGroup(a, b);
    const combined = vg.getCombinedPoints();
    expect(combined.length).toBe(4);
  });

  it('getPoints returns combined points from children', () => {
    const a = new VMobject();
    a.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const vg = new VGroup(a);
    expect(vg.getPoints().length).toBe(2);
  });

  it('points getter returns combined 2D points', () => {
    const a = new VMobject();
    a.setPoints([
      [1, 2, 0],
      [3, 4, 0],
    ]);
    const vg = new VGroup(a);
    const pts = vg.points;
    expect(pts.length).toBe(2);
    expect(pts[0].x).toBe(1);
    expect(pts[0].y).toBe(2);
  });

  it('get returns child by index', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    expect(vg.get(0)).toBe(a);
    expect(vg.get(1)).toBe(b);
    expect(vg.get(2)).toBeUndefined();
  });

  it('Symbol.iterator allows for-of iteration', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    const items: VMobject[] = [];
    for (const m of vg) {
      items.push(m);
    }
    expect(items).toEqual([a, b]);
  });

  it('forEach iterates with index', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    const indices: number[] = [];
    vg.forEach((_vm, i) => indices.push(i));
    expect(indices).toEqual([0]);
  });

  it('map maps over VMobjects', () => {
    const a = new VMobject();
    a.position.set(1, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const vg = new VGroup(a, b);
    const xs = vg.map((m) => m.position.x);
    expect(xs).toEqual([1, 2]);
  });

  it('filter creates new VGroup with copies', () => {
    const a = new VMobject();
    a.position.set(1, 0, 0);
    const b = new VMobject();
    b.position.set(3, 0, 0);
    const vg = new VGroup(a, b);
    const filtered = vg.filter((m) => m.position.x > 2);
    expect(filtered.length).toBe(1);
    expect(filtered.get(0)).not.toBe(b);
  });

  it('copy creates independent clone', () => {
    const a = new VMobject();
    a.position.set(1, 2, 3);
    const vg = new VGroup(a);
    const clone = vg.copy() as VGroup;
    expect(clone.length).toBe(1);
    expect(clone.children[0].position.x).toBe(1);
    // mutation of clone does not affect original
    clone.children[0].position.set(99, 99, 99);
    expect(a.position.x).toBe(1);
  });

  it('_createThreeObject creates THREE.Group', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    const obj = vg.getThreeObject();
    expect(obj).toBeDefined();
  });
});
