import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ThreeDScene } from './ThreeDScene';
import { Circle } from '../mobjects/geometry/Circle';
import { Square } from '../mobjects/geometry/Rectangle';

describe('addFixedOrientationMobjects', () => {
  it('method exists on ThreeDScene', () => {
    const scene = ThreeDScene.createHeadless();
    expect(typeof scene.addFixedOrientationMobjects).toBe('function');
    expect(typeof scene.removeFixedOrientationMobjects).toBe('function');
    scene.dispose();
  });

  it('fixed-orientation mobjects face the camera after orbit', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    scene.addFixedOrientationMobjects(circle);

    // Move camera to a different angle
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);

    // The mobject's Three.js object should have a quaternion that
    // makes it face the camera (billboard effect).
    const threeObj = circle.getThreeObject();
    const cam = scene.camera3D.getCamera();

    // Get the camera's quaternion (world orientation)
    const camQuat = cam.quaternion.clone();

    // The fixed-orientation mobject should have its quaternion set
    // to match the camera's orientation (facing the camera)
    const objQuat = threeObj.quaternion.clone();

    // They should be approximately equal - the object faces the camera
    expect(objQuat.x).toBeCloseTo(camQuat.x, 3);
    expect(objQuat.y).toBeCloseTo(camQuat.y, 3);
    expect(objQuat.z).toBeCloseTo(camQuat.z, 3);
    expect(objQuat.w).toBeCloseTo(camQuat.w, 3);

    scene.dispose();
  });

  it('non-fixed mobjects are NOT affected by camera orbit', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);

    // Move camera
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);

    const threeObj = circle.getThreeObject();
    // Normal mobjects should keep default rotation (identity quaternion)
    expect(threeObj.quaternion.x).toBeCloseTo(0, 5);
    expect(threeObj.quaternion.y).toBeCloseTo(0, 5);
    expect(threeObj.quaternion.z).toBeCloseTo(0, 5);
    expect(threeObj.quaternion.w).toBeCloseTo(1, 5);

    scene.dispose();
  });

  it('fixed-orientation mobjects remain in the main 3D scene (not HUD)', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    scene.addFixedOrientationMobjects(circle);

    // Should still be in scene.mobjects (unlike fixed-in-frame which moves to HUD)
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });

  it('removeFixedOrientationMobjects stops billboard behavior', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    scene.addFixedOrientationMobjects(circle);

    // Orbit camera
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);

    // Now remove fixed orientation
    scene.removeFixedOrientationMobjects(circle);

    // Orbit again - should NOT billboard anymore
    scene.setCameraOrientation(Math.PI / 2, 0, 15);

    const threeObj = circle.getThreeObject();
    // After removing, the quaternion should be back to identity
    // (or at least not tracking the camera)
    const cam = scene.camera3D.getCamera();
    const camQuat = cam.quaternion;

    // These should NOT match (unless camera happens to be at identity)
    // Since we're at phi=PI/2, theta=0, camera is NOT at identity
    const diff =
      Math.abs(threeObj.quaternion.x - camQuat.x) +
      Math.abs(threeObj.quaternion.y - camQuat.y) +
      Math.abs(threeObj.quaternion.z - camQuat.z) +
      Math.abs(threeObj.quaternion.w - camQuat.w);
    expect(diff).toBeGreaterThan(0.01);

    scene.dispose();
  });

  it('works with multiple mobjects', () => {
    const scene = ThreeDScene.createHeadless();
    const c1 = new Circle();
    const c2 = new Square();
    scene.add(c1, c2);
    scene.addFixedOrientationMobjects(c1, c2);

    scene.setCameraOrientation(Math.PI / 3, Math.PI / 6, 15);

    const cam = scene.camera3D.getCamera();
    const camQuat = cam.quaternion;

    for (const mob of [c1, c2]) {
      const q = mob.getThreeObject().quaternion;
      expect(q.x).toBeCloseTo(camQuat.x, 3);
      expect(q.y).toBeCloseTo(camQuat.y, 3);
      expect(q.z).toBeCloseTo(camQuat.z, 3);
      expect(q.w).toBeCloseTo(camQuat.w, 3);
    }

    scene.dispose();
  });

  it('clear() removes fixed-orientation tracking', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    scene.addFixedOrientationMobjects(circle);
    scene.clear();

    // After clear, adding a new mobject and orbiting should not crash
    const c2 = new Circle();
    scene.add(c2);
    expect(() => scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15)).not.toThrow();

    scene.dispose();
  });

  it('remove() cleans up fixed-orientation tracking and resets quaternion', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    scene.addFixedOrientationMobjects(circle);

    // Orbit so quaternion is non-identity
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);
    scene.remove(circle);

    // Quaternion should be reset to identity after removal
    const q = circle.getThreeObject().quaternion;
    expect(q.x).toBeCloseTo(0, 5);
    expect(q.y).toBeCloseTo(0, 5);
    expect(q.z).toBeCloseTo(0, 5);
    expect(q.w).toBeCloseTo(1, 5);

    scene.dispose();
  });

  it('addFixedOrientationMobjects removes from fixed-in-frame (mutually exclusive)', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);

    // First pin to HUD
    scene.addFixedInFrameMobjects(circle);

    // Then switch to fixed-orientation — should auto-remove from HUD
    scene.addFixedOrientationMobjects(circle);

    // Orbit and verify billboard behavior works
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);
    const cam = scene.camera3D.getCamera();
    const q = circle.getThreeObject().quaternion;
    expect(q.x).toBeCloseTo(cam.quaternion.x, 3);
    expect(q.y).toBeCloseTo(cam.quaternion.y, 3);
    expect(q.z).toBeCloseTo(cam.quaternion.z, 3);
    expect(q.w).toBeCloseTo(cam.quaternion.w, 3);

    scene.dispose();
  });

  it('addFixedInFrameMobjects removes from fixed-orientation (mutually exclusive)', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);

    // First set fixed orientation
    scene.addFixedOrientationMobjects(circle);

    // Then switch to fixed-in-frame — should auto-remove from orientation tracking
    scene.addFixedInFrameMobjects(circle);

    // Orbit — quaternion should NOT track camera anymore (it's in HUD now)
    scene.setCameraOrientation(Math.PI / 3, Math.PI / 4, 15);
    const cam = scene.camera3D.getCamera();
    const q = circle.getThreeObject().quaternion;

    // Should be identity (reset when removed from orientation tracking)
    expect(q.x).toBeCloseTo(0, 5);
    expect(q.y).toBeCloseTo(0, 5);
    expect(q.z).toBeCloseTo(0, 5);
    expect(q.w).toBeCloseTo(1, 5);

    scene.dispose();
  });
});
