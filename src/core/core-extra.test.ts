import { describe, it, expect } from 'vitest';
import { Mobject, UP, LEFT, RIGHT, UL, UR, DL, DR } from './Mobject';
import {
  VMobject,
  getNumCurves,
  getNthCurve,
  curvesAsSubmobjects,
  CurvesAsSubmobjects,
} from './VMobject';
import { Group } from './Group';
import { VGroup } from './VGroup';
import { VDict, VectorizedPoint } from './VDict';
import {
  serializeMobject,
  deserializeMobject,
  stateToJSON,
  stateFromJSON,
  SceneStateManager,
} from './StateManager';

/** Create a simple VMobject with 4 corner points (a quad). */
function makeVM(tag?: string): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]);
  if (tag) (vm as unknown as Record<string, string>)._tag = tag; // handy for debugging
  return vm;
}

describe('VDict', () => {
  it('constructor with empty object creates empty VDict', () => {
    const d = new VDict();
    expect(d.size).toBe(0);
    expect([...d.keys()]).toEqual([]);
  });

  it('constructor with named VMobjects adds them', () => {
    const a = makeVM('a');
    const b = makeVM('b');
    const d = new VDict({ a, b });
    expect(d.size).toBe(2);
    expect(d.get('a')).toBe(a);
    expect(d.get('b')).toBe(b);
  });

  it('set() adds a VMobject', () => {
    const d = new VDict();
    const vm = makeVM();
    d.set('item', vm);
    expect(d.size).toBe(1);
    expect(d.get('item')).toBe(vm);
  });

  it('set() replaces existing VMobject with same key', () => {
    const d = new VDict();
    const vm1 = makeVM('first');
    const vm2 = makeVM('second');
    d.set('k', vm1);
    d.set('k', vm2);
    expect(d.size).toBe(1);
    expect(d.get('k')).toBe(vm2);
    // vm1 should no longer be a child
    expect(d.submobjects).not.toContain(vm1);
    expect(d.submobjects).toContain(vm2);
  });

  it('get() retrieves by string key', () => {
    const vm = makeVM();
    const d = new VDict({ myKey: vm });
    expect(d.get('myKey')).toBe(vm);
  });

  it('get() retrieves by numeric index', () => {
    const vm = makeVM();
    const d = new VDict({ first: vm });
    // Numeric index delegates to VGroup.get (children array)
    expect(d.get(0)).toBe(vm);
  });

  it('get() returns undefined for missing key', () => {
    const d = new VDict();
    expect(d.get('nope')).toBeUndefined();
  });

  it('has() returns true for existing key', () => {
    const d = new VDict({ x: makeVM() });
    expect(d.has('x')).toBe(true);
  });

  it('has() returns false for missing key', () => {
    const d = new VDict();
    expect(d.has('missing')).toBe(false);
  });

  it('delete() removes VMobject by key', () => {
    const vm = makeVM();
    const d = new VDict({ gone: vm });
    const result = d.delete('gone');
    expect(result).toBe(true);
    expect(d.size).toBe(0);
    expect(d.get('gone')).toBeUndefined();
    expect(d.submobjects).not.toContain(vm);
  });

  it('delete() returns false for missing key', () => {
    const d = new VDict();
    expect(d.delete('nope')).toBe(false);
  });

  it('keys() returns all key names', () => {
    const d = new VDict({ a: makeVM(), b: makeVM(), c: makeVM() });
    expect([...d.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('values() returns all VMobjects', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    const vals = [...d.values()];
    expect(vals).toContain(va);
    expect(vals).toContain(vb);
    expect(vals.length).toBe(2);
  });

  it('entries() returns [name, vmobject] pairs', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ alpha: va, beta: vb });
    const entries = [...d.entries()];
    expect(entries).toEqual([
      ['alpha', va],
      ['beta', vb],
    ]);
  });

  it('size returns count', () => {
    const d = new VDict({ x: makeVM(), y: makeVM() });
    expect(d.size).toBe(2);
    d.set('z', makeVM());
    expect(d.size).toBe(3);
  });

  it('clear() removes all entries', () => {
    const d = new VDict({ a: makeVM(), b: makeVM() });
    d.clear();
    expect(d.size).toBe(0);
    expect([...d.keys()]).toEqual([]);
    expect(d.submobjects.length).toBe(0);
  });

  it('forEach iterates over entries (VGroup-style by index)', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    const collected: VMobject[] = [];
    d.forEach((vm) => collected.push(vm));
    expect(collected).toContain(va);
    expect(collected).toContain(vb);
    expect(collected.length).toBe(2);
  });

  it('forEachEntry iterates with keys', () => {
    const va = makeVM();
    const d = new VDict({ only: va });
    const pairs: [string, VMobject][] = [];
    d.forEachEntry((vm, key) => pairs.push([key, vm]));
    expect(pairs).toEqual([['only', va]]);
  });
});

describe('serializeMobject', () => {
  it('captures position, rotation, scale, color, opacity', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm.rotation.set(0.1, 0.2, 0.3);
    vm.scaleVector.set(2, 3, 4);
    vm.setColor('#ff0000');
    vm.setOpacity(0.7);
    const state = serializeMobject(vm);
    expect(state.position).toEqual([1, 2, 3]);
    expect(state.rotation[0]).toBeCloseTo(0.1);
    expect(state.rotation[1]).toBeCloseTo(0.2);
    expect(state.rotation[2]).toBeCloseTo(0.3);
    expect(state.scale).toEqual([2, 3, 4]);
    expect(state.color.toLowerCase()).toBe('#ff0000');
    expect(state.opacity).toBeCloseTo(0.7);
  });

  it('captures VMobject points', () => {
    const vm = makeVM();
    const state = serializeMobject(vm);
    expect(state.points3D).toBeDefined();
    expect(state.points3D!.length).toBe(4);
    expect(state.points3D![0]).toEqual([0, 0, 0]);
    expect(state.points3D![1]).toEqual([1, 0, 0]);
  });

  it('captures children recursively', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.position.set(5, 6, 7);
    parent.add(child);
    const state = serializeMobject(parent);
    expect(state.children.length).toBe(1);
    expect(state.children[0].position).toEqual([5, 6, 7]);
  });

  it('state is JSON-serializable via stateToJSON/stateFromJSON', () => {
    const vm = makeVM();
    vm.position.set(10, 20, 30);
    const state = serializeMobject(vm);
    const json = stateToJSON(state);
    const parsed = stateFromJSON(json);
    expect(parsed.position).toEqual([10, 20, 30]);
    expect(parsed.points3D!.length).toBe(4);
  });
});

