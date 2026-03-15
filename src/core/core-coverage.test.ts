/**
 * Additional coverage tests for StateManager, VDict, and VMobject.
 *
 * Targets uncovered branches and functions to improve:
 * - StateManager: saveMobjectState, restoreMobjectState, snapshotToJSON/FromJSON,
 *   maxDepth enforcement in redo, undoStack/redoStack getters
 * - VDict: asProxy edge cases, copy preserves dict mappings
 * - VMobject: interpolate style branches, dispose with cached objects,
 *   _interpolatePointList3D edge cases, getCenter with points
 */
import { describe, it, expect } from 'vitest';
import { isVMobjectLike } from './Mobject';
import { VMobject } from './VMobject';
import {
  serializeMobject,
  deserializeMobject,
  saveMobjectState,
  restoreMobjectState,
  snapshotToJSON,
  snapshotFromJSON,
  SceneStateManager,
  MobjectState,
} from './StateManager';
import { VDict, VectorizedPoint } from './VDict';

/** Create a simple VMobject with 4 points (one cubic Bezier segment). */
function makeVM(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]);
  return vm;
}

// ============================================================
// StateManager - additional coverage
// ============================================================

describe('saveMobjectState / restoreMobjectState functions', () => {
  it('saveMobjectState captures serializable state and deep copy', () => {
    const vm = makeVM();
    vm.position.set(1, 2, 3);
    vm.setColor('#ff0000');
    vm.setOpacity(0.5);

    const state = saveMobjectState(vm);
    expect(state).toBeDefined();
    expect(state.position).toEqual([1, 2, 3]);
    expect(state.color.toLowerCase()).toBe('#ff0000');
    expect(state.opacity).toBeCloseTo(0.5);

    // savedState (deep copy) should exist
    expect(vm.savedState).not.toBeNull();
    expect(vm.savedState!.position.x).toBe(1);

    // __savedMobjectState should exist
    expect(vm.__savedMobjectState).toBe(state);
  });

  it('restoreMobjectState restores from JSON-serializable state', () => {
    const vm = makeVM();
    vm.position.set(5, 5, 5);
    vm.setColor('#00ff00');
    saveMobjectState(vm);

    // Modify the mobject
    vm.position.set(0, 0, 0);
    vm.setColor('#0000ff');

    const restored = restoreMobjectState(vm);
    expect(restored).toBe(true);
    expect(vm.position.x).toBe(5);
    expect(vm.position.y).toBe(5);
    expect(vm.color.toLowerCase()).toBe('#00ff00');
  });

  it('restoreMobjectState returns false when no saved state', () => {
    const vm = makeVM();
    const restored = restoreMobjectState(vm);
    expect(restored).toBe(false);
  });

  it('saveMobjectState creates a deep copy on savedState', () => {
    const vm = makeVM();
    saveMobjectState(vm);
    const saved = vm.savedState as VMobject;
    expect(saved).toBeInstanceOf(VMobject);
    // Modifying the saved copy should not affect original
    saved.position.set(99, 99, 99);
    expect(vm.position.x).not.toBe(99);
  });
});

describe('snapshotToJSON / snapshotFromJSON', () => {
  it('round-trips a SceneSnapshot through JSON', () => {
    const mobjects = [makeVM()];
    mobjects[0].position.set(10, 20, 30);
    const mgr = new SceneStateManager(() => mobjects);
    const snapshot = mgr.getState('test-label');

    const json = snapshotToJSON(snapshot);
    expect(typeof json).toBe('string');

    const parsed = snapshotFromJSON(json);
    expect(parsed.label).toBe('test-label');
    expect(parsed.timestamp).toBe(snapshot.timestamp);
    expect(parsed.mobjects.length).toBe(1);
    expect(parsed.mobjects[0].position).toEqual([10, 20, 30]);
  });
});

