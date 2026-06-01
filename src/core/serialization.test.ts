import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
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
  if (tag) (vm as unknown as Record<string, string>)._tag = tag;
  return vm;
}

describe('serializeMobject', () => {
  it('captures position, rotation, scale, color, opacity', () => {
    const vm = new VMobject();
    vm.position.set(1, 2, 3);
    vm.rotation.set(0.1, 0.2, 0.3);
    vm.scaleVector.set(2, 3, 4);
    vm.setColor('#ff0000');
    vm.setStrokeOpacity(0.7);
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
    vm.setStrokeOpacity(0.3);
    // Use setStrokeWidth/setFillOpacity to keep _style in sync
    vm.setStrokeWidth(8);
    vm.setFillOpacity(0.5);
    const state = serializeMobject(vm);
    // Reset the mobject
    vm.setColor('#ffffff');
    vm.setStrokeOpacity(1);
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
    const pts = vm.getLocalPoints();
    expect(pts.length).toBe(4);
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[3]).toEqual([0, 1, 0]);
  });

  it('round-trip: serialize then deserialize preserves state', () => {
    const vm = makeVM();
    vm.position.set(1, 2, 3);
    vm.scaleVector.set(2, 2, 2);
    vm.setColor('#abcdef');
    vm.setStrokeOpacity(0.42);
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
    expect(vm2.getLocalPoints().length).toBe(4);
    expect(vm2.getLocalPoints()[0]).toEqual([0, 0, 0]);
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
    expect(child.getLocalPoints().length).toBe(2);
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