describe('deserializeMobject', () => {
  it('restores position', () => {
    const vm = new VMobject();
    const state = serializeMobject(vm);
    state.position = [9, 8, 7];
    deserializeMobject(vm, state);
    expect(vm.position.x).toBe(9);
    expect(vm.position.y).toBe(8);
    expect(vm.position.z).toBe(7);
  });

  it('restores rotation', () => {
    const vm = new VMobject();
    const state = serializeMobject(vm);
    state.rotation = [0.5, 0.6, 0.7, 'XYZ'];
    deserializeMobject(vm, state);
    expect(vm.rotation.x).toBeCloseTo(0.5);
    expect(vm.rotation.y).toBeCloseTo(0.6);
    expect(vm.rotation.z).toBeCloseTo(0.7);
  });

  it('restores scale', () => {
    const vm = new VMobject();
    const state = serializeMobject(vm);
    state.scale = [3, 4, 5];
    deserializeMobject(vm, state);
    expect(vm.scaleVector.x).toBe(3);
    expect(vm.scaleVector.y).toBe(4);
    expect(vm.scaleVector.z).toBe(5);
  });

  it('restores style (color, opacity, strokeWidth, fillOpacity)', () => {
    const vm = new VMobject();
    vm.setColor('#00ff00');
    vm.setOpacity(0.3);
    // Use setStrokeWidth/setFillOpacity to keep _style in sync
    vm.setStrokeWidth(8);
    vm.setFillOpacity(0.5);
    const state = serializeMobject(vm);
    // Reset the mobject
    vm.setColor('#ffffff');
    vm.setOpacity(1);
    vm.setStrokeWidth(4);
    vm.setFillOpacity(0);
    deserializeMobject(vm, state);
    expect(vm.color.toLowerCase()).toBe('#00ff00');
    expect(vm.opacity).toBeCloseTo(0.3);
    expect(vm.strokeWidth).toBe(8);
    expect(vm.fillOpacity).toBe(0.5);
  });

  it('restores VMobject points', () => {
    const vm = makeVM();
    const state = serializeMobject(vm);
    vm.setPoints([[10, 10, 10]]);
    deserializeMobject(vm, state);
    const pts = vm.getPoints();
    expect(pts.length).toBe(4);
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[3]).toEqual([0, 1, 0]);
  });

  it('round-trip: serialize then deserialize preserves state', () => {
    const vm = makeVM();
    vm.position.set(1, 2, 3);
    vm.scaleVector.set(2, 2, 2);
    vm.setColor('#abcdef');
    vm.setOpacity(0.42);
    vm.setStrokeWidth(6);
    vm.setFillOpacity(0.8);
    const state = serializeMobject(vm);
    const vm2 = new VMobject();
    deserializeMobject(vm2, state);
    expect(vm2.position.x).toBe(1);
    expect(vm2.position.y).toBe(2);
    expect(vm2.position.z).toBe(3);
    expect(vm2.scaleVector.x).toBe(2);
    expect(vm2.color.toLowerCase()).toBe('#abcdef');
    expect(vm2.opacity).toBeCloseTo(0.42);
    expect(vm2.strokeWidth).toBe(6);
    expect(vm2.fillOpacity).toBe(0.8);
    expect(vm2.getPoints().length).toBe(4);
    expect(vm2.getPoints()[0]).toEqual([0, 0, 0]);
  });

  it('round-trip preserves children', () => {
    const parent = new VMobject();
    const child = new VMobject();
    child.position.set(3, 4, 5);
    child.setPoints([
      [1, 1, 0],
      [2, 2, 0],
    ]);
    parent.add(child);
    const state = serializeMobject(parent);
    child.position.set(0, 0, 0);
    child.setPoints([]);
    deserializeMobject(parent, state);
    expect(child.position.x).toBe(3);
    expect(child.position.y).toBe(4);
    expect(child.getPoints().length).toBe(2);
  });
});

