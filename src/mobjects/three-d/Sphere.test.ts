/**
 * Regression tests for transparent 3D mesh rendering (issue #255).
 *
 * Before the fix, ThreeDScene.add() force-set depthWrite=true on every
 * mesh material, including transparent ones. A transparent sphere added
 * before a transparent plane would write its depth values and occlude
 * the plane behind it — making opacity look like "darker but still
 * opaque" and making the result depend on add order.
 *
 * The Three.js canonical recipe for transparent meshes is
 * `transparent: true, depthWrite: false`: depth-test against opaque
 * geometry, but don't write depth so further transparent fragments
 * behind aren't rejected.
 */
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { ThreeDScene } from '../../core/ThreeDScene';
import { Sphere } from './Sphere';

function getMaterial(sphere: Sphere): THREE.MeshStandardMaterial {
  const mesh = sphere.getThreeObject() as THREE.Mesh;
  return mesh.material as THREE.MeshStandardMaterial;
}

describe('Sphere opacity / depthWrite (issue #255)', () => {
  it('opaque sphere keeps depthWrite enabled after add', () => {
    const scene = ThreeDScene.createHeadless();
    const sphere = new Sphere({ radius: 1, opacity: 1 });
    scene.add(sphere);

    const mat = getMaterial(sphere);
    expect(mat.transparent).toBe(false);
    expect(mat.depthTest).toBe(true);
    expect(mat.depthWrite).toBe(true);

    scene.dispose();
  });

  it('transparent sphere has depthWrite disabled after add', () => {
    const scene = ThreeDScene.createHeadless();
    const sphere = new Sphere({ radius: 1, opacity: 0.02 });
    scene.add(sphere);

    const mat = getMaterial(sphere);
    expect(mat.transparent).toBe(true);
    expect(mat.depthTest).toBe(true);
    expect(mat.depthWrite).toBe(false);

    scene.dispose();
  });

  it('depthWrite is independent of add order for transparent meshes', () => {
    const scene = ThreeDScene.createHeadless();
    const a = new Sphere({ radius: 1, opacity: 0.3 });
    const b = new Sphere({ radius: 2, opacity: 0.3 });

    scene.add(a, b);
    expect(getMaterial(a).depthWrite).toBe(false);
    expect(getMaterial(b).depthWrite).toBe(false);

    const scene2 = ThreeDScene.createHeadless();
    const c = new Sphere({ radius: 1, opacity: 0.3 });
    const d = new Sphere({ radius: 2, opacity: 0.3 });
    scene2.add(d, c);
    expect(getMaterial(c).depthWrite).toBe(false);
    expect(getMaterial(d).depthWrite).toBe(false);

    scene.dispose();
    scene2.dispose();
  });

  it('runtime opacity change flips depthWrite on next render sync', () => {
    const scene = ThreeDScene.createHeadless();
    const sphere = new Sphere({ radius: 1, opacity: 1 });
    scene.add(sphere);

    expect(getMaterial(sphere).depthWrite).toBe(true);

    sphere.setStrokeOpacity(0.5);
    scene.render();

    const mat = getMaterial(sphere);
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);

    scene.dispose();
  });

  it('3D add resets renderOrder to 0 so Three.js sorts transparents by distance', () => {
    const scene = ThreeDScene.createHeadless();
    const a = new Sphere({ radius: 1, opacity: 0.3 });
    const b = new Sphere({ radius: 2, opacity: 0.3 });
    scene.add(a, b);

    expect(a.getThreeObject().renderOrder).toBe(0);
    expect(b.getThreeObject().renderOrder).toBe(0);

    scene.dispose();
  });

  it('addFixedInFrameMobjects applies depth settings to HUD spheres (#255)', () => {
    const scene = ThreeDScene.createHeadless();
    const hudSphere = new Sphere({ radius: 0.5, opacity: 0.5 });
    scene.addFixedInFrameMobjects(hudSphere);

    const mat = getMaterial(hudSphere);
    expect(mat.transparent).toBe(true);
    expect(mat.depthTest).toBe(true);
    expect(mat.depthWrite).toBe(false);
    expect(hudSphere.getThreeObject().renderOrder).toBe(0);

    scene.dispose();
  });

  it('addForegroundMobject still gets a high renderOrder after 3D reset', () => {
    const scene = ThreeDScene.createHeadless();
    const fg = new Sphere({ radius: 1, opacity: 1 });
    scene.addForegroundMobject(fg);

    expect(fg.getThreeObject().renderOrder).toBeGreaterThanOrEqual(10000);

    scene.dispose();
  });

  it('re-adding an existing foreground mobject does not clobber its renderOrder', () => {
    const scene = ThreeDScene.createHeadless();
    const fg = new Sphere({ radius: 1, opacity: 1 });
    scene.addForegroundMobject(fg);
    const fgRO = fg.getThreeObject().renderOrder;
    expect(fgRO).toBeGreaterThanOrEqual(10000);

    scene.add(fg);
    expect(fg.getThreeObject().renderOrder).toBe(fgRO);

    scene.dispose();
  });

  it('runtime opacity restore re-enables depthWrite on next render sync', () => {
    const scene = ThreeDScene.createHeadless();
    const sphere = new Sphere({ radius: 1, opacity: 0.5 });
    scene.add(sphere);

    expect(getMaterial(sphere).depthWrite).toBe(false);

    sphere.setStrokeOpacity(1);
    scene.render();

    const mat = getMaterial(sphere);
    expect(mat.transparent).toBe(false);
    expect(mat.depthWrite).toBe(true);

    scene.dispose();
  });
});
