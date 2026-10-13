/**
 * Regression tests for Arrow3D rebuild-after-parenting (stale render bug).
 *
 * Arrow3D rebuilds its geometry from scratch whenever setStart/setEnd (or any
 * dimension setter) changes the arrow. The old `_rebuildGeometry()` REPLACED
 * the top-level `_threeObject` Group with a brand-new one:
 *
 *   this._threeObject = this._createThreeObject();
 *
 * A Scene adds `mobject.getThreeObject()` to its THREE scene graph ONCE, at
 * add time (Scene.add → `_threeScene.add(threeObj)`), and holds that exact
 * reference. Replacing the top-level object orphans it: the scene graph keeps
 * the OLD object, the NEW object is never attached, so the scene renders the
 * stale arrow. `setEnd()` after the arrow is in a scene then updates the data
 * but NOT what renders.
 *
 * The fix rebuilds IN PLACE: the same top-level Group reference is kept, its
 * old children are removed/disposed, and the freshly built children are added
 * back. The parent link survives, so a render reflects the new geometry.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ThreeDScene } from '../../core/ThreeDScene';
import { Arrow3D } from './Arrow3D';

describe('Arrow3D rebuild preserves the parented THREE object (stale render bug)', () => {
  it('keeps the same top-level Group reference across setEnd()', () => {
    const arrow = new Arrow3D({ end: [1, 0, 0] });
    const before = arrow.getThreeObject();
    arrow.setEnd([5, 0, 0]);
    const after = arrow.getThreeObject();
    // The parent (scene graph) only holds `before`. If a rebuild swaps in a
    // new object, what the scene renders diverges from the live geometry.
    expect(after).toBe(before);
  });

  it('a plain THREE.Group parent still holds the live object after setEnd()', () => {
    const arrow = new Arrow3D({ end: [1, 0, 0] });
    const parent = new THREE.Group();
    parent.add(arrow.getThreeObject());

    arrow.setEnd([5, 0, 0]);

    const live = arrow.getThreeObject();
    expect(parent.children).toContain(live);
    // And no stale duplicate orphaned alongside it.
    expect(parent.children.length).toBe(1);
  });

  it('the object in a real ThreeDScene reflects the new end point', () => {
    const scene = ThreeDScene.createHeadless();
    const arrow = new Arrow3D({ end: [1, 0, 0] });
    scene.add(arrow);

    arrow.setEnd([5, 0, 0]);
    scene.render();

    const live = arrow.getThreeObject();
    // The live object must still be the one the scene graph renders.
    expect(scene.threeScene.children).toContain(live);

    // Bounds of the whole scene graph must extend to the new tip (~x=5),
    // not the stale tip (x=1). Reads what the scene would actually draw.
    scene.threeScene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(scene.threeScene);
    expect(box.max.x).toBeGreaterThan(4.5);

    scene.dispose();
  });

  it('setStart() is also reflected in the scene graph', () => {
    const scene = ThreeDScene.createHeadless();
    const arrow = new Arrow3D({ start: [0, 0, 0], end: [1, 0, 0] });
    scene.add(arrow);

    arrow.setStart([-4, 0, 0]);
    scene.render();

    const live = arrow.getThreeObject();
    expect(scene.threeScene.children).toContain(live);

    scene.threeScene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(scene.threeScene);
    expect(box.min.x).toBeLessThan(-3.5);

    scene.dispose();
  });

  it('rebuilt children are oriented and reach the new geometry', () => {
    const arrow = new Arrow3D({ end: [1, 0, 0] });
    arrow.getThreeObject();
    arrow.setEnd([0, 3, 0]);
    const group = arrow.getThreeObject();

    // Still a Group with shaft + tip meshes.
    const meshes: THREE.Mesh[] = [];
    group.traverse((c) => {
      if (c instanceof THREE.Mesh) meshes.push(c);
    });
    expect(meshes.length).toBe(2);

    // The group's bounding box must reach the new end (y≈3), proving the new
    // geometry (not the stale x-axis arrow) is what lives in the object.
    group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(group);
    expect(box.max.y).toBeGreaterThan(2.5);
    expect(box.max.x).toBeLessThan(0.5);
  });
});