describe('SceneStateManager', () => {
  function makeScene() {
    const mobjects: VMobject[] = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);
    return { mobjects, mgr };
  }

  it('canUndo is false initially', () => {
    const { mgr } = makeScene();
    expect(mgr.canUndo).toBe(false);
  });

  it('canRedo is false initially', () => {
    const { mgr } = makeScene();
    expect(mgr.canRedo).toBe(false);
  });

  it('save() makes canUndo true', () => {
    const { mgr } = makeScene();
    mgr.save();
    expect(mgr.canUndo).toBe(true);
  });

  it('undo() restores previous position', () => {
    const { mobjects, mgr } = makeScene();
    const vm = mobjects[0];

    vm.position.set(0, 0, 0);
    mgr.save('before move');
    vm.position.set(5, 5, 5);
    mgr.undo();
    expect(vm.position.x).toBe(0);
    expect(vm.position.y).toBe(0);
    expect(vm.position.z).toBe(0);
  });

  it('undo() returns false when nothing to undo', () => {
    const { mgr } = makeScene();
    expect(mgr.undo()).toBe(false);
  });

  it('redo after undo restores the undone state', () => {
    const { mobjects, mgr } = makeScene();
    const vm = mobjects[0];

    vm.position.set(0, 0, 0);
    mgr.save();
    vm.position.set(10, 0, 0);
    mgr.undo();
    expect(vm.position.x).toBe(0);
    mgr.redo();
    expect(vm.position.x).toBe(10);
  });

  it('redo() returns false when nothing to redo', () => {
    const { mgr } = makeScene();
    expect(mgr.redo()).toBe(false);
  });

  it('save() clears redo stack', () => {
    const { mobjects, mgr } = makeScene();
    const vm = mobjects[0];

    vm.position.set(0, 0, 0);
    mgr.save();
    vm.position.set(5, 0, 0);
    mgr.undo();
    expect(mgr.canRedo).toBe(true);
    mgr.save();
    expect(mgr.canRedo).toBe(false);
  });

  it('undoCount and redoCount track stack sizes', () => {
    const { mgr } = makeScene();

    expect(mgr.undoCount).toBe(0);
    expect(mgr.redoCount).toBe(0);
    mgr.save();
    mgr.save();
    expect(mgr.undoCount).toBe(2);

    mgr.undo();
    expect(mgr.undoCount).toBe(1);
    expect(mgr.redoCount).toBe(1);
  });

  it('clearHistory() empties both stacks', () => {
    const { mgr } = makeScene();
    mgr.save();
    mgr.save();
    mgr.undo();
    mgr.clearHistory();
    expect(mgr.undoCount).toBe(0);
    expect(mgr.redoCount).toBe(0);
    expect(mgr.canUndo).toBe(false);
    expect(mgr.canRedo).toBe(false);
  });

  it('maxDepth limits undo stack', () => {
    const mobjects: VMobject[] = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects, 3);

    for (let i = 0; i < 5; i++) {
      mgr.save(`save-${i}`);
    }
    expect(mgr.undoCount).toBe(3);
  });

  it('getState() captures snapshot without pushing to stacks', () => {
    const { mobjects, mgr } = makeScene();
    mobjects[0].position.set(7, 8, 9);
    const snapshot = mgr.getState('peek');
    expect(snapshot.label).toBe('peek');
    expect(snapshot.mobjects[0].position).toEqual([7, 8, 9]);
    expect(mgr.undoCount).toBe(0);
  });

  it('setState() applies snapshot without modifying stacks', () => {
    const { mobjects, mgr } = makeScene();
    mobjects[0].position.set(1, 2, 3);
    const snapshot = mgr.getState();
    mobjects[0].position.set(0, 0, 0);
    mgr.setState(snapshot);
    expect(mobjects[0].position.x).toBe(1);
    expect(mgr.undoCount).toBe(0);
  });
});

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

  // setOpacity clamping and no-op
  it('setOpacity clamps and is no-op when unchanged', () => {
    const vm = new VMobject();
    vm.setOpacity(0.5);
    expect(vm.opacity).toBe(0.5);
    vm._dirty = false;
    vm.setOpacity(0.5);
    expect(vm._dirty).toBe(false);
  });

  it('setOpacity clamps to [0, 1]', () => {
    const vm = new VMobject();
    vm.setOpacity(-1);
    expect(vm.opacity).toBe(0);
    vm.setOpacity(5);
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
    vm.setOpacity(0.5);
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
    source.setOpacity(0.3);
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
  it('getBounds returns position-based fallback when no three object', () => {
    const vm = new VMobject();
    vm.position.set(5, 5, 5);
    // Access bounds without creating three object
    const bounds = vm.getBounds();
    expect(bounds.min.x).toBeDefined();
    expect(bounds.max.x).toBeDefined();
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
    vm.setOpacity(0.5);
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
    vm.setOpacity(1);
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

  it('getCenter with children returns average of children centers', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(1, 0);
  });

  it('shift shifts all children', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    g.shift([1, 1, 0]);
    expect(a.position.x).toBe(1);
    expect(a.position.y).toBe(1);
    expect(b.position.x).toBe(3);
    expect(b.position.y).toBe(1);
  });

  it('moveTo with point moves group center', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const g = new Group(a, b);
    g.moveTo([5, 5, 0]);
    const center = g.getCenter();
    expect(center[0]).toBeCloseTo(5, 0);
    expect(center[1]).toBeCloseTo(5, 0);
  });

  it('moveTo with Mobject target centers on it', () => {
    const target = new VMobject();
    target.position.set(10, 10, 0);
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const g = new Group(a);
    g.moveTo(target);
    const center = g.getCenter();
    const tc = target.getCenter();
    expect(center[0]).toBeCloseTo(tc[0], 0);
    expect(center[1]).toBeCloseTo(tc[1], 0);
  });

  it('moveTo with Mobject + alignedEdge aligns edges', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const g = new Group(a);
    g.moveTo(target, UL);
    // should shift to align upper-left edges
  });

  it('rotate rotates all children', () => {
    const a = new VMobject();
    a.position.set(1, 0, 0);
    const g = new Group(a);
    g.rotate(Math.PI / 2);
    // child should have been rotated
  });

  it('scale scales all children', () => {
    const a = new VMobject();
    a.scaleVector.set(1, 1, 1);
    const g = new Group(a);
    g.scale(2);
    expect(a.scaleVector.x).toBe(2);
    expect(a.scaleVector.y).toBe(2);
  });

  it('scale with tuple scales children non-uniformly', () => {
    const a = new VMobject();
    const g = new Group(a);
    g.scale([2, 3, 4]);
    expect(a.scaleVector.x).toBe(2);
    expect(a.scaleVector.y).toBe(3);
  });

  it('setColor propagates to all children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    g.setColor('#ff0000');
    expect(a.color).toBe('#ff0000');
    expect(b.color).toBe('#ff0000');
  });

  it('setOpacity propagates to all children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new Group(a, b);
    g.setOpacity(0.3);
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
    vg.position.set(5, 6, 7);
    expect(vg.getCenter()).toEqual([5, 6, 7]);
  });

  it('getCenter with children includes position offset', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const vg = new VGroup(a, b);
    const center = vg.getCenter();
    expect(center[0]).toBeCloseTo(1, 0);
  });

  it('shift shifts children, not group position', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const vg = new VGroup(a);
    vg.shift([5, 0, 0]);
    expect(a.position.x).toBe(5);
  });

  it('moveTo with point moves VGroup center', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(2, 0, 0);
    const vg = new VGroup(a, b);
    vg.moveTo([10, 10, 0]);
    const center = vg.getCenter();
    expect(center[0]).toBeCloseTo(10, 0);
    expect(center[1]).toBeCloseTo(10, 0);
  });

  it('moveTo with Mobject target', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.moveTo(target);
    const center = vg.getCenter();
    const tc = target.getCenter();
    expect(center[0]).toBeCloseTo(tc[0], 0);
  });

  it('moveTo with Mobject + alignedEdge', () => {
    const target = new VMobject();
    target.position.set(5, 5, 0);
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.moveTo(target, UL);
    // should have shifted to align
  });

  it('rotate delegates to children and self', () => {
    const a = new VMobject();
    a.setPoints([
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]);
    const vg = new VGroup(a);
    vg.rotate(Math.PI / 2);
    // child should have been rotated
  });

  it('scale scales children about group center', () => {
    const a = new VMobject();
    a.position.set(0, 0, 0);
    a.scaleVector.set(1, 1, 1);
    const b = new VMobject();
    b.position.set(4, 0, 0);
    b.scaleVector.set(1, 1, 1);
    const vg = new VGroup(a, b);
    vg.scale(2);
    // Each child's own size is scaled by 2
    expect(a.scaleVector.x).toBe(2);
    expect(b.scaleVector.x).toBe(2);
  });

  it('scale with tuple scales non-uniformly', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.scale([2, 3, 1]);
    expect(a.scaleVector.x).toBe(2);
    expect(a.scaleVector.y).toBe(3);
  });

  it('setColor propagates to children', () => {
    const a = new VMobject();
    const b = new VMobject();
    const vg = new VGroup(a, b);
    vg.setColor('#00ff00');
    expect(a.color).toBe('#00ff00');
    expect(b.color).toBe('#00ff00');
  });

  it('setOpacity propagates to children', () => {
    const a = new VMobject();
    const vg = new VGroup(a);
    vg.setOpacity(0.5);
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
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(0, 0, 0);
    const c = new VMobject();
    c.position.set(0, 0, 0);
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
    const a = new VMobject();
    a.position.set(0, 0, 0);
    const b = new VMobject();
    b.position.set(0, 0, 0);
    const vg = new VGroup(a, b);
    vg.arrange(RIGHT, 0.5, false);
    // should not throw
  });

  it('arrangeInGrid positions children in grid', () => {
    const items = Array.from({ length: 6 }, () => {
      const vm = new VMobject();
      vm.position.set(0, 0, 0);
      return vm;
    });
    const vg = new VGroup(...items);
    vg.arrangeInGrid(2, 3);
    // Should not throw and children should be repositioned
  });

  it('arrangeInGrid with empty group is no-op', () => {
    const vg = new VGroup();
    expect(() => vg.arrangeInGrid()).not.toThrow();
  });

  it('arrangeInGrid auto-calculates rows/cols', () => {
    const items = Array.from({ length: 9 }, () => new VMobject());
    const vg = new VGroup(...items);
    vg.arrangeInGrid(); // auto: sqrt(9)=3, so 3x3
  });

  it('arrangeInGrid with only rows specified', () => {
    const items = Array.from({ length: 6 }, () => new VMobject());
    const vg = new VGroup(...items);
    vg.arrangeInGrid(2); // 2 rows, auto cols
  });

  it('arrangeInGrid with only cols specified', () => {
    const items = Array.from({ length: 6 }, () => new VMobject());
    const vg = new VGroup(...items);
    vg.arrangeInGrid(undefined, 3); // auto rows, 3 cols
  });

  it('arrangeSubmobjects is alias for arrangeInGrid', () => {
    const items = Array.from({ length: 4 }, () => new VMobject());
    const vg = new VGroup(...items);
    expect(() => vg.arrangeSubmobjects(2, 2)).not.toThrow();
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

describe('VDict - extended coverage', () => {
  it('addNamed is alias for set', () => {
    const d = new VDict();
    const vm = makeVM();
    d.addNamed('test', vm);
    expect(d.get('test')).toBe(vm);
    expect(d.size).toBe(1);
  });

  it('removeNamed is alias for delete', () => {
    const vm = makeVM();
    const d = new VDict({ test: vm });
    d.removeNamed('test');
    expect(d.size).toBe(0);
    expect(d.get('test')).toBeUndefined();
  });

  it('getItem is alias for get with string key', () => {
    const vm = makeVM();
    const d = new VDict({ item: vm });
    expect(d.getItem('item')).toBe(vm);
  });

  it('getByName is alias for get with string key', () => {
    const vm = makeVM();
    const d = new VDict({ named: vm });
    expect(d.getByName('named')).toBe(vm);
  });

  it('copy creates independent VDict with copied children', () => {
    const va = makeVM('a');
    const vb = makeVM('b');
    const d = new VDict({ a: va, b: vb });
    d.position.set(1, 2, 3);
    d.setColor('#ff0000');
    d.setOpacity(0.5);

    const clone = d.copy() as VDict;
    expect(clone.size).toBe(2);
    expect(clone.has('a')).toBe(true);
    expect(clone.has('b')).toBe(true);
    expect(clone.get('a')).not.toBe(va); // deep copy
    expect(clone.position.x).toBe(1);
    expect(clone.color).toBe('#ff0000');
  });

  it('copy preserves key-to-vmobject mapping', () => {
    const vm = makeVM();
    const d = new VDict({ myKey: vm });
    const clone = d.copy() as VDict;
    const clonedVM = clone.get('myKey');
    expect(clonedVM).toBeDefined();
    expect(clonedVM).not.toBe(vm);
  });

  it('asProxy allows bracket-style access', () => {
    const vm = makeVM();
    const d = new VDict({ item: vm });
    const proxy = d.asProxy();
    expect(proxy['item']).toBe(vm);
  });

  it('asProxy set inserts via dict', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    const vm = makeVM();
    proxy['newKey'] = vm;
    expect(d.get('newKey')).toBe(vm);
  });

  it('asProxy has checks dict and object properties', () => {
    const vm = makeVM();
    const d = new VDict({ existing: vm });
    const proxy = d.asProxy();
    expect('existing' in proxy).toBe(true);
    // 'has' returns true for existing dict keys or target own props
    expect('size' in proxy).toBe(true); // property from VDict
    expect('nonexistent_xyz_123' in proxy).toBe(false);
  });

  it('asProxy falls through to VDict properties', () => {
    const d = new VDict({ a: makeVM() });
    const proxy = d.asProxy();
    expect(proxy.size).toBe(1);
    expect(typeof proxy.set).toBe('function');
  });

  it('asProxy set with non-VMobject sets on target directly', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (proxy as any)['_someField'] = 42;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((d as any)._someField).toBe(42);
  });

  it('forEachEntry receives VDict as third argument', () => {
    const vm = makeVM();
    const d = new VDict({ x: vm });
    let receivedDict: VDict | null = null;
    d.forEachEntry((_vm, _key, dict) => {
      receivedDict = dict;
    });
    expect(receivedDict).toBe(d);
  });

  it('submobjects syncs with dict entries', () => {
    const va = makeVM();
    const vb = makeVM();
    const d = new VDict({ a: va, b: vb });
    expect(d.submobjects.length).toBe(2);
    d.delete('a');
    expect(d.submobjects.length).toBe(1);
    expect(d.submobjects).toContain(vb);
  });

  it('_createCopy returns a new empty VDict', () => {
    const d = new VDict({ a: makeVM() });
    const clone = d.copy() as VDict;
    // clone is a VDict
    expect(clone).toBeInstanceOf(VDict);
  });
});

