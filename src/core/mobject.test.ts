import { describe, it, expect } from 'vitest';
import { Mobject, UP, LEFT, RIGHT, UL, UR, DL } from './Mobject';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { Group } from './Group';
import { VDict, VectorizedPoint } from './VDict';

describe('VectorizedPoint', () => {
  it('creates at origin by default', () => {
    const vp = new VectorizedPoint();
    const loc = vp.getLocation();
    expect(loc).toEqual([0, 0, 0]);
  });

  it('creates at specified location', () => {
    const vp = new VectorizedPoint([3, 4, 5]);
    expect(vp.getLocation()).toEqual([3, 4, 5]);
  });

  it('getCenter returns the point location', () => {
    const vp = new VectorizedPoint([1, 2, 3]);
    expect(vp.getCenter()).toEqual([1, 2, 3]);
  });

  it('setLocation updates the point', () => {
    const vp = new VectorizedPoint();
    vp.setLocation([7, 8, 9]);
    expect(vp.getLocation()).toEqual([7, 8, 9]);
  });

  it('moveTo updates location', () => {
    const vp = new VectorizedPoint([1, 1, 1]);
    vp.moveTo([5, 5, 5]);
    expect(vp.getLocation()).toEqual([5, 5, 5]);
  });

  it('shift adds delta to current location', () => {
    const vp = new VectorizedPoint([1, 2, 3]);
    vp.shift([10, 20, 30]);
    expect(vp.getLocation()).toEqual([11, 22, 33]);
  });

  it('is invisible by default (opacity 0)', () => {
    const vp = new VectorizedPoint();
    expect(vp.opacity).toBe(0);
    expect(vp.fillOpacity).toBe(0);
    expect(vp.strokeWidth).toBe(0);
  });

  it('copy preserves location', () => {
    const vp = new VectorizedPoint([4, 5, 6]);
    const c = vp.copy() as VectorizedPoint;
    expect(c.getLocation()).toEqual([4, 5, 6]);
  });
});

// ============================================================

// Additional coverage tests for Mobject, Group, VGroup, VDict
// ============================================================