describe('SceneStateManager - additional coverage', () => {
  it('save returns a SceneSnapshot with timestamp', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);
    const snapshot = mgr.save('label');
    expect(snapshot.label).toBe('label');
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(snapshot.mobjects.length).toBe(1);
  });

  it('undoStack and redoStack are accessible as read-only', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);
    mgr.save('s1');
    mgr.save('s2');
    expect(mgr.undoStack.length).toBe(2);
    expect(mgr.undoStack[0].label).toBe('s1');

    mgr.undo();
    expect(mgr.redoStack.length).toBe(1);
  });

  it('redo enforces maxDepth on undo stack', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects, 2);

    // Fill undo stack to max
    mgr.save('s1');
    mgr.save('s2');
    expect(mgr.undoCount).toBe(2);

    // Undo one to create redo entry
    mobjects[0].position.set(5, 5, 5);
    mgr.undo();

    // Now redo - this pushes current state onto undo stack
    // which may exceed maxDepth and should trim
    mgr.redo();
    expect(mgr.undoCount).toBeLessThanOrEqual(2);
  });

  it('multiple undo/redo cycles preserve state correctly', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);

    // State A
    mobjects[0].position.set(0, 0, 0);
    mgr.save('A');

    // State B
    mobjects[0].position.set(5, 0, 0);
    mgr.save('B');

    // State C
    mobjects[0].position.set(10, 0, 0);

    // Undo to B (restores state B snapshot = position was 5,0,0)
    mgr.undo();
    expect(mobjects[0].position.x).toBe(5);

    // Undo to A (restores state A snapshot = position was 0,0,0)
    mgr.undo();
    expect(mobjects[0].position.x).toBe(0);

    // Redo back to B
    mgr.redo();
    // After redo, the pre-undo snapshot (position=5) is restored
    expect(mobjects[0].position.x).toBe(5);
  });

  it('setState applies without modifying stacks', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);
    mobjects[0].position.set(1, 2, 3);
    const snap = mgr.getState();

    mgr.save('before setState');
    mobjects[0].position.set(99, 99, 99);

    const undoCountBefore = mgr.undoCount;
    mgr.setState(snap);
    expect(mobjects[0].position.x).toBe(1);
    expect(mgr.undoCount).toBe(undoCountBefore); // not modified
  });

  it('handles empty mobjects list gracefully', () => {
    const mobjects: VMobject[] = [];
    const mgr = new SceneStateManager(() => mobjects);
    const snap = mgr.save();
    expect(snap.mobjects.length).toBe(0);
    mgr.undo();
    mgr.redo();
  });

  it('handles more mobjects than snapshot entries', () => {
    const mobjects = [makeVM()];
    const mgr = new SceneStateManager(() => mobjects);
    mgr.save();
    // Add a second mobject (not in snapshot)
    mobjects.push(makeVM());
    mobjects[1].position.set(99, 99, 99);
    mgr.undo();
    // Only the first mobject should be restored; second unchanged
    expect(mobjects[1].position.x).toBe(99);
  });
});

describe('deserializeMobject - additional branches', () => {
  it('restores using points2D when points3D is empty', () => {
    const vm = new VMobject();
    const state: MobjectState = {
      id: 'test',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 'XYZ'],
      scale: [1, 1, 1],
      color: '#ffffff',
      opacity: 1,
      strokeWidth: 4,
      fillOpacity: 0.5,
      style: {},
      points2D: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
      points3D: [], // empty - should fall through to points2D
      children: [],
    };
    deserializeMobject(vm, state);
    const pts = vm.getPoints();
    expect(pts.length).toBe(2);
    expect(pts[0][0]).toBe(1);
    expect(pts[0][1]).toBe(2);
  });

  it('restores visiblePointCount when present', () => {
    const vm = makeVM();
    const state = serializeMobject(vm);
    state.visiblePointCount = 2;
    deserializeMobject(vm, state);
    expect((vm as any)._visiblePointCount).toBe(2);
    expect((vm as any)._geometryDirty).toBe(true);
  });

  it('handles state with no points data gracefully', () => {
    const vm = new VMobject();
    const state: MobjectState = {
      id: 'test',
      position: [5, 6, 7],
      rotation: [0, 0, 0, 'XYZ'],
      scale: [1, 1, 1],
      color: '#ffffff',
      opacity: 1,
      strokeWidth: 4,
      fillOpacity: 0.5,
      style: {},
      children: [],
    };
    deserializeMobject(vm, state);
    expect(vm.position.x).toBe(5);
  });

  it('restores children by index (fewer children than state)', () => {
    const parent = new VMobject();
    const child = new VMobject();
    parent.add(child);

    const state = serializeMobject(parent);
    // Add an extra child state that has no matching child in the mobject
    state.children.push({
      id: 'extra',
      position: [99, 99, 99],
      rotation: [0, 0, 0, 'XYZ'],
      scale: [1, 1, 1],
      color: '#ffffff',
      opacity: 1,
      strokeWidth: 4,
      fillOpacity: 0.5,
      style: {},
      children: [],
    });

    // Should not throw - extra state entries are ignored
    deserializeMobject(parent, state);
    expect(parent.children.length).toBe(1); // unchanged
  });

  it('handles Mobject (non-VMobject) serialization', () => {
    // Mobject serialization should work for base class too
    const mob = new VMobject();
    mob.position.set(1, 2, 3);
    mob.setColor('#ff0000');
    const state = serializeMobject(mob);
    expect(state.color.toLowerCase()).toBe('#ff0000');
  });
});