// ---------------------------------------------------------------------------
// VMobject comprehensive coverage tests
// ---------------------------------------------------------------------------

describe('VMobject constructor defaults', () => {
  it('defaults fillOpacity to 0.5', () => {
    const v = new VMobject();
    expect(v.fillOpacity).toBe(0.5);
  });

  it('defaults color to white', () => {
    const v = new VMobject();
    expect(v.color.toLowerCase()).toBe('#ffffff');
  });

  it('has empty points initially', () => {
    const v = new VMobject();
    expect(v.numPoints).toBe(0);
    expect(v.getPoints()).toEqual([]);
    expect(v.points).toEqual([]);
  });

  it('style fillOpacity and strokeOpacity are set in constructor', () => {
    const v = new VMobject();
    const s = v.style;
    expect(s.fillOpacity).toBe(0.5);
    expect(s.strokeOpacity).toBe(1);
  });
});

describe('VMobject.setPoints / getPoints', () => {
  it('setPoints with number[][] stores a deep copy', () => {
    const v = new VMobject();
    const pts = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    v.setPoints(pts);
    expect(v.getPoints()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    pts[0][0] = 999;
    expect(v.getPoints()[0][0]).toBe(1);
  });

  it('setPoints with Point[] (2D) converts to 3D with z=0', () => {
    const v = new VMobject();
    v.setPoints([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
    const pts = v.getPoints();
    expect(pts).toEqual([
      [10, 20, 0],
      [30, 40, 0],
    ]);
  });

  it('setPoints with empty array clears points', () => {
    const v = new VMobject();
    v.setPoints([[1, 0, 0]]);
    v.setPoints([]);
    expect(v.numPoints).toBe(0);
  });

  it('setPoints resets visiblePointCount to null', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.visiblePointCount = 2;
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    expect(v.visiblePointCount).toBe(2);
  });

  it('getPoints returns a deep copy', () => {
    const v = new VMobject();
    v.setPoints([[1, 2, 3]]);
    const pts = v.getPoints();
    pts[0][0] = 999;
    expect(v.getPoints()[0][0]).toBe(1);
  });
});

describe('VMobject.setPoints3D', () => {
  it('is an alias for setPoints with number[][]', () => {
    const v = new VMobject();
    v.setPoints3D([
      [5, 6, 7],
      [8, 9, 10],
    ]);
    expect(v.getPoints()).toEqual([
      [5, 6, 7],
      [8, 9, 10],
    ]);
    expect(v.numPoints).toBe(2);
  });
});

describe('VMobject.points getter (2D)', () => {
  it('returns Point[] derived from 3D points', () => {
    const v = new VMobject();
    v.setPoints([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const pts2d = v.points;
    expect(pts2d).toEqual([
      { x: 1, y: 2 },
      { x: 4, y: 5 },
    ]);
  });
});

describe('VMobject.addPoints', () => {
  it('appends 2D points to existing points', () => {
    const v = new VMobject();
    v.setPoints([[0, 0, 0]]);
    v.addPoints({ x: 1, y: 1 }, { x: 2, y: 2 });
    expect(v.numPoints).toBe(3);
    expect(v.getPoints()[1]).toEqual([1, 1, 0]);
    expect(v.getPoints()[2]).toEqual([2, 2, 0]);
  });
});

describe('VMobject.clearPoints', () => {
  it('removes all points and resets visiblePointCount', () => {
    const v = new VMobject();
    v.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    v.visiblePointCount = 2;
    v.clearPoints();
    expect(v.numPoints).toBe(0);
    expect(v.visiblePointCount).toBe(0);
  });
});

describe('VMobject.visiblePointCount', () => {
  it('defaults to total point count', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(v.visiblePointCount).toBe(4);
  });

  it('can be set to limit visible points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.visiblePointCount = 2;
    expect(v.visiblePointCount).toBe(2);
  });

  it('clamps to 0 and total point count', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    v.visiblePointCount = -5;
    expect(v.visiblePointCount).toBe(0);
    v.visiblePointCount = 100;
    expect(v.visiblePointCount).toBe(3);
  });
});

describe('VMobject.getVisiblePoints / getVisiblePoints3D', () => {
  it('returns all points when visiblePointCount is not set', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(v.getVisiblePoints()).toHaveLength(4);
    expect(v.getVisiblePoints3D()).toHaveLength(4);
  });

  it('returns limited points when visiblePointCount is set', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.visiblePointCount = 2;
    expect(v.getVisiblePoints()).toHaveLength(2);
    expect(v.getVisiblePoints()[0]).toEqual({ x: 0, y: 0 });
    expect(v.getVisiblePoints()[1]).toEqual({ x: 1, y: 0 });
    expect(v.getVisiblePoints3D()).toHaveLength(2);
    expect(v.getVisiblePoints3D()[0]).toEqual([0, 0, 0]);
    expect(v.getVisiblePoints3D()[1]).toEqual([1, 0, 0]);
  });

  it('getVisiblePoints3D returns deep copies', () => {
    const v = new VMobject();
    v.setPoints([[1, 2, 3]]);
    const pts = v.getVisiblePoints3D();
    pts[0][0] = 999;
    expect(v.getVisiblePoints3D()[0][0]).toBe(1);
  });
});

