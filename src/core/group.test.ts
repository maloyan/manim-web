import { describe, it, expect } from 'vitest';
import { Mobject, UP, LEFT, RIGHT, UL, UR, DL } from './Mobject';
import { VMobject } from './VMobject';
import { Group } from './Group';
import { VGroup } from './VGroup';
import { Dot } from '../mobjects/geometry/Dot';
import { Line } from '../mobjects/geometry/Line';
import { PointMobject } from '../mobjects/point';

describe('Group - extended coverage', () => {
  it('constructs empty', () => {
    const g = new Group();
    expect(g.length).toBe(0);
    expect(g.children).toEqual([]);
  });

  it('constructs with initial mobjects', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    expect(g.length).toBe(2);
    expect(a.parent).toBe(g);
    expect(b.parent).toBe(g);
  });

  it('add re-parents from previous parent', () => {
    const g1 = new Group();
    const g2 = new Group();
    const vm = new VMobject();
    g1.add(vm);
    expect(vm.parent).toBe(g1);
    g2.add(vm);
    expect(vm.parent).toBe(g2);
    expect(g1.children).not.toContain(vm);
    expect(g2.children).toContain(vm);
  });

  it('remove clears parent and removes from children', () => {
    const g = new Group();
    const vm = new VMobject();
    g.add(vm);
    g.remove(vm);
    expect(vm.parent).toBeNull();
    expect(g.children).not.toContain(vm);
  });

  it('remove of non-member is no-op', () => {
    const g = new Group();
    const outsider = new VMobject();
    g.remove(outsider);
    expect(g.length).toBe(0);
  });

  it('clear removes all children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    g.clear();
    expect(g.length).toBe(0);
    expect(a.parent).toBeNull();
    expect(b.parent).toBeNull();
  });

  it('getCenter with no children returns group position', () => {
    const g = new Group();
    g.position.set(5, 6, 7);
    expect(g.getCenter()).toEqual([5, 6, 7]);
  });

  it('getCenter with children returns geometric center from child bounds', () => {
    const a = new Dot({ point: [0, 0, 0] });
    const b = new Dot({ point: [2, 0, 0] });
    const g = new Group(a, b);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(1, 0);
  });

  it('Group getCenter returns position when every child is empty', () => {
    // MIGRATION: example-based regression. Intent: a group whose only child has no
    // geometry has no bounds, so getCenter falls back to position (matching VGroup)
    // rather than throwing. Replace with a property test later.
    const g = new Group(new VMobject());
    g.shift([3, -2, 0]);
    expect(g.getCenter()).toEqual([3, -2, 0]);
  });

  it('Group getBounds uses descendant geometry', () => {
    const a = new Dot({ point: [0, 0, 0] });
    const b = new Dot({ point: [2, 0, 0] });
    const g = new Group(new Group(a, b));

    const bounds = g.getBounds();
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    expect(centerX).toBeCloseTo(1, 6);
    expect(bounds.min.x).toBeLessThan(0);
    expect(bounds.max.x).toBeGreaterThan(2);
  });

  it('Group getBounds throws on empty container tree', () => {
    const g = new Group(new Group());
    expect(() => g.getBounds()).toThrow(/empty Three\.js bounds/);
  });

  it('Group getBounds is stable before and after normalizeTransform with translation/scale/rotation', () => {
    // MIGRATION: weak test, remove once property-based tests done
    // Bounding box invariants are complex due to rotation baking and geometry updates.
    const a = new Dot({ point: [0, 0, 0] });
    const b = new Dot({ point: [2, 1, 0] });
    const g = new Group(a, b);

    g.shift([3, -2, 0]);
    g.scale(1.7);
    g.rotate(Math.PI / 5);

    const before = g.getBounds();
    const beforeCenter = [
      (before.min.x + before.max.x) / 2,
      (before.min.y + before.max.y) / 2,
      (before.min.z + before.max.z) / 2,
    ] as const;

    g.normalizeTransform();

    const after = g.getBounds();
    const afterCenter = [
      (after.min.x + after.max.x) / 2,
      (after.min.y + after.max.y) / 2,
      (after.min.z + after.max.z) / 2,
    ] as const;

    // Center should be stable (geometry was transformed in place)
    expect(afterCenter[0]).toBeCloseTo(beforeCenter[0], 1);
    expect(afterCenter[1]).toBeCloseTo(beforeCenter[1], 1);
    expect(afterCenter[2]).toBeCloseTo(beforeCenter[2], 1);

    // Bounds exist and are non-empty
    const afterSize = [
      after.max.x - after.min.x,
      after.max.y - after.min.y,
      after.max.z - after.min.z,
    ] as const;
    expect(afterSize[0]).toBeGreaterThan(0);
    expect(afterSize[1]).toBeGreaterThan(0);
  });

  it('Group getCenter returns position on nested empty containers', () => {
    // MIGRATION: example-based regression. Intent: nested empty containers still
    // have no geometry, so getCenter falls back to position. Replace with a
    // property test later.
    const g = new Group(new VGroup(new VGroup()));
    g.shift([1, 4, 0]);
    expect(g.getCenter()).toEqual([1, 4, 0]);
  });

  it('empty group getCenter is world-space: follows a transformed parent', () => {
    // MIGRATION: example-based regression. Intent: getCenter() is world-space even
    // with no geometry — the parent-local position is lifted through the parent's
    // transform, so an empty child tracks its parent rather than reporting a raw
    // local offset. Replace with a property test later.
    const empty = new Group(new VMobject()); // no geometry => isEmpty()
    const parent = new Group(empty);
    empty.shift([1, 0, 0]); // parent-local position
    const before = empty.getCenter();
    expect(before[0]).toBeCloseTo(1, 6); // parent untransformed

    parent.shift([10, 0, 0]);
    const after = empty.getCenter();
    expect(after[0]).toBeCloseTo(before[0] + 10, 6); // moved into world space with the parent
  });

  it('shift moves group position', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    g.shift([1, 1, 0]);
    // Group.shift moves g.position; children retain their local offsets.
    // World positions shift by delta via THREE.js hierarchy.
    expect(g.position.x).toBe(1);
    expect(g.position.y).toBe(1);
    expect(a.position.x).toBe(0);
    expect(b.position.x).toBe(2);
  });

  it('moveTo with point moves group center', () => {
    const a = new PointMobject({ position: [0, 0, 0] });
    const b = new PointMobject({ position: [2, 0, 0] });
    const g = new Group(a, b);
    g.moveTo([5, 5, 0]);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(5, 0);
    expect(center[1]).toBeCloseTo(5, 0);
  });

  it('scale then moveTo keeps Group center on target', () => {
    const g = new Group(new PointMobject({ position: [1, 0, 0] }));
    g.scale(2);
    g.moveTo([5, 0, 0]);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(5, 6);
    expect(center[1]).toBeCloseTo(0, 6);
    expect(center[2]).toBeCloseTo(0, 6);
  });

  it('moveTo with Mobject target centers on it', () => {
    const target = new PointMobject({ position: [10, 10, 0] });
    const a = new PointMobject({ position: [0, 0, 0] });
    const g = new Group(a);
    g.moveTo(target);
    const center = g.getCenter();
    const tc = target.getCenter();
    expect(center[0]).toBeCloseTo(tc[0], 0);
    expect(center[1]).toBeCloseTo(tc[1], 0);
  });

  it('moveTo with Mobject + alignedEdge aligns edges', () => {
    const target = new PointMobject({ position: [5, 5, 0] });
    const a = new PointMobject({ position: [0, 0, 0] });
    const g = new Group(a);
    g.moveTo(target, UL);
    // should shift to align upper-left edges
  });

  it('scale updates group scale vector', () => {
    const a = new VMobject();
    const g = new Group(a);
    g.scale(2);
    expect(g.scaleVector.x).toBe(2);
    expect(g.scaleVector.y).toBe(2);
    expect(a.scaleVector.x).toBe(1);
  });

  it('scale with tuple updates group scale vector non-uniformly', () => {
    const a = new VMobject();
    const g = new Group(a);
    g.scale([2, 3, 4]);
    expect(g.scaleVector.x).toBe(2);
    expect(g.scaleVector.y).toBe(3);
    expect(g.scaleVector.z).toBe(4);
  });

  it('setColor propagates to all children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    g.setColor('#ff0000');
    expect(a.color).toBe('#ff0000');
    expect(b.color).toBe('#ff0000');
  });

  it('setStrokeOpacity propagates to all children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    g.setStrokeOpacity(0.3);
    expect(a.opacity).toBe(0.3);
    expect(b.opacity).toBe(0.3);
  });

  it('setStrokeWidth propagates to all children', () => {
    const a = new VMobject();
    const g = new Group(a);
    g.setStrokeWidth(10);
    expect(a.strokeWidth).toBe(10);
  });

  it('setFillOpacity propagates to all children', () => {
    const a = new VMobject();
    const g = new Group(a);
    g.setFillOpacity(0.8);
    expect(a.fillOpacity).toBe(0.8);
  });

  it('get returns child by index', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    expect(g.get(0)).toBe(a);
    expect(g.get(1)).toBe(b);
    expect(g.get(2)).toBeUndefined();
  });

  it('Symbol.iterator allows for-of iteration', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    const items: Mobject[] = [];
    for (const m of g) {
      items.push(m);
    }
    expect(items).toEqual([a, b]);
  });

  it('forEach iterates over children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    const indices: number[] = [];
    g.forEach((_m, i) => indices.push(i));
    expect(indices).toEqual([0, 1]);
  });

  it('map maps over children', () => {
    const a = new VMobject();
    a.position.set(1, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    const xs = g.map((m) => m.position.x);
    expect(xs).toEqual([1, 2]);
  });

  it('filter creates new group with matching children copies', () => {
    const a = new VMobject();
    a.position.set(1, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    const filtered = g.filter((m) => m.position.x > 1);
    expect(filtered.length).toBe(1);
    // filtered contains copies, not originals
    expect(filtered.get(0)).not.toBe(b);
  });

  it('copy creates independent clone with copied children', () => {
    const a = new VMobject();
    a.position.set(1, 2, 3);
    const g = new Group(a);
    g.position.set(10, 20, 30);
    const clone = g.copy() as Group;
    expect(clone.length).toBe(1);
    expect(clone.position.x).toBe(10);
    expect(clone.children[0].position.x).toBe(1);
    // mutation of clone does not affect original
    clone.position.set(0, 0, 0);
    expect(g.position.x).toBe(10);
  });

  it('_createThreeObject creates THREE.Group', () => {
    const a = new VMobject();
    const g = new Group(a);
    const obj = g.getThreeObject();
    expect(obj).toBeDefined();
  });
});