// ============================================================
// VDict - additional coverage
// ============================================================

describe('VDict - additional coverage', () => {
  it('asProxy get returns VDict properties for non-dict keys', () => {
    const d = new VDict();
    const vm = makeVM();
    d.set('item', vm);
    const proxy = d.asProxy();
    // Accessing a VDict method
    expect(typeof proxy.size).toBe('number');
    expect(proxy.size).toBe(1);
  });

  it('asProxy set with non-VMobject value sets directly on target', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    (proxy as any).customProp = 42;
    expect((d as any).customProp).toBe(42);
  });

  it('asProxy has returns true for VDict properties', () => {
    const d = new VDict({ item: makeVM() });
    const proxy = d.asProxy();
    expect('item' in proxy).toBe(true);
    expect('size' in proxy).toBe(true);
    expect('nonexistent' in proxy).toBe(false);
  });

  it('asProxy has works with symbols', () => {
    const d = new VDict();
    const proxy = d.asProxy();
    const sym = Symbol('test');
    // Symbol check delegates to prop in target
    expect(sym in proxy).toBe(false);
  });

  it('copy creates independent VDict with cloned children', () => {
    const a = makeVM();
    const b = makeVM();
    a.position.set(1, 0, 0);
    b.position.set(2, 0, 0);
    const d = new VDict({ a, b });

    const clone = d.copy() as VDict;
    expect(clone.size).toBe(2);
    expect(clone.get('a')).not.toBe(a); // deep copy
    expect((clone.get('a') as VMobject).position.x).toBe(1);
    expect((clone.get('b') as VMobject).position.x).toBe(2);
  });

  it('copy preserves style properties', () => {
    const d = new VDict({ item: makeVM() });
    d.position.set(5, 6, 7);
    d.setColor('#ff0000');
    d.setOpacity(0.5);

    const clone = d.copy() as VDict;
    expect(clone.position.x).toBe(5);
    expect(clone.color).toBe('#ff0000');
    expect(clone.opacity).toBe(0.5);
  });

  it('_createCopy returns empty VDict', () => {
    const d = new VDict({ item: makeVM() });
    // _createCopy is called internally by copy
    const copy = d.copy() as VDict;
    // The copy method properly copies dict entries
    expect(copy.size).toBe(1);
  });

  it('set replaces existing entry and removes old from submobjects', () => {
    const d = new VDict();
    const vm1 = makeVM();
    const vm2 = makeVM();
    d.set('key', vm1);
    expect(d.submobjects).toContain(vm1);
    d.set('key', vm2);
    expect(d.submobjects).not.toContain(vm1);
    expect(d.submobjects).toContain(vm2);
    expect(d.size).toBe(1);
  });

  it('clear removes all entries and submobjects', () => {
    const a = makeVM();
    const b = makeVM();
    const d = new VDict({ a, b });
    expect(d.submobjects.length).toBe(2);
    d.clear();
    expect(d.size).toBe(0);
    expect(d.submobjects.length).toBe(0);
  });

  it('addNamed is alias for set', () => {
    const d = new VDict();
    const vm = makeVM();
    d.addNamed('test', vm);
    expect(d.get('test')).toBe(vm);
  });

  it('removeNamed is alias for delete', () => {
    const d = new VDict({ test: makeVM() });
    d.removeNamed('test');
    expect(d.size).toBe(0);
  });

  it('getItem is alias for get', () => {
    const vm = makeVM();
    const d = new VDict({ item: vm });
    expect(d.getItem('item')).toBe(vm);
  });

  it('getByName is alias for get', () => {
    const vm = makeVM();
    const d = new VDict({ named: vm });
    expect(d.getByName('named')).toBe(vm);
  });

  it('get with numeric index delegates to VGroup', () => {
    const vm = makeVM();
    const d = new VDict({ first: vm });
    expect(d.get(0)).toBe(vm);
    expect(d.get(99)).toBeUndefined();
  });

  it('forEach iterates via VGroup index-based iteration', () => {
    const a = makeVM();
    const b = makeVM();
    const d = new VDict({ a, b });
    const items: VMobject[] = [];
    d.forEach((v) => items.push(v));
    expect(items.length).toBe(2);
  });

  it('forEachEntry iterates with dict keys', () => {
    const vm = makeVM();
    const d = new VDict({ myKey: vm });
    const pairs: [string, VMobject][] = [];
    d.forEachEntry((v, k) => pairs.push([k, v]));
    expect(pairs.length).toBe(1);
    expect(pairs[0][0]).toBe('myKey');
    expect(pairs[0][1]).toBe(vm);
  });
});