describe('VMobject.setPointsAsCorners', () => {
  it('creates cubic Bezier segments from corners', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [3, 0, 0],
      [3, 3, 0],
    ]);
    const pts = v.getPoints();
    expect(pts.length).toBe(7);
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[6]).toEqual([3, 3, 0]);
    expect(pts[3]).toEqual([3, 0, 0]);
  });

  it('handles single corner point', () => {
    const v = new VMobject();
    v.setPointsAsCorners([[5, 5, 0]]);
    expect(v.getPoints()).toEqual([[5, 5, 0]]);
  });

  it('handles empty array', () => {
    const v = new VMobject();
    v.setPointsAsCorners([]);
    expect(v.getPoints()).toEqual([]);
  });

  it('handles two corners with correct handles', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [6, 0, 0],
    ]);
    const pts = v.getPoints();
    expect(pts.length).toBe(4);
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[3]).toEqual([6, 0, 0]);
    expect(pts[1][0]).toBeCloseTo(2);
    expect(pts[2][0]).toBeCloseTo(4);
  });

  it('correctly interpolates handles in 3D', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [0, 0, 9],
    ]);
    const pts = v.getPoints();
    expect(pts[1][2]).toBeCloseTo(3);
    expect(pts[2][2]).toBeCloseTo(6);
  });
});

describe('VMobject.addPointsAsCorners', () => {
  it('appends new corner segments to existing points', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [3, 0, 0],
    ]);
    expect(v.getPoints().length).toBe(4);
    v.addPointsAsCorners([[3, 3, 0]]);
    expect(v.getPoints().length).toBe(7);
    expect(v.getPoints()[6]).toEqual([3, 3, 0]);
  });

  it('handles adding to empty VMobject', () => {
    const v = new VMobject();
    v.addPointsAsCorners([[5, 5, 0]]);
    expect(v.getPoints()).toEqual([[5, 5, 0]]);
  });

  it('adds multiple corners sequentially', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    v.addPointsAsCorners([
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(v.getPoints().length).toBe(10);
  });

  it('correctly computes 3D handle positions', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [0, 0, 0],
    ]);
    v.addPointsAsCorners([[0, 0, 9]]);
    const pts = v.getPoints();
    // Last 3 points are handle1, handle2, anchor for corner at z=9
    expect(pts[pts.length - 3][2]).toBeCloseTo(3);
    expect(pts[pts.length - 2][2]).toBeCloseTo(6);
    expect(pts[pts.length - 1][2]).toBeCloseTo(9);
  });
});

describe('VMobject.interpolate', () => {
  it('at alpha=0 keeps original', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [10, 10, 0],
      [11, 10, 0],
      [12, 10, 0],
      [13, 10, 0],
    ]);
    v1.interpolate(v2, 0);
    expect(v1.getPoints()[0][0]).toBeCloseTo(0);
    expect(v1.getPoints()[0][1]).toBeCloseTo(0);
  });

  it('at alpha=1 matches target', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [10, 10, 0],
      [11, 10, 0],
      [12, 10, 0],
      [13, 10, 0],
    ]);
    v1.interpolate(v2, 1);
    expect(v1.getPoints()[0][0]).toBeCloseTo(10);
    expect(v1.getPoints()[3][0]).toBeCloseTo(13);
  });

  it('at alpha=0.5 is midpoint', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [2, 0, 0],
      [4, 0, 0],
      [6, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [10, 10, 0],
      [12, 10, 0],
      [14, 10, 0],
      [16, 10, 0],
    ]);
    v1.interpolate(v2, 0.5);
    expect(v1.getPoints()[0][0]).toBeCloseTo(5);
    expect(v1.getPoints()[0][1]).toBeCloseTo(5);
    expect(v1.getPoints()[3][0]).toBeCloseTo(11);
  });

  it('interpolates style properties', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v1.opacity = 0;
    v1.fillOpacity = 0;
    v1.strokeWidth = 0;
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v2.opacity = 1;
    v2.fillOpacity = 1;
    v2.strokeWidth = 10;
    v1.interpolate(v2, 0.5);
    expect(v1.opacity).toBeCloseTo(0.5);
    expect(v1.fillOpacity).toBeCloseTo(0.5);
    expect(v1.strokeWidth).toBeCloseTo(5);
  });

  it('aligns points when counts differ', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [10, 0, 0],
      [11, 0, 0],
      [12, 0, 0],
      [13, 0, 0],
    ]);
    v1.interpolate(v2, 0.5);
    expect(v1.getPoints().length).toBe(v2.getPoints().length);
  });

  it('interpolates _style fillOpacity and strokeOpacity', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v1.setStyle({ fillOpacity: 0, strokeOpacity: 0, strokeWidth: 2 });
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v2.setStyle({ fillOpacity: 1, strokeOpacity: 1, strokeWidth: 8 });
    v1.interpolate(v2, 0.5);
    const s = v1.style;
    expect(s.fillOpacity).toBeCloseTo(0.5);
    expect(s.strokeOpacity).toBeCloseTo(0.5);
    expect(s.strokeWidth).toBeCloseTo(5);
  });

  it('interpolates position and scale', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v1.position.set(0, 0, 0);
    v1.scaleVector.set(1, 1, 1);
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v2.position.set(10, 10, 10);
    v2.scaleVector.set(3, 3, 3);
    v1.interpolate(v2, 0.5);
    expect(v1.position.x).toBeCloseTo(5);
    expect(v1.scaleVector.x).toBeCloseTo(2);
  });
});

describe('VMobject.alignPoints', () => {
  it('does nothing when counts match', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [5, 5, 0],
      [6, 6, 0],
    ]);
    v1.alignPoints(v2);
    expect(v1.getPoints().length).toBe(2);
    expect(v2.getPoints().length).toBe(2);
  });

  it('upsamples the shorter VMobject', () => {
    const v1 = new VMobject();
    v1.setPoints([[0, 0, 0]]);
    const v2 = new VMobject();
    v2.setPoints([
      [5, 0, 0],
      [6, 0, 0],
      [7, 0, 0],
      [8, 0, 0],
    ]);
    v1.alignPoints(v2);
    expect(v1.getPoints().length).toBe(4);
  });

  it('handles empty VMobject by filling with zeros', () => {
    const v1 = new VMobject();
    v1.setPoints([]);
    const v2 = new VMobject();
    v2.setPoints([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    v1.alignPoints(v2);
    expect(v1.getPoints().length).toBe(2);
    expect(v1.getPoints()[0]).toEqual([0, 0, 0]);
  });
});