describe('Mobject - extended coverage', () => {
  // opacity clamping
  it('opacity setter clamps to [0, 1]', () => {
    const vm = new VMobject();
    vm.opacity = -0.5;
    expect(vm.opacity).toBe(0);
    vm.opacity = 2.0;
    expect(vm.opacity).toBe(1);
  });

  // color setter syncs style
  it('color setter syncs style strokeColor and fillColor', () => {
    const vm = new VMobject();
    vm.color = '#ff0000';
    expect(vm.style.strokeColor).toBe('#ff0000');
    expect(vm.style.fillColor).toBe('#ff0000');
  });

  // style getter returns a copy
  it('style getter returns a copy, not a reference', () => {
    const vm = new VMobject();
    const s = vm.style;
    s.strokeWidth = 999;
    expect(vm.strokeWidth).not.toBe(999);
  });

  // setStyle covers all branches
  it('setStyle updates strokeColor and syncs color', () => {
    const vm = new VMobject();
    vm.setStyle({ strokeColor: '#00ff00' });
    expect(vm.color).toBe('#00ff00');
  });

  it('setStyle updates fillOpacity', () => {
    const vm = new VMobject();
    vm.setStyle({ fillOpacity: 0.7 });
    expect(vm.fillOpacity).toBe(0.7);
  });

  it('setStyle updates strokeOpacity', () => {
    const vm = new VMobject();
    vm.setStyle({ strokeOpacity: 0.3 });
    expect(vm.opacity).toBe(0.3);
  });

  it('setStyle updates strokeWidth', () => {
    const vm = new VMobject();
    vm.setStyle({ strokeWidth: 10 });
    expect(vm.strokeWidth).toBe(10);
  });

  it('setStyle updates fillColor (branch)', () => {
    const vm = new VMobject();
    vm.setStyle({ fillColor: '#abcdef' });
    expect(vm.fillColor).toBe('#abcdef');
  });

  it('setStyle returns this for chaining', () => {
    const vm = new VMobject();
    const result = vm.setStyle({ strokeWidth: 5 });
    expect(result).toBe(vm);
  });

  // submobjects returns a copy
  it('submobjects returns a copy of children', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);
    const subs = parent.submobjects;
    subs.push(new VMobject());
    expect(parent.children.length).toBe(1);
  });

  // add re-parents child from previous parent
  it('add re-parents child from existing parent', () => {
    const p1 = new VMobject();
    const p2 = new VMobject();
    const child = new VMobject();
    p1.add(child);
    expect(child.parent).toBe(p1);
    p2.add(child);
    expect(child.parent).toBe(p2);
    expect(p1.children).not.toContain(child);
    expect(p2.children).toContain(child);
  });

  // add multiple children
  it('add supports multiple children at once', () => {
    const parent = new VMobject();
    const c1 = new VMobject();
    const c2 = new VMobject();
    parent.add(c1, c2);
    expect(parent.children.length).toBe(2);
  });

  // remove of non-child is a no-op
  it('remove of non-child is a no-op', () => {
    const parent = new VMobject();
    const outsider = new VMobject();
    parent.remove(outsider);
    expect(parent.children.length).toBe(0);
  });

  // remove multiple children
  it('remove supports multiple children at once', () => {
    const parent = new VMobject();
    const c1 = new VMobject();
    const c2 = new VMobject();
    parent.add(c1, c2);
    parent.remove(c1, c2);
    expect(parent.children.length).toBe(0);
    expect(c1.parent).toBeNull();
    expect(c2.parent).toBeNull();
  });

  // non-uniform scale
  it('scale with tuple applies non-uniform scale', () => {
    const vm = new VMobject();
    vm.scale([2, 3, 4]);
    expect(vm.scaleVector.x).toBe(2);
    expect(vm.scaleVector.y).toBe(3);
    expect(vm.scaleVector.z).toBe(4);
  });

  // scale with z=0 preserves z
  it('scale with z=0 preserves z scale (no singular matrix)', () => {
    const vm = new VMobject();
    vm.scale([2, 3, 0]);
    expect(vm.scaleVector.z).toBe(1); // z=0 maps to 1
  });

  // setColor no-op when same color
  it('setColor is no-op when color unchanged', () => {
    const vm = new VMobject();
    vm.setColor('#ffffff');
    vm._dirty = false;
    vm.setColor('#ffffff');
    expect(vm._dirty).toBe(false); // should not mark dirty
  });

  // setStrokeOpacity clamping and no-op
  it('setStrokeOpacity clamps and is no-op when unchanged', () => {
    const vm = new VMobject();
    vm.setStrokeOpacity(0.5);
    expect(vm.opacity).toBe(0.5);
    vm._dirty = false;
    vm.setStrokeOpacity(0.5);
    expect(vm._dirty).toBe(false);
  });

  it('setStrokeOpacity clamps to [0, 1]', () => {
    const vm = new VMobject();
    vm.setStrokeOpacity(-1);
    expect(vm.opacity).toBe(0);
    vm.setStrokeOpacity(5);
    expect(vm.opacity).toBe(1);
  });

  // setStrokeWidth clamping and no-op
  it('setStrokeWidth clamps to 0 and is no-op when unchanged', () => {
    const vm = new VMobject();
    vm.setStrokeWidth(0);
    expect(vm.strokeWidth).toBe(0);
    vm._dirty = false;
    vm.setStrokeWidth(0);
    expect(vm._dirty).toBe(false);
  });

  it('setStrokeWidth clamps negative values', () => {
    const vm = new VMobject();
    vm.setStrokeWidth(-5);
    expect(vm.strokeWidth).toBe(0);
  });

  // setFillOpacity clamping and no-op
  it('setFillOpacity clamps and is no-op when unchanged', () => {
    const vm = new VMobject();
    vm.setFillOpacity(0.3);
    expect(vm.fillOpacity).toBe(0.3);
    vm._dirty = false;
    vm.setFillOpacity(0.3);
    expect(vm._dirty).toBe(false);
  });

  it('setFillOpacity clamps to [0, 1]', () => {
    const vm = new VMobject();
    vm.setFillOpacity(-1);
    expect(vm.fillOpacity).toBe(0);
    vm.setFillOpacity(5);
    expect(vm.fillOpacity).toBe(1);
  });

  // setFill
  it('setFill sets both color and opacity', () => {
    const vm = new VMobject();
    vm.setFill('#ff0000', 0.8);
    expect(vm.fillColor).toBe('#ff0000');
    expect(vm.fillOpacity).toBe(0.8);
  });

  it('setFill with only color', () => {
    const vm = new VMobject();
    vm.setFill('#00ff00');
    expect(vm.fillColor).toBe('#00ff00');
  });

  it('setFill with only opacity', () => {
    const vm = new VMobject();
    vm.setFill(undefined, 0.6);
    expect(vm.fillOpacity).toBe(0.6);
  });

  // fillColor setter no-op when same
  it('fillColor setter is no-op when unchanged', () => {
    const vm = new VMobject();
    vm.fillColor = '#aabbcc';
    vm._dirty = false;
    vm.fillColor = '#aabbcc';
    expect(vm._dirty).toBe(false);
  });

  // flip
  it('flip along X axis (default) negates scaleVector.x', () => {
    const vm = new VMobject();
    vm.flip();
    expect(vm.scaleVector.x).toBe(-1);
    expect(vm.scaleVector.y).toBe(1);
    expect(vm.scaleVector.z).toBe(1);
  });

  it('flip along Y axis negates scaleVector.y', () => {
    const vm = new VMobject();
    vm.flip(UP);
    expect(vm.scaleVector.x).toBe(1);
    expect(vm.scaleVector.y).toBe(-1);
  });

  it('flip along Z axis negates scaleVector.z', () => {
    const vm = new VMobject();
    vm.flip([0, 0, 1]);
    expect(vm.scaleVector.z).toBe(-1);
  });

  it('flip returns this for chaining', () => {
    const vm = new VMobject();
    expect(vm.flip()).toBe(vm);
  });

  // rotate (VMobject with points - 2D Z-axis)
  it('rotate around Z axis transforms VMobject points (2D case)', () => {
    const vm = new VMobject();
    // Use distinct points so the bounding box center is at (0.5, 0.5, 0)
    vm.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    // center is (0.5, 0.5, 0)
    vm.rotate(Math.PI / 2); // 90 degrees around Z
    const pts = vm.getPoints();
    // Point (0,0) relative to center (0.5, 0.5) is (-0.5, -0.5)
    // Rotated 90deg: (0.5, -0.5) => absolute (1.0, 0.0)
    expect(pts[0][0]).toBeCloseTo(1.0, 5);
    expect(pts[0][1]).toBeCloseTo(0.0, 5);
  });

  // rotate with options object and aboutPoint
  it('rotate with aboutPoint option on VMobject', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
      [1, 1, 0],
    ]);
    vm.rotate(Math.PI, { aboutPoint: [0, 0, 0] });
    const pts = vm.getPoints();
    // (1,0) rotated 180 around origin => (-1, 0)
    expect(pts[0][0]).toBeCloseTo(-1, 5);
    expect(pts[0][1]).toBeCloseTo(0, 5);
  });

  // rotate with non-Z axis (3D rotation via quaternion)
  it('rotate around X axis on VMobject uses quaternion path', () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 1, 0],
      [0, 2, 0],
      [0, 2, 1],
      [0, 1, 1],
    ]);
    // Center is (0, 1.5, 0.5)
    // Rotate 90 around X with aboutPoint at origin
    vm.rotate(Math.PI / 2, { axis: [1, 0, 0], aboutPoint: [0, 0, 0] });
    const pts = vm.getPoints();
    // (0,1,0) rotated 90 around X about origin => (0, 0, 1)
    expect(pts[0][1]).toBeCloseTo(0, 5);
    expect(pts[0][2]).toBeCloseTo(1, 5);
  });

  // rotate with axis as array (not options object)
  it('rotate with axis as Vector3Tuple on VMobject', () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 0, 1],
      [1, 0, 1],
      [1, 0, 2],
      [0, 0, 2],
    ]);
    // Center is (0.5, 0, 1.5). Rotate 90 around Y about origin.
    vm.rotate(Math.PI / 2, { axis: [0, 1, 0], aboutPoint: [0, 0, 0] });
    const pts = vm.getPoints();
    // (0,0,1) rotated 90 around Y about origin => (1, 0, 0)
    expect(pts[0][0]).toBeCloseTo(1, 5);
    expect(pts[0][2]).toBeCloseTo(0, 5);
  });

  // rotateAboutOrigin
  it('rotateAboutOrigin rotates VMobject about [0,0,0]', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]);
    vm.rotateAboutOrigin(Math.PI / 2);
    const pts = vm.getPoints();
    expect(pts[0][0]).toBeCloseTo(0, 5);
    expect(pts[0][1]).toBeCloseTo(1, 5);
  });

  // copy
  it('copy creates a deep independent clone', () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    vm.position.set(5, 5, 5);
    vm.setColor('#ff0000');
    vm.setStrokeOpacity(0.5);
    vm.strokeWidth = 8;
    vm.fillOpacity = 0.7;

    const clone = vm.copy() as VMobject;
    expect(clone.position.x).toBe(5);
    expect(clone.color).toBe('#ff0000');
    expect(clone.opacity).toBe(0.5);
    expect(clone.strokeWidth).toBe(8);
    expect(clone.fillOpacity).toBe(0.7);

    // Mutating clone should not affect original
    clone.position.set(0, 0, 0);
    expect(vm.position.x).toBe(5);
  });

  it('copy deep copies children', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.position.set(1, 2, 3);
    parent.add(child);

    const clone = parent.copy() as VMobject;
    expect(clone.children.length).toBe(1);
    expect(clone.children[0]).not.toBe(child);
    expect(clone.children[0].position.x).toBe(1);
  });

  // become
  it('become copies visual properties from another mobject', () => {
    const source = new VMobject();
    source.position.set(10, 20, 30);
    source.setColor('#00ff00');
    source.setStrokeOpacity(0.3);
    source.strokeWidth = 6;
    source.fillOpacity = 0.9;
    source.setPoints([
      [1, 1, 0],
      [2, 2, 0],
      [3, 3, 0],
      [4, 4, 0],
    ]);

    const target = new VMobject();
    target.become(source);

    expect(target.position.x).toBe(10);
    expect(target.position.y).toBe(20);
    expect(target.color).toBe('#00ff00');
    expect(target.opacity).toBe(0.3);
    expect(target.strokeWidth).toBe(6);
    expect(target.fillOpacity).toBe(0.9);
    expect(target.getPoints().length).toBe(4);
    expect(target.getPoints()[0]).toEqual([1, 1, 0]);
  });

  // replace
  it('replace scales and repositions to match target bounding box (uniform)', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    target.scaleVector.set(2, 2, 2);

    const mob = new VMobject();
    mob.replace(target);

    // Should center on target
    const targetCenter = target.getCenter();
    expect(mob.position.x).toBeCloseTo(targetCenter[0]);
    expect(mob.position.y).toBeCloseTo(targetCenter[1]);
  });

  it('replace with stretch=true scales per-axis', () => {
    const target = new VMobject();
    target.position.set(3, 4, 0);

    const mob = new VMobject();
    mob.replace(target, true);

    const targetCenter = target.getCenter();
    expect(mob.position.x).toBeCloseTo(targetCenter[0]);
  });

  // getCenter falls back to position when bounding box is empty
  it('getCenter returns position when bounding box is empty', () => {
    const vm = new VMobject();
    vm.position.set(7, 8, 9);
    const center = vm.getCenter();
    expect(center[0]).toBe(7);
    expect(center[1]).toBe(8);
    expect(center[2]).toBe(9);
  });

  // getBounds fallback (no _threeObject)
  it('getBounds throws when no three object', () => {
    const vm = new VMobject();
    vm.position.set(5, 5, 5);
    // Access bounds without creating three object throws
    expect(() => vm.getBounds()).toThrow(/empty Three\.js bounds/);
  });

  // nextTo with point target
  it('nextTo with Vector3Tuple target positions correctly', () => {
    const vm = new VMobject();
    vm.nextTo([0, 0, 0], RIGHT, 0.5);
    // Should be positioned to the right of origin
    const center = vm.getCenter();
    expect(center[0]).toBeGreaterThanOrEqual(0);
  });

  // nextTo with mobject target
  it('nextTo with Mobject target', () => {
    const target = new VMobject();
    target.position.set(0, 0, 0);
    const mob = new VMobject();
    mob.nextTo(target, RIGHT, 0.5);
    const center = mob.getCenter();
    expect(center[0]).toBeGreaterThanOrEqual(0);
  });

  // alignTo with point
  it('alignTo with Vector3Tuple aligns in direction', () => {
    const vm = new VMobject();
    vm.position.set(1, 1, 0);
    vm.alignTo([5, 5, 0], RIGHT);
    // X should have changed to align right edges
    const center = vm.getCenter();
    expect(center[0]).toBeCloseTo(5);
  });

  // alignTo with mobject
  it('alignTo with Mobject target', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const mob = new VMobject();
    mob.position.set(1, 1, 0);
    mob.alignTo(target, UP);
    const center = mob.getCenter();
    // Y should be aligned
    expect(center[1]).toBeCloseTo(5);
  });

  // moveToAligned
  it('moveToAligned without edge aligns centers', () => {
    const vm = new VMobject();
    vm.position.set(10, 10, 0);
    vm.moveToAligned([0, 0, 0]);
    expect(vm.position.x).toBe(0);
    expect(vm.position.y).toBe(0);
  });

  it('moveToAligned with alignedEdge delegates to alignTo', () => {
    const vm = new VMobject();
    vm.position.set(1, 1, 0);
    vm.moveToAligned([5, 5, 0], LEFT);
    const center = vm.getCenter();
    expect(center[0]).toBeCloseTo(5);
  });

  it('moveToAligned with Mobject target', () => {
    const target = new VMobject();
    target.position.set(3, 3, 0);
    const mob = new VMobject();
    mob.moveToAligned(target);
    const center = mob.getCenter();
    expect(center[0]).toBeCloseTo(3);
    expect(center[1]).toBeCloseTo(3);
  });

  // moveTo with Mobject target
  it('moveTo with Mobject target centers on it', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const mob = new VMobject();
    mob.moveTo(target);
    const targetCenter = target.getCenter();
    expect(mob.position.x).toBeCloseTo(targetCenter[0]);
    expect(mob.position.y).toBeCloseTo(targetCenter[1]);
  });

  // moveTo with Mobject + alignedEdge
  it('moveTo with Mobject and alignedEdge aligns edges', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const mob = new VMobject();
    mob.position.set(0, 0, 0);
    mob.moveTo(target, UL);
    // Should have shifted to align upper-left edges
  });

  // getEdge and convenience getters
  it('getEdge returns edge in direction', () => {
    const vm = new VMobject();
    vm.position.set(0, 0, 0);
    const edge = vm.getEdge(RIGHT);
    expect(edge).toBeDefined();
    expect(edge.length).toBe(3);
  });

  it('getTop returns top edge', () => {
    const vm = new VMobject();
    const top = vm.getTop();
    expect(top).toBeDefined();
    expect(top.length).toBe(3);
  });

  it('getBottom returns bottom edge', () => {
    const vm = new VMobject();
    const bottom = vm.getBottom();
    expect(bottom).toBeDefined();
  });

  it('getLeft returns left edge', () => {
    const vm = new VMobject();
    const left = vm.getLeft();
    expect(left).toBeDefined();
  });

  it('getRight returns right edge', () => {
    const vm = new VMobject();
    const right = vm.getRight();
    expect(right).toBeDefined();
  });

  // setX, setY, setZ
  it('setX sets x coordinate of center', () => {
    const vm = new VMobject();
    vm.setX(5);
    expect(vm.getCenter()[0]).toBeCloseTo(5);
  });

  it('setY sets y coordinate of center', () => {
    const vm = new VMobject();
    vm.setY(3);
    expect(vm.getCenter()[1]).toBeCloseTo(3);
  });

  it('setZ sets z coordinate of center', () => {
    const vm = new VMobject();
    vm.setZ(7);
    expect(vm.getCenter()[2]).toBeCloseTo(7);
  });

  // center
  it('center moves to origin', () => {
    const vm = new VMobject();
    vm.position.set(5, 5, 5);
    vm.center();
    expect(vm.position.x).toBe(0);
    expect(vm.position.y).toBe(0);
    expect(vm.position.z).toBe(0);
  });

  // toEdge
  it('toEdge moves to frame edge', () => {
    const vm = new VMobject();
    vm.toEdge(RIGHT);
    expect(vm.position.x).toBeGreaterThan(0);
  });

  it('toEdge with custom buff', () => {
    const vm = new VMobject();
    vm.toEdge(UP, 1.0);
    expect(vm.position.y).toBeGreaterThan(0);
  });

  // toCorner
  it('toCorner moves to corner of frame', () => {
    const vm = new VMobject();
    vm.toCorner(UR);
    expect(vm.position.x).toBeGreaterThan(0);
    expect(vm.position.y).toBeGreaterThan(0);
  });

  it('toCorner with custom buff', () => {
    const vm = new VMobject();
    vm.toCorner(DL, 1.0);
    expect(vm.position.x).toBeLessThan(0);
    expect(vm.position.y).toBeLessThan(0);
  });

  // applyToFamily
  it('applyToFamily applies function to self and descendants', () => {
    const parent = new VMobject();
    const child = new VMobject();
    const grandchild = new VMobject();
    parent.add(child);
    child.add(grandchild);

    const visited: Mobject[] = [];
    parent.applyToFamily((m) => visited.push(m));
    expect(visited.length).toBe(3);
    expect(visited).toContain(parent);
    expect(visited).toContain(child);
    expect(visited).toContain(grandchild);
  });

  // getFamily
  it('getFamily returns self and all descendants', () => {
    const parent = new VMobject();
    const c1 = new VMobject();
    const c2 = new VMobject();
    const gc = new VMobject();
    parent.add(c1, c2);
    c1.add(gc);

    const family = parent.getFamily();
    expect(family.length).toBe(4);
    expect(family).toContain(parent);
    expect(family).toContain(gc);
  });

  // Updaters
  it('addUpdater adds and hasUpdaters returns true', () => {
    const vm = new VMobject();
    expect(vm.hasUpdaters()).toBe(false);
    const fn = () => {};
    vm.addUpdater(fn);
    expect(vm.hasUpdaters()).toBe(true);
  });

  it('addUpdater with callOnAdd=true calls immediately', () => {
    const vm = new VMobject();
    let called = false;
    vm.addUpdater(() => {
      called = true;
    }, true);
    expect(called).toBe(true);
  });

  it('removeUpdater removes the specified updater', () => {
    const vm = new VMobject();
    const fn = () => {};
    vm.addUpdater(fn);
    vm.removeUpdater(fn);
    expect(vm.hasUpdaters()).toBe(false);
  });

  it('removeUpdater of non-existent updater is no-op', () => {
    const vm = new VMobject();
    const fn1 = () => {};
    const fn2 = () => {};
    vm.addUpdater(fn1);
    vm.removeUpdater(fn2);
    expect(vm.hasUpdaters()).toBe(true);
  });

  it('clearUpdaters removes all updaters', () => {
    const vm = new VMobject();
    vm.addUpdater(() => {});
    vm.addUpdater(() => {});
    vm.clearUpdaters();
    expect(vm.hasUpdaters()).toBe(false);
  });

  it('getUpdaters returns a copy of updaters', () => {
    const vm = new VMobject();
    const fn = () => {};
    vm.addUpdater(fn);
    const updaters = vm.getUpdaters();
    expect(updaters).toContain(fn);
    updaters.push(() => {}); // modifying copy
    expect(vm.getUpdaters().length).toBe(1); // original unchanged
  });

  it('update runs all updaters and children updaters', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);

    let parentCalled = false;
    let childCalled = false;
    parent.addUpdater(() => {
      parentCalled = true;
    });
    child.addUpdater(() => {
      childCalled = true;
    });

    parent.update(0.016);
    expect(parentCalled).toBe(true);
    expect(childCalled).toBe(true);
  });

  // applyFunction
  it('applyFunction transforms VMobject points', () => {
    const vm = new VMobject();
    vm.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    vm.applyFunction((p) => [p[0] * 2, p[1], p[2]]);
    const pts = vm.getPoints();
    expect(pts[0][0]).toBe(2);
    expect(pts[1][0]).toBe(4);
    expect(pts[2][0]).toBe(6);
    expect(pts[3][0]).toBe(8);
  });

  it('applyFunction works on nested VMobjects', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.setPoints([
      [1, 2, 0],
      [3, 4, 0],
      [5, 6, 0],
      [7, 8, 0],
    ]);
    parent.add(child);
    parent.applyFunction((p) => [p[0] + 10, p[1] + 10, p[2]]);
    const pts = child.getPoints();
    expect(pts[0][0]).toBe(11);
    expect(pts[0][1]).toBe(12);
  });

  // _markDirtyUpward
  it('_markDirtyUpward propagates dirty flag to ancestors', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);
    parent._dirty = false;
    child._dirty = false;
    child._markDirtyUpward();
    expect(child._dirty).toBe(true);
    expect(parent._dirty).toBe(true);
  });

  it('_markDirtyUpward short-circuits when already dirty', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);
    child._dirty = true;
    parent._dirty = false;
    child._markDirtyUpward(); // already dirty, should not propagate
    expect(parent._dirty).toBe(false);
  });

  // isDirty
  it('isDirty returns current dirty state', () => {
    const vm = new VMobject();
    expect(vm.isDirty).toBe(true); // starts dirty
    vm._dirty = false;
    expect(vm.isDirty).toBe(false);
  });

  // generateTarget
  it('generateTarget creates a copy on targetCopy', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm.setColor('#ff0000');
    const target = vm.generateTarget();
    expect(vm.targetCopy).toBe(target);
    expect(target.position.x).toBe(1);
    expect(target.color).toBe('#ff0000');
    // modifying target should not affect original
    target.position.set(99, 99, 99);
    expect(vm.position.x).toBe(1);
  });

  // saveState and restoreState
  it('saveState stores and restoreState restores', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm.setColor('#ff0000');
    vm.setStrokeOpacity(0.5);
    vm.strokeWidth = 8;
    vm.fillOpacity = 0.7;
    vm.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    vm.saveState();

    // Modify
    vm.position.set(99, 99, 99);
    vm.setColor('#0000ff');
    vm.setStrokeOpacity(1);
    vm.strokeWidth = 2;
    vm.fillOpacity = 0;
    vm.setPoints([[10, 10, 0]]);

    const restored = vm.restoreState();
    expect(restored).toBe(true);
    expect(vm.position.x).toBe(1);
    expect(vm.position.y).toBe(2);
    expect(vm.color).toBe('#ff0000');
    expect(vm.opacity).toBe(0.5);
    expect(vm.strokeWidth).toBe(8);
    expect(vm.fillOpacity).toBe(0.7);
    expect(vm.getPoints().length).toBe(4);
  });

  it('restoreState returns false when no saved state', () => {
    const vm = new VMobject();
    expect(vm.restoreState()).toBe(false);
  });

  it('saveState also stores __savedMobjectState', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm.saveState();
    expect(vm.__savedMobjectState).toBeDefined();
    const state = vm.__savedMobjectState as Record<string, unknown>;
    expect(state.position).toEqual([1, 2, 3]);
  });

  it('restoreState recursively restores children', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.position.set(5, 6, 7);
    parent.add(child);
    parent.saveState();

    child.position.set(0, 0, 0);
    parent.restoreState();
    expect(child.position.x).toBe(5);
    expect(child.position.y).toBe(6);
  });

  // dispose
  it('dispose cleans up without error', () => {
    const vm = new VMobject();
    const child = new VMobject();
    vm.add(child);
    expect(() => vm.dispose()).not.toThrow();
  });

  // _syncToThree
  it('_syncToThree creates three object and syncs', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm._syncToThree();
    expect(vm._threeObject).toBeDefined();
    expect(vm._dirty).toBe(false);
  });

  it('_syncToThree skips when not dirty', () => {
    const vm = new VMobject();
    vm._syncToThree();
    vm._dirty = false;
    const obj = vm._threeObject;
    vm._syncToThree(); // should be no-op
    expect(vm._threeObject).toBe(obj);
  });

  // getThreeObject
  it('getThreeObject creates and syncs', () => {
    const vm = new VMobject();
    const obj = vm.getThreeObject();
    expect(obj).toBeDefined();
    expect(vm._dirty).toBe(false);
  });

  // prepareForNonlinearTransform
  it('prepareForNonlinearTransform subdivides cubic segments', () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 0, 0],
      [1, 1, 0],
      [2, 1, 0],
      [3, 0, 0],
    ]);
    const originalCount = vm.numPoints;
    vm.prepareForNonlinearTransform(4);
    expect(vm.numPoints).toBeGreaterThan(originalCount);
  });

  it('prepareForNonlinearTransform skips with fewer than 4 points', () => {
    const vm = new VMobject();
    vm.setPoints([
      [0, 0, 0],
      [1, 1, 0],
    ]);
    vm.prepareForNonlinearTransform();
    expect(vm.numPoints).toBe(2); // unchanged
  });
});