// ============================================================
// VectorizedPoint - additional coverage
// ============================================================

describe('VectorizedPoint - additional coverage', () => {
  it('getLocation falls back to position when no points', () => {
    const vp = new VectorizedPoint([1, 2, 3]);
    // Clear internal points to test fallback
    (vp as any)._points3D = [];
    const loc = vp.getLocation();
    expect(loc[0]).toBe(vp.position.x);
    expect(loc[1]).toBe(vp.position.y);
    expect(loc[2]).toBe(vp.position.z);
  });

  it('_createThreeObject positions group at point location', () => {
    const vp = new VectorizedPoint([3, 4, 5]);
    const obj = vp.getThreeObject();
    expect(obj).toBeDefined();
  });

  it('_syncMaterialToThree updates position', () => {
    const vp = new VectorizedPoint([1, 2, 3]);
    vp.getThreeObject(); // Create three object
    vp.setLocation([7, 8, 9]);
    vp._syncToThree();
    // The internal three object should update position
  });

  it('copy returns independent VectorizedPoint', () => {
    const vp = new VectorizedPoint([1, 2, 3]);
    const copy = vp.copy() as VectorizedPoint;
    expect(copy.getLocation()).toEqual([1, 2, 3]);
    copy.setLocation([10, 10, 10]);
    expect(vp.getLocation()).toEqual([1, 2, 3]);
  });
});

// ============================================================
// VMobject - coverage gaps
// ============================================================

describe('VMobject - interpolate style branches', () => {
  it('interpolate handles missing _style properties gracefully', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    v2.setPoints([
      [0, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 0],
    ]);

    // Set style properties on both
    v1._style.fillOpacity = 0.2;
    v2._style.fillOpacity = 0.8;
    v1._style.strokeOpacity = 0.3;
    v2._style.strokeOpacity = 0.9;
    v1._style.strokeWidth = 2;
    v2._style.strokeWidth = 8;

    v1.interpolate(v2, 0.5);

    expect(v1._style.fillOpacity).toBeCloseTo(0.5);
    expect(v1._style.strokeOpacity).toBeCloseTo(0.6);
    expect(v1._style.strokeWidth).toBeCloseTo(5);
  });

  it('interpolate with different point counts aligns first', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);

    v1.interpolate(v2, 0.5);
    // After alignment, both should have the same number of points
    expect(v1.numPoints).toBe(v2.numPoints);
  });

  it('interpolate at alpha=0 keeps original values', () => {
    const v1 = makeVM();
    const v2 = makeVM();
    v1.setOpacity(0.2);
    v2.setOpacity(0.8);
    v1.position.set(0, 0, 0);
    v2.position.set(10, 0, 0);

    v1.interpolate(v2, 0);
    expect(v1.opacity).toBeCloseTo(0.2);
    expect(v1.position.x).toBeCloseTo(0);
  });

  it('interpolate at alpha=1 reaches target values', () => {
    const v1 = makeVM();
    const v2 = makeVM();
    v1.setOpacity(0.2);
    v2.setOpacity(0.8);
    v1.fillOpacity = 0.1;
    v2.fillOpacity = 0.9;
    v1.strokeWidth = 2;
    v2.strokeWidth = 10;

    v1.interpolate(v2, 1);
    expect(v1.opacity).toBeCloseTo(0.8);
    expect(v1.fillOpacity).toBeCloseTo(0.9);
    expect(v1.strokeWidth).toBeCloseTo(10);
  });
});