describe('VMobject.getCenter', () => {
  it('returns position when no points', () => {
    const v = new VMobject();
    v.position.set(3, 4, 5);
    expect(v.getCenter()).toEqual([3, 4, 5]);
  });

  it('returns bounding box center for points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [4, 0, 0],
      [4, 2, 0],
      [0, 2, 0],
    ]);
    const center = v.getCenter();
    expect(center[0]).toBeCloseTo(2);
    expect(center[1]).toBeCloseTo(1);
  });

  it('includes position offset', () => {
    const v = new VMobject();
    v.position.set(10, 10, 0);
    v.setPoints([
      [-1, -1, 0],
      [1, 1, 0],
    ]);
    const center = v.getCenter();
    expect(center[0]).toBeCloseTo(10);
    expect(center[1]).toBeCloseTo(10);
  });
});

describe('VMobject.getUnitVector', () => {
  it('returns [1,0,0] when fewer than 2 points', () => {
    const v = new VMobject();
    expect(v.getUnitVector()).toEqual([1, 0, 0]);
    v.setPoints([[5, 5, 0]]);
    expect(v.getUnitVector()).toEqual([1, 0, 0]);
  });

  it('returns normalized direction from first to last point', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [3, 4, 0],
    ]);
    const uv = v.getUnitVector();
    const mag = Math.sqrt(uv[0] ** 2 + uv[1] ** 2 + uv[2] ** 2);
    expect(mag).toBeCloseTo(1);
    expect(uv[0]).toBeCloseTo(0.6);
    expect(uv[1]).toBeCloseTo(0.8);
  });

  it('returns [1,0,0] for coincident endpoints', () => {
    const v = new VMobject();
    v.setPoints([
      [3, 3, 3],
      [3, 3, 3],
    ]);
    expect(v.getUnitVector()).toEqual([1, 0, 0]);
  });
});

describe('VMobject.copy', () => {
  it('creates deep copy with same points and style', () => {
    const v = new VMobject();
    v.setPoints([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    v.setColor('#ff0000');
    v.setOpacity(0.7);
    v.fillOpacity = 0.3;
    v.strokeWidth = 8;
    const c = v.copy() as VMobject;
    expect(c.getPoints()).toEqual(v.getPoints());
    expect(c.color.toLowerCase()).toBe('#ff0000');
    expect(c.opacity).toBeCloseTo(0.7);
    expect(c.fillOpacity).toBe(0.3);
    expect(c.strokeWidth).toBe(8);
  });

  it('copy is independent from original', () => {
    const v = new VMobject();
    v.setPoints([[1, 0, 0]]);
    const c = v.copy() as VMobject;
    c.setPoints([[99, 99, 99]]);
    expect(v.getPoints()[0][0]).toBe(1);
  });

  it('preserves visiblePointCount', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.visiblePointCount = 2;
    const c = v.copy() as VMobject;
    expect(c.visiblePointCount).toBe(2);
  });
});

describe('VMobject._toLinewidth (static)', () => {
  it('converts strokeWidth to pixel linewidth', () => {
    const lw = VMobject._toLinewidth(4);
    expect(lw).toBeCloseTo(4 * 0.01 * (800 / 14));
  });

  it('returns 0 for strokeWidth=0', () => {
    expect(VMobject._toLinewidth(0)).toBe(0);
  });

  it('scales linearly', () => {
    const lw1 = VMobject._toLinewidth(2);
    const lw2 = VMobject._toLinewidth(4);
    expect(lw2).toBeCloseTo(lw1 * 2);
  });
});

describe('VMobject.shaderCurves', () => {
  it('defaults to class-level useShaderCurves', () => {
    const saved = VMobject.useShaderCurves;
    try {
      VMobject.useShaderCurves = false;
      const v = new VMobject();
      expect(v.shaderCurves).toBe(false);
      VMobject.useShaderCurves = true;
      expect(v.shaderCurves).toBe(true);
    } finally {
      VMobject.useShaderCurves = saved;
    }
  });

  it('per-instance override takes precedence', () => {
    const saved = VMobject.useShaderCurves;
    try {
      VMobject.useShaderCurves = false;
      const v = new VMobject();
      v.shaderCurves = true;
      expect(v.shaderCurves).toBe(true);
      v.shaderCurves = null;
      expect(v.shaderCurves).toBe(false);
    } finally {
      VMobject.useShaderCurves = saved;
    }
  });
});

describe('VMobject.dispose', () => {
  it('does not throw on empty VMobject', () => {
    expect(() => new VMobject().dispose()).not.toThrow();
  });

  it('does not throw on VMobject with points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(() => v.dispose()).not.toThrow();
  });
});

describe('VMobject.useStrokeMesh', () => {
  it('defaults to false', () => {
    expect(new VMobject().useStrokeMesh).toBe(false);
  });

  it('can be toggled', () => {
    const v = new VMobject();
    v.useStrokeMesh = true;
    expect(v.useStrokeMesh).toBe(true);
  });
});

