import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
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