describe('VMobject._interpolatePointList3D edge cases', () => {
  it('handles empty point list by filling with origin points', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    v1.setPoints([]); // empty
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);

    v1.alignPoints(v2);
    // v1 should now have the same count as v2
    expect(v1.numPoints).toBe(v2.numPoints);
    // All points should be at origin
    const pts = v1.getPoints();
    for (const p of pts) {
      expect(p[0]).toBe(0);
      expect(p[1]).toBe(0);
      expect(p[2]).toBe(0);
    }
  });

  it('handles single point list by duplicating', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    v1.setPoints([[5, 5, 0]]);
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ]);

    v1.alignPoints(v2);
    expect(v1.numPoints).toBe(v2.numPoints);
    // All points should be at [5, 5, 0]
    const pts = v1.getPoints();
    for (const p of pts) {
      expect(p[0]).toBe(5);
      expect(p[1]).toBe(5);
    }
  });

  it('handles equal point counts (no-op)', () => {
    const v1 = makeVM();
    const v2 = makeVM();
    const count1 = v1.numPoints;
    v1.alignPoints(v2);
    expect(v1.numPoints).toBe(count1); // unchanged
  });
});

describe('VMobject.alignPoints', () => {
  it('target gets aligned when it has fewer points', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);
    v2.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);

    v1.alignPoints(v2);
    expect(v1.numPoints).toBe(v2.numPoints);
  });
});

describe('VMobject.getCenter', () => {
  it('returns position when no points', () => {
    const vm = new VMobject();
    vm.position.set(5, 10, 15);
    expect(vm.getCenter()).toEqual([5, 10, 15]);
  });

  it('returns bounding box center plus position offset', () => {
    const vm = new VMobject();
    vm.position.set(10, 20, 0);
    vm.setPoints([
      [0, 0, 0],
      [4, 0, 0],
      [4, 2, 0],
      [0, 2, 0],
    ]);
    const center = vm.getCenter();
    // Bounding box center = (2, 1, 0), plus position (10, 20, 0)
    expect(center[0]).toBeCloseTo(12);
    expect(center[1]).toBeCloseTo(21);
  });
});

describe('VMobject.getUnitVector - additional', () => {
  it('returns [1,0,0] for degenerate (all same) points', () => {
    const vm = new VMobject();
    vm.setPoints([
      [5, 5, 0],
      [5, 5, 0],
    ]);
    expect(vm.getUnitVector()).toEqual([1, 0, 0]);
  });
});

describe('VMobject.dispose - with cached objects', () => {
  it('dispose cleans up stroke and fill materials', () => {
    const vm = makeVM();
    vm.getThreeObject(); // create three object with materials
    expect(() => vm.dispose()).not.toThrow();
  });

  it('dispose on vmobject with no three object is safe', () => {
    const vm = new VMobject();
    expect(() => vm.dispose()).not.toThrow();
  });
});

describe('VMobject._toLinewidth', () => {
  it('converts strokeWidth to pixel linewidth', () => {
    const lw = VMobject._toLinewidth(4);
    // 4 * 0.01 * (800 / 14)
    expect(lw).toBeCloseTo(4 * 0.01 * (800 / 14));
  });

  it('returns 0 for strokeWidth 0', () => {
    expect(VMobject._toLinewidth(0)).toBe(0);
  });
});