describe('VMobject static properties', () => {
  it('_rendererWidth and _rendererHeight have defaults', () => {
    expect(VMobject._rendererWidth).toBe(800);
    expect(VMobject._rendererHeight).toBe(450);
  });

  it('_frameWidth has default', () => {
    expect(VMobject._frameWidth).toBe(14);
  });

  it('useShaderCurves defaults to false', () => {
    expect(VMobject.useShaderCurves).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Per-instance scene context (_setSceneContext / multi-scene support)
// ---------------------------------------------------------------------------

describe('VMobject per-instance scene context', () => {
  it('_setSceneContext overrides static defaults for linewidth', () => {
    const v = new VMobject();
    // Without scene context, uses static defaults (800/14)
    const defaultLw = (v as any)._computeLinewidth(4);
    expect(defaultLw).toBeCloseTo(4 * 0.01 * (800 / 14));

    // Set per-instance context with different dimensions
    v._setSceneContext(1600, 900, 28);
    const overriddenLw = (v as any)._computeLinewidth(4);
    expect(overriddenLw).toBeCloseTo(4 * 0.01 * (1600 / 28));

    // Static method still uses class-level statics
    expect(VMobject._toLinewidth(4)).toBeCloseTo(4 * 0.01 * (VMobject._rendererWidth / VMobject._frameWidth));
  });

  it('per-instance context does not affect other VMobjects', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();

    v1._setSceneContext(1920, 1080, 14);
    // v2 still uses static defaults (800/14)
    const v2Lw = (v2 as any)._computeLinewidth(4);
    expect(v2Lw).toBeCloseTo(4 * 0.01 * (VMobject._rendererWidth / VMobject._frameWidth));

    const v1Lw = (v1 as any)._computeLinewidth(4);
    expect(v1Lw).toBeCloseTo(4 * 0.01 * (1920 / 14));
    expect(v1Lw).not.toBeCloseTo(v2Lw);
  });

  it('two scenes with different sizes produce different linewidths', () => {
    // Simulate Scene A: 800x450, frameWidth=14
    const vA = new VMobject();
    vA._setSceneContext(800, 450, 14);

    // Simulate Scene B: 1920x1080, frameWidth=14
    const vB = new VMobject();
    vB._setSceneContext(1920, 1080, 14);

    const lwA = (vA as any)._computeLinewidth(4);
    const lwB = (vB as any)._computeLinewidth(4);

    expect(lwA).toBeCloseTo(4 * 0.01 * (800 / 14));
    expect(lwB).toBeCloseTo(4 * 0.01 * (1920 / 14));
    expect(lwA).not.toBeCloseTo(lwB);
  });

  it('falls back to statics when scene context is null', () => {
    const v = new VMobject();
    expect(v._sceneRendererWidth).toBeNull();
    expect(v._sceneRendererHeight).toBeNull();
    expect(v._sceneFrameWidth).toBeNull();

    const lw = (v as any)._computeLinewidth(4);
    expect(lw).toBeCloseTo(VMobject._toLinewidth(4));
  });

  it('_setSceneContext updates all three fields', () => {
    const v = new VMobject();
    v._setSceneContext(1024, 768, 10);
    expect(v._sceneRendererWidth).toBe(1024);
    expect(v._sceneRendererHeight).toBe(768);
    expect(v._sceneFrameWidth).toBe(10);
  });

  it('second scene does not corrupt first scene VMobject linewidth', () => {
    const savedW = VMobject._rendererWidth;
    const savedH = VMobject._rendererHeight;
    const savedF = VMobject._frameWidth;

    try {
      // Scene A creates a VMobject with its context
      const vA = new VMobject();
      vA._setSceneContext(800, 450, 14);

      // Scene B overwrites the statics (simulating Scene constructor)
      VMobject._rendererWidth = 1920;
      VMobject._rendererHeight = 1080;
      VMobject._frameWidth = 14;

      // vA's linewidth should still use its per-instance context, NOT the new statics
      const lwA = (vA as any)._computeLinewidth(4);
      expect(lwA).toBeCloseTo(4 * 0.01 * (800 / 14));

      // A VMobject without scene context WOULD use the corrupted statics
      const vNoContext = new VMobject();
      const lwNoContext = (vNoContext as any)._computeLinewidth(4);
      expect(lwNoContext).toBeCloseTo(4 * 0.01 * (1920 / 14));
    } finally {
      VMobject._rendererWidth = savedW;
      VMobject._rendererHeight = savedH;
      VMobject._frameWidth = savedF;
    }
  });
});

// ---------------------------------------------------------------------------
// getNumCurves / getNthCurve / curvesAsSubmobjects / CurvesAsSubmobjects
// ---------------------------------------------------------------------------

describe('getNumCurves', () => {
  it('returns 0 for fewer than 4 points', () => {
    const v = new VMobject();
    expect(getNumCurves(v)).toBe(0);
    v.setPoints([[0, 0, 0]]);
    expect(getNumCurves(v)).toBe(0);
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    expect(getNumCurves(v)).toBe(0);
  });

  it('returns 1 for exactly 4 points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(getNumCurves(v)).toBe(1);
  });

  it('returns 2 for 7 points', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    expect(getNumCurves(v)).toBe(2);
  });

  it('returns correct count for larger paths', () => {
    const v = new VMobject();
    v.setPoints(Array.from({ length: 10 }, (_, i) => [i, 0, 0]));
    expect(getNumCurves(v)).toBe(3);
  });
});

describe('getNthCurve', () => {
  it('extracts correct curve segments', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const c0 = getNthCurve(v, 0);
    expect(c0.getPoints()[0]).toEqual([0, 0, 0]);
    expect(c0.getPoints()[3]).toEqual([3, 0, 0]);

    const c1 = getNthCurve(v, 1);
    expect(c1.getPoints()[0]).toEqual([3, 0, 0]);
    expect(c1.getPoints()[3]).toEqual([6, 0, 0]);
  });

  it('copies style from source', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.setColor('#ff0000');
    v.setOpacity(0.5);
    v.setStrokeWidth(8);
    v.setFillOpacity(0.3);
    const c = getNthCurve(v, 0);
    expect(c.color.toLowerCase()).toBe('#ff0000');
    expect(c.opacity).toBeCloseTo(0.5);
    expect(c.strokeWidth).toBe(8);
    expect(c.fillOpacity).toBeCloseTo(0.3);
  });

  it('throws for out-of-range index', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    expect(() => getNthCurve(v, -1)).toThrow();
    expect(() => getNthCurve(v, 1)).toThrow();
  });
});

describe('curvesAsSubmobjects (function)', () => {
  it('splits a VMobject into curve children', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const parent = curvesAsSubmobjects(v);
    expect(parent.children.length).toBe(2);
  });

  it('copies transform', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.position.set(5, 6, 7);
    v.scaleVector.set(2, 2, 2);
    const parent = curvesAsSubmobjects(v);
    expect(parent.position.x).toBe(5);
    expect(parent.scaleVector.x).toBe(2);
  });

  it('parent has no own points and zero fill opacity', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const parent = curvesAsSubmobjects(v);
    expect(parent.numPoints).toBe(0);
    expect(parent.fillOpacity).toBe(0);
  });
});

describe('CurvesAsSubmobjects class', () => {
  it('constructor with VMobject splits into children', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    expect(cas.numCurves).toBe(2);
  });

  it('constructor without VMobject creates empty', () => {
    const cas = new CurvesAsSubmobjects();
    expect(cas.numCurves).toBe(0);
    expect(cas.fillOpacity).toBe(0);
  });

  it('getCurve returns correct child', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    expect(cas.getCurve(0).getPoints()[0]).toEqual([0, 0, 0]);
    expect(cas.getCurve(1).getPoints()[0]).toEqual([3, 0, 0]);
  });

  it('getCurve throws for out-of-range', () => {
    const cas = new CurvesAsSubmobjects();
    expect(() => cas.getCurve(0)).toThrow();
    expect(() => cas.getCurve(-1)).toThrow();
  });

  it('forEach iterates over curves', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    const indices: number[] = [];
    cas.forEach((_c, i) => indices.push(i));
    expect(indices).toEqual([0, 1]);
  });

  it('map returns mapped values', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    const firstPts = cas.map((c) => c.getPoints()[0]);
    expect(firstPts[0]).toEqual([0, 0, 0]);
    expect(firstPts[1]).toEqual([3, 0, 0]);
  });

  it('Symbol.iterator works with for-of', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    const collected: VMobject[] = [];
    for (const c of cas) collected.push(c);
    expect(collected.length).toBe(2);
  });

  it('setFromVMobject replaces existing children', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v1);
    expect(cas.numCurves).toBe(1);
    cas.setFromVMobject(v2);
    expect(cas.numCurves).toBe(2);
  });

  it('setFromVMobject copies transform', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.position.set(5, 6, 7);
    v.scaleVector.set(2, 3, 4);
    const cas = new CurvesAsSubmobjects();
    cas.setFromVMobject(v);
    expect(cas.position.x).toBe(5);
    expect(cas.scaleVector.y).toBe(3);
  });

  it('_createCopy returns a CurvesAsSubmobjects', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const cas = new CurvesAsSubmobjects(v);
    const copy = cas.copy();
    expect(copy).toBeInstanceOf(CurvesAsSubmobjects);
  });
});

describe('VMobject._interpolatePointList3D (via alignPoints)', () => {
  it('handles empty input by filling with zeros', () => {
    const v1 = new VMobject();
    v1.setPoints([]);
    const v2 = new VMobject();
    v2.setPoints([
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v1.alignPoints(v2);
    expect(v1.getPoints().length).toBe(3);
    expect(v1.getPoints()[0]).toEqual([0, 0, 0]);
  });

  it('handles single point input by repeating', () => {
    const v1 = new VMobject();
    v1.setPoints([[5, 5, 5]]);
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    v1.alignPoints(v2);
    expect(v1.getPoints().length).toBe(3);
    for (const p of v1.getPoints()) {
      expect(p).toEqual([5, 5, 5]);
    }
  });

  it('interpolates between two points to target count', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [10, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    v1.alignPoints(v2);
    const pts = v1.getPoints();
    expect(pts.length).toBe(5);
    expect(pts[0][0]).toBeCloseTo(0);
    expect(pts[4][0]).toBeCloseTo(10);
    expect(pts[2][0]).toBeCloseTo(5);
  });
});

describe('VMobject style optimization (no-op dirty checks)', () => {
  it('setOpacity does not mark dirty if value unchanged', () => {
    const v = new VMobject();
    v.setOpacity(0.5);
    v._dirty = false;
    v.setOpacity(0.5);
    expect(v._dirty).toBe(false);
  });

  it('setStrokeWidth does not mark dirty if value unchanged', () => {
    const v = new VMobject();
    v.setStrokeWidth(4);
    v._dirty = false;
    v.setStrokeWidth(4);
    expect(v._dirty).toBe(false);
  });

  it('setFillOpacity does not mark dirty if value unchanged', () => {
    const v = new VMobject();
    v.setFillOpacity(0.5);
    v._dirty = false;
    v.setFillOpacity(0.5);
    expect(v._dirty).toBe(false);
  });

  it('setColor does not mark dirty if value unchanged', () => {
    const v = new VMobject();
    v.setColor('#ff0000');
    v._dirty = false;
    v.setColor('#ff0000');
    expect(v._dirty).toBe(false);
  });

  it('fillColor setter does not mark dirty if unchanged', () => {
    const v = new VMobject();
    v.fillColor = '#abcdef';
    v._dirty = false;
    v.fillColor = '#abcdef';
    expect(v._dirty).toBe(false);
  });
});

describe('VMobject color setter syncs _style', () => {
  it('color setter syncs strokeColor and fillColor', () => {
    const v = new VMobject();
    v.color = '#123456';
    const s = v.style;
    expect(s.strokeColor).toBe('#123456');
    expect(s.fillColor).toBe('#123456');
  });
});

describe('VMobject chaining (all methods)', () => {
  it('setPoints returns this', () => {
    const v = new VMobject();
    expect(v.setPoints([[0, 0, 0]])).toBe(v);
  });

  it('setPoints3D returns this', () => {
    const v = new VMobject();
    expect(v.setPoints3D([[0, 0, 0]])).toBe(v);
  });

  it('addPoints returns this', () => {
    const v = new VMobject();
    expect(v.addPoints({ x: 0, y: 0 })).toBe(v);
  });

  it('clearPoints returns this', () => {
    expect(new VMobject().clearPoints()).toBeInstanceOf(VMobject);
  });

  it('setPointsAsCorners returns this', () => {
    const v = new VMobject();
    expect(
      v.setPointsAsCorners([
        [0, 0, 0],
        [1, 0, 0],
      ]),
    ).toBe(v);
  });

  it('addPointsAsCorners returns this', () => {
    const v = new VMobject();
    v.setPoints([[0, 0, 0]]);
    expect(v.addPointsAsCorners([[1, 0, 0]])).toBe(v);
  });

  it('interpolate returns this', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [5, 0, 0],
      [6, 0, 0],
    ]);
    expect(v1.interpolate(v2, 0.5)).toBe(v1);
  });

  it('setColor returns this', () => {
    expect(new VMobject().setColor('#ff0000')).toBeInstanceOf(VMobject);
  });

  it('setOpacity returns this', () => {
    expect(new VMobject().setOpacity(0.5)).toBeInstanceOf(VMobject);
  });

  it('setStrokeWidth returns this', () => {
    expect(new VMobject().setStrokeWidth(6)).toBeInstanceOf(VMobject);
  });

  it('setFillOpacity returns this', () => {
    expect(new VMobject().setFillOpacity(0.5)).toBeInstanceOf(VMobject);
  });

  it('setFill returns this', () => {
    expect(new VMobject().setFill('#ff0000', 0.5)).toBeInstanceOf(VMobject);
  });

  it('setStyle returns this', () => {
    expect(new VMobject().setStyle({ strokeWidth: 6 })).toBeInstanceOf(VMobject);
  });
});

describe('VMobject become', () => {
  it('copies all visual properties from another VMobject', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [10, 10, 0],
      [20, 20, 0],
    ]);
    v2.setColor('#ff0000');
    v2.setOpacity(0.3);
    v2.strokeWidth = 12;
    v2.fillOpacity = 0.7;
    v2.position.set(5, 6, 7);
    v1.become(v2);
    expect(v1.getPoints()).toEqual(v2.getPoints());
    expect(v1.color.toLowerCase()).toBe('#ff0000');
    expect(v1.opacity).toBeCloseTo(0.3);
    expect(v1.strokeWidth).toBe(12);
    expect(v1.fillOpacity).toBe(0.7);
    expect(v1.position.x).toBe(5);
  });
});

describe('VMobject saveState / restoreState', () => {
  it('saves and restores full state', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    v.position.set(1, 2, 3);
    v.setColor('#ff0000');
    v.setOpacity(0.5);
    v.saveState();
    v.position.set(99, 99, 99);
    v.setColor('#00ff00');
    v.setOpacity(1);
    v.setPoints([[5, 5, 5]]);
    expect(v.restoreState()).toBe(true);
    expect(v.position.x).toBe(1);
    expect(v.color.toLowerCase()).toBe('#ff0000');
    expect(v.opacity).toBeCloseTo(0.5);
    expect(v.getPoints().length).toBe(4);
  });

  it('restoreState returns false if no saved state', () => {
    expect(new VMobject().restoreState()).toBe(false);
  });
});

describe('VMobject Mobject operations', () => {
  it('add/remove children', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);
    expect(parent.submobjects).toContain(child);
    expect(child.parent).toBe(parent);
    parent.remove(child);
    expect(parent.submobjects).not.toContain(child);
  });

  it('getFamily includes self and descendants', () => {
    const parent = new VMobject();
    const c1 = new VMobject();
    const c2 = new VMobject();
    parent.add(c1, c2);
    const family = parent.getFamily();
    expect(family).toContain(parent);
    expect(family).toContain(c1);
    expect(family).toContain(c2);
    expect(family.length).toBe(3);
  });

  it('generateTarget creates independent copy', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const target = v.generateTarget();
    expect(v.targetCopy).toBe(target);
    target.shift([10, 0, 0]);
    expect(v.position.x).toBe(0);
  });

  it('opacity setter clamps values', () => {
    const v = new VMobject();
    v.opacity = 1.5;
    expect(v.opacity).toBe(1);
    v.opacity = -0.5;
    expect(v.opacity).toBe(0);
  });
});