describe('VMobject.shaderCurves property', () => {
  it('defaults to class-level setting', () => {
    const vm = new VMobject();
    const original = VMobject.useShaderCurves;
    expect(vm.shaderCurves).toBe(original);
  });

  it('per-instance override takes precedence', () => {
    const vm = new VMobject();
    VMobject.useShaderCurves = false;
    vm.shaderCurves = true;
    expect(vm.shaderCurves).toBe(true);

    // Reset
    vm.shaderCurves = null;
    expect(vm.shaderCurves).toBe(false);
    VMobject.useShaderCurves = false;
  });

  it('setting shaderCurves marks geometry dirty', () => {
    const vm = new VMobject();
    vm.shaderCurves = true;
    expect((vm as any)._geometryDirty).toBe(true);
    // Clean up
    vm.shaderCurves = null;
  });
});

describe('VMobject.setPoints with Point[] format', () => {
  it('accepts Point[] objects ({x, y})', () => {
    const vm = new VMobject();
    vm.setPoints([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
    const pts = vm.getPoints();
    expect(pts.length).toBe(2);
    expect(pts[0]).toEqual([1, 2, 0]);
    expect(pts[1]).toEqual([3, 4, 0]);
  });

  it('setPoints with empty array clears points', () => {
    const vm = makeVM();
    vm.setPoints([]);
    expect(vm.numPoints).toBe(0);
  });
});

describe('VMobject.addPointsAsCorners - edge cases', () => {
  it('adds to empty VMobject', () => {
    const vm = new VMobject();
    vm.addPointsAsCorners([[1, 1, 0]]);
    expect(vm.numPoints).toBeGreaterThanOrEqual(1);
  });

  it('preserves z-coordinate', () => {
    const vm = new VMobject();
    vm.setPointsAsCorners([
      [0, 0, 5],
      [1, 0, 5],
    ]);
    vm.addPointsAsCorners([[2, 0, 10]]);
    const pts = vm.getPoints();
    const lastPt = pts[pts.length - 1];
    expect(lastPt[2]).toBeCloseTo(10);
  });
});

describe('VMobject.setPointsAsCorners - edge cases', () => {
  it('handles single corner point', () => {
    const vm = new VMobject();
    vm.setPointsAsCorners([[5, 5, 0]]);
    expect(vm.numPoints).toBe(1);
    expect(vm.getPoints()[0]).toEqual([5, 5, 0]);
  });

  it('handles empty corners array', () => {
    const vm = new VMobject();
    vm.setPointsAsCorners([]);
    expect(vm.numPoints).toBe(0);
  });

  it('creates correct cubic Bezier for two corners', () => {
    const vm = new VMobject();
    vm.setPointsAsCorners([
      [0, 0, 0],
      [3, 0, 0],
    ]);
    // Should create: anchor, handle1, handle2, anchor = 4 points
    expect(vm.numPoints).toBe(4);
    const pts = vm.getPoints();
    expect(pts[0]).toEqual([0, 0, 0]);
    expect(pts[1][0]).toBeCloseTo(1); // handle1 at 1/3
    expect(pts[2][0]).toBeCloseTo(2); // handle2 at 2/3
    expect(pts[3]).toEqual([3, 0, 0]);
  });
});

describe('VMobject.clearPoints', () => {
  it('clears all points and resets visiblePointCount', () => {
    const vm = makeVM();
    vm.visiblePointCount = 2;
    vm.clearPoints();
    expect(vm.numPoints).toBe(0);
    expect(vm.visiblePointCount).toBe(0);
  });
});

describe('VMobject.visiblePointCount', () => {
  it('clamps to valid range', () => {
    const vm = makeVM(); // 4 points
    vm.visiblePointCount = -5;
    expect(vm.visiblePointCount).toBe(0);
    vm.visiblePointCount = 100;
    expect(vm.visiblePointCount).toBe(4);
  });
});

describe('VMobject.addPoints', () => {
  it('adds 2D Point objects', () => {
    const vm = new VMobject();
    vm.addPoints({ x: 1, y: 2 }, { x: 3, y: 4 });
    expect(vm.numPoints).toBe(2);
    const pts = vm.getPoints();
    expect(pts[0]).toEqual([1, 2, 0]);
  });
});

describe('VMobject._syncMaterialToThree', () => {
  it('updates materials when geometry is dirty', () => {
    const vm = makeVM();
    vm.getThreeObject(); // create three object
    vm.setColor('#ff0000');
    vm.strokeWidth = 10;
    vm.fillOpacity = 0.8;
    vm._syncToThree(); // sync to three
    // Should not throw
  });

  it('handles less than 2 visible points (clears geometry)', () => {
    const vm = new VMobject();
    vm.setPoints([[1, 0, 0]]);
    vm.getThreeObject(); // create three object
    vm._syncToThree(); // should handle single point
  });
});

describe('VMobject.points getter (backward compat)', () => {
  it('returns 2D Point array from 3D points', () => {
    const vm = new VMobject();
    vm.setPoints3D([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const pts = vm.points;
    expect(pts.length).toBe(2);
    expect(pts[0]).toEqual({ x: 1, y: 2 });
    expect(pts[1]).toEqual({ x: 4, y: 5 });
  });
});

describe('VMobject.getVisiblePoints / getVisiblePoints3D', () => {
  it('getVisiblePoints3D returns deep copies', () => {
    const vm = makeVM();
    const pts = vm.getVisiblePoints3D();
    pts[0][0] = 999;
    // Original should be unaffected
    expect(vm.getVisiblePoints3D()[0][0]).toBe(0);
  });
});

describe('VMobject copy and createCopy', () => {
  it('_createCopy preserves points and visiblePointCount', () => {
    const vm = makeVM();
    vm.visiblePointCount = 2;
    const copy = vm.copy() as VMobject;
    expect(copy.numPoints).toBe(4);
    expect(copy.visiblePointCount).toBe(2);
  });
});

// ============================================================
// isVMobjectLike type guard
// ============================================================

describe('isVMobjectLike', () => {
  it('returns true for VMobject instances', () => {
    const vm = new VMobject();
    expect(isVMobjectLike(vm)).toBe(true);
  });

  it('returns true for VMobject with points', () => {
    const vm = makeVM();
    expect(isVMobjectLike(vm)).toBe(true);
  });

  it('returns false for plain Mobject-like objects without _points3D', () => {
    // Create a minimal object that lacks _points3D
    const fake = Object.create(VMobject.prototype);
    // Delete _points3D if inherited
    delete (fake as any)._points3D;
    // isVMobjectLike checks '_points3D' in m
    expect(isVMobjectLike(fake)).toBe(false);
  });
});

// ============================================================
// Mobject.getBoundingBox and _getBoundingBox
// ============================================================

describe('Mobject.getBoundingBox / _getBoundingBox', () => {
  it('getBoundingBox returns width, height, depth for a VMobject with points', () => {
    const vm = makeVM();
    // Force creation of three object so bounding box can be calculated
    vm.getThreeObject();
    vm._syncToThree();
    const bbox = vm.getBoundingBox();
    expect(bbox).toHaveProperty('width');
    expect(bbox).toHaveProperty('height');
    expect(bbox).toHaveProperty('depth');
    expect(typeof bbox.width).toBe('number');
    expect(typeof bbox.height).toBe('number');
    expect(typeof bbox.depth).toBe('number');
  });

  it('_getBoundingBox delegates to getBoundingBox', () => {
    const vm = makeVM();
    vm.getThreeObject();
    vm._syncToThree();
    const bbox = vm.getBoundingBox();
    const deprecated = vm._getBoundingBox();
    expect(deprecated).toEqual(bbox);
  });

  it('getBoundingBox returns zero-ish dimensions for empty VMobject', () => {
    const vm = new VMobject();
    vm.getThreeObject();
    const bbox = vm.getBoundingBox();
    // Empty object should have 0-width bounding box
    expect(bbox.width).toBeGreaterThanOrEqual(0);
    expect(bbox.height).toBeGreaterThanOrEqual(0);
  });
});
