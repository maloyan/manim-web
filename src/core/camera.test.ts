/**
 * Tests for Camera2DFrame, CameraFrame, and CameraExtensions.
 *
 * Camera2DFrame: syncs frame transform to Camera2D (position, scale).
 * CameraFrame: Euler angle state management, snapshot/restore, animate proxy.
 * CameraExtensions: MovingCamera, ThreeDCamera, MultiCamera.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Camera2D, Camera3D } from './Camera';
import { Camera2DFrame } from './Camera2DFrame';
import { CameraFrame, CameraFrameState, CameraAnimateProxy } from './CameraFrame';
import { MovingCamera, ThreeDCamera, MultiCamera } from './CameraExtensions';
import { Mobject } from './Mobject';
import { VMobject } from './VMobject';

// ============================================================
// Camera2DFrame
// ============================================================

describe('Camera2DFrame', () => {
  let camera: Camera2D;

  beforeEach(() => {
    camera = new Camera2D({ frameWidth: 14, frameHeight: 8 });
  });

  it('constructs with invisible defaults', () => {
    const frame = new Camera2DFrame(camera);
    expect(frame.opacity).toBe(0);
    expect(frame.fillOpacity).toBe(0);
    expect(frame.strokeWidth).toBe(0);
  });

  it('constructs with dummy Bezier points for VMobject operations', () => {
    const frame = new Camera2DFrame(camera);
    expect(frame.numPoints).toBeGreaterThanOrEqual(4);
  });

  it('primary frame initializes position from camera center', () => {
    camera.moveTo([3, 4, 10]);
    const frame = new Camera2DFrame(camera);
    // Camera2DFrame reads camera.position (THREE.js camera position)
    // and sets frame.position.set(pos.x, pos.y, 0)
    const camPos = camera.position;
    expect(frame.position.x).toBe(camPos.x);
    expect(frame.position.y).toBe(camPos.y);
  });

  it('non-primary frame does not initialize position from camera', () => {
    camera.moveTo([3, 4, 10]);
    const frame = new Camera2DFrame(camera, false);
    expect(frame.position.x).toBe(0);
    expect(frame.position.y).toBe(0);
  });

  it('getCenter returns current position', () => {
    const frame = new Camera2DFrame(camera);
    frame.position.set(5, 6, 7);
    const center = frame.getCenter();
    expect(center).toEqual([5, 6, 7]);
  });

  // ---- moveTo ----

  it('moveTo with Vector3Tuple sets position and syncs to camera', () => {
    const frame = new Camera2DFrame(camera, true);
    frame.moveTo([2, 3, 0]);
    expect(frame.position.x).toBe(2);
    expect(frame.position.y).toBe(3);
    // Camera should have moved too
    expect(camera.position.x).toBe(2);
    expect(camera.position.y).toBe(3);
  });

  it('moveTo with Mobject target centers on its getCenter()', () => {
    const frame = new Camera2DFrame(camera, true);
    const mob = new VMobject();
    mob.position.set(7, 8, 0);
    frame.moveTo(mob);
    expect(frame.position.x).toBe(7);
    expect(frame.position.y).toBe(8);
  });

  it('moveTo returns this for chaining', () => {
    const frame = new Camera2DFrame(camera, true);
    const result = frame.moveTo([1, 1, 0]);
    expect(result).toBe(frame);
  });

  // ---- _syncToCamera ----

  it('_markDirty on primary frame syncs scale to camera frame dimensions', () => {
    const frame = new Camera2DFrame(camera, true);
    frame.scaleVector.set(2, 2, 1);
    frame._markDirty();
    // After scaling by 2, the camera frameWidth should be 14 * 2 = 28
    expect(camera.frameWidth).toBe(28);
    expect(camera.frameHeight).toBe(16);
  });

  it('_markDirty on non-primary frame does NOT sync to camera', () => {
    const frame = new Camera2DFrame(camera, false);
    frame.position.set(99, 99, 0);
    frame._markDirty();
    // Camera position should be unchanged
    expect(camera.position.x).not.toBe(99);
  });

  // ---- _createCopy ----

  it('copy creates a non-primary frame with same properties', () => {
    const frame = new Camera2DFrame(camera, true);
    frame.position.set(5, 6, 0);
    frame.scaleVector.set(2, 3, 1);

    const copy = frame.copy() as Camera2DFrame;
    expect(copy.position.x).toBe(5);
    expect(copy.position.y).toBe(6);
    expect(copy.scaleVector.x).toBe(2);
    expect(copy.scaleVector.y).toBe(3);

    // Copy should not sync to camera
    copy.position.set(99, 99, 0);
    copy._markDirty();
    expect(camera.position.x).not.toBe(99);
  });

  it('copy preserves points', () => {
    const frame = new Camera2DFrame(camera, true);
    const originalPoints = frame.getPoints();
    const copy = frame.copy() as Camera2DFrame;
    const copyPoints = copy.getPoints();
    expect(copyPoints.length).toBe(originalPoints.length);
  });
});

// ============================================================
// CameraFrame
// ============================================================

describe('CameraFrame', () => {
  let frame: CameraFrame;

  beforeEach(() => {
    frame = new CameraFrame(16 / 9);
  });

  // ---- Construction ----

  it('constructs with default Euler angles', () => {
    const [theta, phi, gamma] = frame.getEulerAngles();
    expect(theta).toBeCloseTo(-Math.PI / 2);
    expect(phi).toBeCloseTo(Math.PI / 4);
    expect(gamma).toBe(0);
  });

  it('constructs with custom options', () => {
    const custom = new CameraFrame(16 / 9, {
      theta: 1,
      phi: 2,
      gamma: 0.5,
      distance: 20,
      fov: 60,
      lookAt: [1, 2, 3],
    });
    const [theta, phi, gamma] = custom.getEulerAngles();
    expect(theta).toBe(1);
    expect(phi).toBe(2);
    expect(gamma).toBe(0.5);
    expect(custom.getDistance()).toBe(20);
    expect(custom.getFieldOfView()).toBe(60);
    expect(custom.getCenter()).toEqual([1, 2, 3]);
  });

  it('getCamera3D returns Camera3D instance', () => {
    const cam = frame.getCamera3D();
    expect(cam).toBeInstanceOf(Camera3D);
  });

  it('getThreeCamera returns a PerspectiveCamera', () => {
    const threeCam = frame.getThreeCamera();
    expect(threeCam).toBeDefined();
    expect(threeCam.isPerspectiveCamera).toBe(true);
  });

  // ---- Euler angles ----

  it('setEulerAngles updates specified angles only', () => {
    frame.setEulerAngles({ theta: 0.5 });
    expect(frame.getTheta()).toBe(0.5);
    expect(frame.getPhi()).toBeCloseTo(Math.PI / 4); // unchanged
  });

  it('setEulerAngles returns this for chaining', () => {
    expect(frame.setEulerAngles({ phi: 1 })).toBe(frame);
  });

  it('setTheta/getTheta', () => {
    frame.setTheta(1.5);
    expect(frame.getTheta()).toBe(1.5);
  });

  it('incrementTheta adds delta', () => {
    const initial = frame.getTheta();
    frame.incrementTheta(0.3);
    expect(frame.getTheta()).toBeCloseTo(initial + 0.3);
  });

  it('setPhi/getPhi', () => {
    frame.setPhi(0.8);
    expect(frame.getPhi()).toBe(0.8);
  });

  it('incrementPhi adds delta', () => {
    const initial = frame.getPhi();
    frame.incrementPhi(0.2);
    expect(frame.getPhi()).toBeCloseTo(initial + 0.2);
  });

  it('setGamma/getGamma', () => {
    frame.setGamma(0.5);
    expect(frame.getGamma()).toBe(0.5);
  });

  it('incrementGamma adds delta', () => {
    frame.incrementGamma(0.1);
    expect(frame.getGamma()).toBeCloseTo(0.1);
  });

  // ---- Distance / FOV / Center ----

  it('setDistance clamps minimum to 0.1', () => {
    frame.setDistance(-5);
    expect(frame.getDistance()).toBe(0.1);
  });

  it('setDistance updates camera position', () => {
    frame.setDistance(20);
    expect(frame.getDistance()).toBe(20);
  });

  it('getFieldOfView/setFieldOfView', () => {
    frame.setFieldOfView(60);
    expect(frame.getFieldOfView()).toBe(60);
  });

  it('moveTo changes look-at center', () => {
    frame.moveTo([5, 5, 5]);
    expect(frame.getCenter()).toEqual([5, 5, 5]);
  });

  it('setAspectRatio delegates to Camera3D', () => {
    expect(frame.setAspectRatio(4 / 3)).toBe(frame);
  });

  // ---- Snapshot / restore ----

  it('_snapshot captures current state', () => {
    frame.setEulerAngles({ theta: 1, phi: 2, gamma: 0.5 });
    frame.setDistance(15);
    frame.setFieldOfView(60);
    frame.moveTo([1, 2, 3]);

    const snap = frame._snapshot();
    expect(snap.theta).toBe(1);
    expect(snap.phi).toBe(2);
    expect(snap.gamma).toBe(0.5);
    expect(snap.distance).toBe(15);
    expect(snap.fov).toBe(60);
    expect(snap.center).toEqual([1, 2, 3]);
  });

  it('_applyState restores state', () => {
    const state: CameraFrameState = {
      theta: 0.5,
      phi: 0.3,
      gamma: 0.1,
      distance: 25,
      fov: 90,
      center: [10, 20, 30],
    };
    frame._applyState(state);
    expect(frame.getTheta()).toBe(0.5);
    expect(frame.getPhi()).toBe(0.3);
    expect(frame.getGamma()).toBe(0.1);
    expect(frame.getDistance()).toBe(25);
    expect(frame.getFieldOfView()).toBe(90);
    expect(frame.getCenter()).toEqual([10, 20, 30]);
  });

  // ---- Camera position from spherical angles ----

  it('camera position updates with spherical coordinates', () => {
    frame.setEulerAngles({ theta: 0, phi: Math.PI / 2, gamma: 0 });
    frame.setDistance(10);
    frame.moveTo([0, 0, 0]);

    const camPos = frame.getThreeCamera().position;
    // At phi=PI/2, theta=0: x = 10*sin(PI/2)*cos(0) = 10, y = 10*cos(PI/2) = 0
    expect(camPos.x).toBeCloseTo(10);
    expect(camPos.y).toBeCloseTo(0);
  });

  it('gamma roll rotates camera up vector', () => {
    frame.setGamma(Math.PI / 4);
    const cam = frame.getThreeCamera();
    // Up vector should be rotated from default (0,1,0)
    expect(cam.up.length()).toBeCloseTo(1);
  });

  // ---- Animate proxy ----

  it('animate returns a CameraAnimateProxy', () => {
    const proxy = frame.animate;
    expect(proxy).toBeInstanceOf(CameraAnimateProxy);
  });

  it('animateTo returns a CameraAnimateProxy with custom duration', () => {
    const proxy = frame.animateTo({ duration: 2 });
    expect(proxy).toBeInstanceOf(CameraAnimateProxy);
    expect(proxy.duration).toBe(2);
  });

  it('mobjectStub provides a valid Mobject for animation system', () => {
    const stub = frame.mobjectStub;
    expect(stub).toBeInstanceOf(Mobject);
    // Stub should support copy
    const copy = stub.copy();
    expect(copy).toBeInstanceOf(Mobject);
  });
});

// ============================================================
// CameraAnimateProxy
// ============================================================

describe('CameraAnimateProxy', () => {
  let frame: CameraFrame;

  beforeEach(() => {
    frame = new CameraFrame(16 / 9, {
      theta: 0,
      phi: Math.PI / 4,
      gamma: 0,
      distance: 10,
      fov: 45,
      lookAt: [0, 0, 0],
    });
  });

  it('incrementTheta records delta and interpolates', () => {
    const proxy = frame.animate.incrementTheta(Math.PI / 2);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getTheta()).toBeCloseTo(Math.PI / 4); // halfway from 0 to PI/2
  });

  it('incrementPhi records delta and interpolates', () => {
    const proxy = frame.animate.incrementPhi(0.5);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getPhi()).toBeCloseTo(Math.PI / 4 + 0.5);
  });

  it('incrementGamma records delta and interpolates', () => {
    const proxy = frame.animate.incrementGamma(0.3);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getGamma()).toBeCloseTo(0.3);
  });

  it('setEulerAngles with absolute values', () => {
    const proxy = frame.animate.setEulerAngles({ theta: 1, phi: 0.5 });
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getTheta()).toBeCloseTo(1);
    expect(frame.getPhi()).toBeCloseTo(0.5);
  });

  it('setDistance animate', () => {
    const proxy = frame.animate.setDistance(20);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getDistance()).toBeCloseTo(15); // halfway 10 to 20
  });

  it('setFieldOfView animate', () => {
    const proxy = frame.animate.setFieldOfView(90);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getFieldOfView()).toBeCloseTo(90);
  });

  it('moveTo animate', () => {
    const proxy = frame.animate.moveTo([10, 0, 0]);
    proxy.begin();
    proxy.interpolate(0.5);
    const center = frame.getCenter();
    expect(center[0]).toBeCloseTo(5);
  });

  it('chaining multiple operations', () => {
    const proxy = frame.animate.incrementTheta(1).setDistance(20).setFieldOfView(60);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getTheta()).toBeCloseTo(1);
    expect(frame.getDistance()).toBeCloseTo(20);
    expect(frame.getFieldOfView()).toBeCloseTo(60);
  });

  it('finish calls interpolate(1) and super.finish()', () => {
    const proxy = frame.animate.incrementTheta(1);
    proxy.begin();
    proxy.finish();
    expect(frame.getTheta()).toBeCloseTo(1);
  });

  it('withDuration overrides duration', () => {
    const proxy = frame.animate.incrementTheta(1).withDuration(3);
    expect(proxy.duration).toBe(3);
  });

  it('withRateFunc overrides rate function', () => {
    const linear = (t: number) => t;
    const proxy = frame.animate.incrementTheta(1).withRateFunc(linear);
    expect(proxy.rateFunc).toBe(linear);
  });

  it('getFrame returns the CameraFrame', () => {
    const proxy = frame.animate;
    expect(proxy.getFrame()).toBe(frame);
  });
});

// ============================================================
// MovingCamera
// ============================================================

describe('MovingCamera', () => {
  it('constructs with default zoom of 1', () => {
    const cam = new MovingCamera();
    expect(cam.zoom).toBe(1);
  });

  it('constructs with custom zoom', () => {
    const cam = new MovingCamera({ zoom: 2 });
    expect(cam.zoom).toBe(2);
  });

  it('zoom setter clamps to minimum 0.01', () => {
    const cam = new MovingCamera();
    cam.zoom = -5;
    expect(cam.zoom).toBe(0.01);
  });

  it('zoom setter adjusts frame dimensions', () => {
    const cam = new MovingCamera({ frameWidth: 14, frameHeight: 8 });
    cam.zoom = 2;
    // Zooming in by 2x means frame dimensions halved
    expect(cam.frameWidth).toBe(7);
    expect(cam.frameHeight).toBe(4);
  });

  it('setTargetPosition sets target for animation', () => {
    const cam = new MovingCamera();
    const result = cam.setTargetPosition([5, 5, 10]);
    expect(result).toBe(cam);
  });

  it('setTargetZoom sets target and clamps', () => {
    const cam = new MovingCamera();
    const result = cam.setTargetZoom(3);
    expect(result).toBe(cam);
  });

  it('setTargetZoom clamps to minimum 0.01', () => {
    const cam = new MovingCamera();
    cam.setTargetZoom(-1);
    // The target is clamped internally
    cam.animateTo({ zoom: -1 });
    // Start animating
    cam.update(1);
    // After animation, zoom should still be at least 0.01
    expect(cam.zoom).toBeGreaterThanOrEqual(0.01);
  });

  it('animateTo sets up animation state', () => {
    const cam = new MovingCamera();
    cam.animateTo({ position: [5, 5, 10], zoom: 2, duration: 2 });
    expect(cam.isAnimating()).toBe(true);
  });

  it('animateTo with easing function', () => {
    const cam = new MovingCamera();
    const linear = (t: number) => t;
    cam.animateTo({ position: [10, 0, 10], easing: linear, duration: 1 });
    expect(cam.isAnimating()).toBe(true);
  });

  it('isAnimating returns false when no targets', () => {
    const cam = new MovingCamera();
    expect(cam.isAnimating()).toBe(false);
  });

  it('update advances animation progress', () => {
    const cam = new MovingCamera({ position: [0, 0, 10] });
    cam.animateTo({ position: [10, 0, 10], duration: 1 });
    cam.update(0.5);
    // Position should be partway through
    expect(cam.position.x).toBeGreaterThan(0);
    expect(cam.position.x).toBeLessThan(10);
  });

  it('update completes animation', () => {
    const cam = new MovingCamera({ position: [0, 0, 10] });
    cam.animateTo({ position: [10, 0, 10], duration: 1 });
    cam.update(2); // exceed duration
    expect(cam.isAnimating()).toBe(false);
    expect(cam.position.x).toBeCloseTo(10);
  });

  it('update interpolates zoom', () => {
    const cam = new MovingCamera({ zoom: 1 });
    cam.animateTo({ zoom: 2, duration: 1 });
    cam.update(2); // complete animation
    expect(cam.zoom).toBeCloseTo(2);
  });

  it('follow tracks a mobject', () => {
    const cam = new MovingCamera();
    const mob = new VMobject();
    mob.position.set(5, 5, 0);
    cam.follow(mob);
    cam.update(0.016);
    expect(cam.position.x).toBeCloseTo(5);
    expect(cam.position.y).toBeCloseTo(5);
  });

  it('follow with offset', () => {
    const cam = new MovingCamera();
    const mob = new VMobject();
    mob.position.set(5, 5, 0);
    cam.follow(mob, [1, 0, 0]);
    cam.update(0.016);
    expect(cam.position.x).toBeCloseTo(6);
    expect(cam.position.y).toBeCloseTo(5);
  });

  it('stopFollowing stops tracking', () => {
    const cam = new MovingCamera();
    const mob = new VMobject();
    mob.position.set(5, 5, 0);
    cam.follow(mob);
    cam.stopFollowing();
    cam.update(0.016);
    // Should not have moved to mob's position (position depends on initial)
    expect(cam.position.x).not.toBeCloseTo(5);
  });

  it('resetAnimation clears animation state', () => {
    const cam = new MovingCamera();
    cam.animateTo({ position: [10, 0, 10], zoom: 2, duration: 1 });
    cam.resetAnimation();
    expect(cam.isAnimating()).toBe(false);
  });

  it('update with no animation does nothing', () => {
    const cam = new MovingCamera({ position: [1, 2, 10] });
    const x0 = cam.position.x;
    cam.update(0.016);
    expect(cam.position.x).toBe(x0);
  });
});

// ============================================================
// ThreeDCamera
// ============================================================

describe('ThreeDCamera', () => {
  it('constructs with default values', () => {
    const cam = new ThreeDCamera();
    expect(cam.phi).toBeCloseTo(Math.PI / 4);
    expect(cam.theta).toBeCloseTo(-Math.PI / 2);
    expect(cam.distance).toBe(10);
  });

  it('constructs with custom options', () => {
    const cam = new ThreeDCamera(16 / 9, {
      phi: 1,
      theta: 2,
      distance: 20,
      focalDistance: 15,
      depthOfField: 0.5,
    });
    expect(cam.phi).toBe(1);
    expect(cam.theta).toBe(2);
    expect(cam.distance).toBe(20);
    expect(cam.focalDistance).toBe(15);
    expect(cam.depthOfField).toBe(0.5);
  });

  it('focalDistance setter clamps to minimum 0.1', () => {
    const cam = new ThreeDCamera();
    cam.focalDistance = -5;
    expect(cam.focalDistance).toBe(0.1);
  });

  it('depthOfField setter clamps to minimum 0', () => {
    const cam = new ThreeDCamera();
    cam.depthOfField = -1;
    expect(cam.depthOfField).toBe(0);
  });

  it('setSphericalPosition updates phi, theta, and distance', () => {
    const cam = new ThreeDCamera();
    cam.setSphericalPosition(1, 2, 15);
    expect(cam.phi).toBe(1);
    expect(cam.theta).toBe(2);
    expect(cam.distance).toBe(15);
  });

  it('setSphericalPosition clamps distance', () => {
    const cam = new ThreeDCamera();
    cam.setSphericalPosition(1, 2, -5);
    expect(cam.distance).toBe(0.1);
  });

  it('setSphericalPosition without distance keeps current', () => {
    const cam = new ThreeDCamera(16 / 9, { distance: 20 });
    cam.setSphericalPosition(1, 2);
    expect(cam.distance).toBe(20);
  });

  it('orbit adjusts phi and theta relatively', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: Math.PI / 4, theta: 0 });
    cam.orbit(0.1, 0.2);
    expect(cam.phi).toBeCloseTo(Math.PI / 4 + 0.1);
    expect(cam.theta).toBeCloseTo(0.2);
  });

  it('orbit clamps phi to avoid singularities', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: Math.PI / 4 });
    // Try to orbit way past bottom
    cam.orbit(Math.PI, 0);
    expect(cam.phi).toBeLessThan(Math.PI);
    expect(cam.phi).toBeGreaterThan(0);
  });

  it('setDistance clamps to minimum 0.1', () => {
    const cam = new ThreeDCamera();
    cam.setDistance(-10);
    expect(cam.distance).toBe(0.1);
  });

  it('zoomBy adjusts distance', () => {
    const cam = new ThreeDCamera(16 / 9, { distance: 10 });
    cam.zoomBy(2); // zoom in -> distance halved
    expect(cam.distance).toBeCloseTo(5);
  });

  it('setTarget updates look-at point', () => {
    const cam = new ThreeDCamera();
    cam.setTarget([5, 5, 5]);
    // Camera position should reflect new target
    const pos = cam.getCamera().position;
    expect(pos).toBeDefined();
  });

  it('animateOrbit sets up animation', () => {
    const cam = new ThreeDCamera();
    cam.animateOrbit({ phi: 1, theta: 2, distance: 20, duration: 2 });
    expect(cam.isAnimating()).toBe(true);
  });

  it('isAnimating returns false initially', () => {
    const cam = new ThreeDCamera();
    expect(cam.isAnimating()).toBe(false);
  });

  it('update advances orbit animation', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: 0.5, theta: 0, distance: 10 });
    cam.animateOrbit({ phi: 1.5, theta: 1, distance: 20, duration: 1 });
    cam.update(0.5);
    // Should be partway through
    expect(cam.phi).toBeGreaterThan(0.5);
    expect(cam.phi).toBeLessThan(1.5);
  });

  it('update completes orbit animation', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: 0.5, theta: 0, distance: 10 });
    cam.animateOrbit({ phi: 1.5, theta: 1, distance: 20, duration: 1 });
    cam.update(2); // exceed duration
    expect(cam.isAnimating()).toBe(false);
    expect(cam.phi).toBeCloseTo(1.5);
    expect(cam.theta).toBeCloseTo(1);
    expect(cam.distance).toBeCloseTo(20);
  });

  it('update with no animation is a no-op', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: 0.5 });
    cam.update(0.016);
    expect(cam.phi).toBeCloseTo(0.5);
  });

  it('getSphericalPosition returns current angles and distance', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: 1, theta: 2, distance: 15 });
    const pos = cam.getSphericalPosition();
    expect(pos.phi).toBe(1);
    expect(pos.theta).toBe(2);
    expect(pos.distance).toBe(15);
  });

  it('animateOrbit with partial options', () => {
    const cam = new ThreeDCamera(16 / 9, { phi: 0.5, theta: 0, distance: 10 });
    cam.animateOrbit({ phi: 1.5 }); // only phi
    cam.update(2);
    expect(cam.phi).toBeCloseTo(1.5);
    expect(cam.theta).toBeCloseTo(0); // unchanged
    expect(cam.distance).toBeCloseTo(10); // unchanged
  });
});

// ============================================================
// MultiCamera
// ============================================================

describe('MultiCamera', () => {
  it('constructs empty', () => {
    const mc = new MultiCamera();
    expect(mc.count).toBe(0);
    expect(mc.activeCamera).toBeNull();
  });

  it('constructs with initial cameras', () => {
    const cam1 = new Camera2D();
    const cam2 = new Camera2D();
    const mc = new MultiCamera({
      cameras: [
        { camera: cam1, viewport: { x: 0, y: 0, width: 0.5, height: 1 }, label: 'left' },
        { camera: cam2, viewport: { x: 0.5, y: 0, width: 0.5, height: 1 }, label: 'right' },
      ],
    });
    expect(mc.count).toBe(2);
  });

  it('addCamera returns the index', () => {
    const mc = new MultiCamera();
    const cam = new Camera2D();
    const idx = mc.addCamera(cam, { x: 0, y: 0, width: 1, height: 1 }, 'main');
    expect(idx).toBe(0);
  });

  it('removeCamera removes by index', () => {
    const mc = new MultiCamera();
    const cam = new Camera2D();
    mc.addCamera(cam, { x: 0, y: 0, width: 1, height: 1 });
    const removed = mc.removeCamera(0);
    expect(removed).toBe(true);
    expect(mc.count).toBe(0);
  });

  it('removeCamera returns false for invalid index', () => {
    const mc = new MultiCamera();
    expect(mc.removeCamera(0)).toBe(false);
    expect(mc.removeCamera(-1)).toBe(false);
  });

  it('removeCamera adjusts activeIndex when needed', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 0.5, height: 1 });
    mc.addCamera(new Camera2D(), { x: 0.5, y: 0, width: 0.5, height: 1 });
    mc.setActiveCamera(1);
    mc.removeCamera(1);
    expect(mc.activeIndex).toBe(0);
  });

  it('setActiveCamera changes active camera', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 0.5, height: 1 });
    mc.addCamera(new Camera2D(), { x: 0.5, y: 0, width: 0.5, height: 1 });
    mc.setActiveCamera(1);
    expect(mc.activeIndex).toBe(1);
  });

  it('setActiveCamera ignores invalid index', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 1, height: 1 });
    mc.setActiveCamera(99);
    expect(mc.activeIndex).toBe(0);
  });

  it('setCameraEnabled toggles camera', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 1, height: 1 });
    mc.setCameraEnabled(0, false);
    expect(mc.cameras[0].enabled).toBe(false);
  });

  it('setCameraEnabled ignores invalid index', () => {
    const mc = new MultiCamera();
    mc.setCameraEnabled(99, false); // should not throw
  });

  it('setViewport updates camera viewport', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 1, height: 1 });
    mc.setViewport(0, { width: 0.5 });
    expect(mc.cameras[0].viewport.width).toBe(0.5);
    expect(mc.cameras[0].viewport.height).toBe(1); // unchanged
  });

  it('setViewport ignores invalid index', () => {
    const mc = new MultiCamera();
    mc.setViewport(99, { width: 0.5 }); // should not throw
  });

  it('getCamera returns entry or null', () => {
    const mc = new MultiCamera();
    const cam = new Camera2D();
    mc.addCamera(cam, { x: 0, y: 0, width: 1, height: 1 });
    expect(mc.getCamera(0)?.camera).toBe(cam);
    expect(mc.getCamera(99)).toBeNull();
  });

  it('getCameraByLabel finds camera', () => {
    const mc = new MultiCamera();
    const cam = new Camera2D();
    mc.addCamera(cam, { x: 0, y: 0, width: 1, height: 1 }, 'main');
    expect(mc.getCameraByLabel('main')?.camera).toBe(cam);
    expect(mc.getCameraByLabel('nope')).toBeNull();
  });

  it('getEnabledCameras returns only enabled ones', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 0.5, height: 1 });
    mc.addCamera(new Camera2D(), { x: 0.5, y: 0, width: 0.5, height: 1 });
    mc.setCameraEnabled(1, false);
    expect(mc.getEnabledCameras().length).toBe(1);
  });

  it('setupHorizontalSplit creates two cameras side by side', () => {
    const mc = new MultiCamera();
    mc.setupHorizontalSplit(new Camera2D(), new Camera2D());
    expect(mc.count).toBe(2);
    expect(mc.getCameraByLabel('left')).not.toBeNull();
    expect(mc.getCameraByLabel('right')).not.toBeNull();
  });

  it('setupVerticalSplit creates two cameras stacked', () => {
    const mc = new MultiCamera();
    mc.setupVerticalSplit(new Camera2D(), new Camera2D());
    expect(mc.count).toBe(2);
    expect(mc.getCameraByLabel('top')).not.toBeNull();
    expect(mc.getCameraByLabel('bottom')).not.toBeNull();
  });

  it('setupPictureInPicture creates main + pip cameras', () => {
    const mc = new MultiCamera();
    mc.setupPictureInPicture(new Camera2D(), new Camera2D(), 'top-left', 0.3);
    expect(mc.count).toBe(2);
    expect(mc.getCameraByLabel('main')).not.toBeNull();
    expect(mc.getCameraByLabel('pip')).not.toBeNull();
  });

  it('setupPictureInPicture default position is bottom-right', () => {
    const mc = new MultiCamera();
    mc.setupPictureInPicture(new Camera2D(), new Camera2D());
    expect(mc.count).toBe(2);
    const pip = mc.getCameraByLabel('pip');
    expect(pip).not.toBeNull();
    // bottom-right: x should be near 1 - size - margin
    expect(pip!.viewport.x).toBeCloseTo(1 - 0.25 - 0.02);
    expect(pip!.viewport.y).toBeCloseTo(0.02);
  });

  it('setupPictureInPicture top-right position', () => {
    const mc = new MultiCamera();
    mc.setupPictureInPicture(new Camera2D(), new Camera2D(), 'top-right', 0.25);
    const pip = mc.getCameraByLabel('pip');
    expect(pip!.viewport.x).toBeCloseTo(1 - 0.25 - 0.02);
    expect(pip!.viewport.y).toBeCloseTo(1 - 0.25 - 0.02);
  });

  it('setupPictureInPicture bottom-left position', () => {
    const mc = new MultiCamera();
    mc.setupPictureInPicture(new Camera2D(), new Camera2D(), 'bottom-left', 0.25);
    const pip = mc.getCameraByLabel('pip');
    expect(pip!.viewport.x).toBeCloseTo(0.02);
    expect(pip!.viewport.y).toBeCloseTo(0.02);
  });

  it('setupQuadView creates four cameras', () => {
    const mc = new MultiCamera();
    mc.setupQuadView([new Camera2D(), new Camera2D(), new Camera2D(), new Camera2D()]);
    expect(mc.count).toBe(4);
    expect(mc.getCameraByLabel('top-left')).not.toBeNull();
    expect(mc.getCameraByLabel('top-right')).not.toBeNull();
    expect(mc.getCameraByLabel('bottom-left')).not.toBeNull();
    expect(mc.getCameraByLabel('bottom-right')).not.toBeNull();
  });

  it('update calls update on MovingCamera and ThreeDCamera instances', () => {
    const mc = new MultiCamera();
    const movCam = new MovingCamera();
    const tdCam = new ThreeDCamera();
    const cam2d = new Camera2D();

    mc.addCamera(movCam, { x: 0, y: 0, width: 0.5, height: 1 });
    mc.addCamera(tdCam, { x: 0.5, y: 0, width: 0.5, height: 1 });
    mc.addCamera(cam2d, { x: 0, y: 0, width: 1, height: 1 });

    // Set up an animation on MovingCamera to verify update is called
    movCam.animateTo({ position: [10, 0, 10], duration: 1 });

    // Should not throw
    mc.update(0.016);
    expect(movCam.position.x).toBeGreaterThan(0);
  });

  it('clear removes all cameras', () => {
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 1, height: 1 });
    mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 1, height: 1 });
    mc.clear();
    expect(mc.count).toBe(0);
    expect(mc.activeIndex).toBe(0);
  });

  describe('render()', () => {
    function createMockRenderer() {
      return {
        setScissorTest: vi.fn(),
        setViewport: vi.fn(),
        setScissor: vi.fn(),
        render: vi.fn(),
      } as unknown as THREE.WebGLRenderer;
    }

    it('enables scissor test, renders each enabled camera, then disables', () => {
      const mc = new MultiCamera();
      const cam1 = new Camera2D();
      const cam2 = new Camera2D();
      mc.addCamera(cam1, { x: 0, y: 0, width: 0.5, height: 1 }, 'left');
      mc.addCamera(cam2, { x: 0.5, y: 0, width: 0.5, height: 1 }, 'right');

      const renderer = createMockRenderer();
      const scene = new THREE.Scene();

      mc.render(renderer, scene, 800, 600);

      // setScissorTest(true) at start, setScissorTest(false) at end
      expect(renderer.setScissorTest).toHaveBeenCalledTimes(2);
      expect(renderer.setScissorTest).toHaveBeenNthCalledWith(1, true);
      expect(renderer.setScissorTest).toHaveBeenNthCalledWith(2, false);

      // Both cameras should be rendered
      expect(renderer.render).toHaveBeenCalledTimes(2);

      // Viewport should be set for each camera + reset at end
      expect(renderer.setViewport).toHaveBeenCalledTimes(3); // 2 cameras + 1 reset
      // Last setViewport resets to full canvas
      expect(renderer.setViewport).toHaveBeenLastCalledWith(0, 0, 800, 600);
    });

    it('skips disabled cameras', () => {
      const mc = new MultiCamera();
      mc.addCamera(new Camera2D(), { x: 0, y: 0, width: 0.5, height: 1 });
      mc.addCamera(new Camera2D(), { x: 0.5, y: 0, width: 0.5, height: 1 });
      mc.setCameraEnabled(1, false);

      const renderer = createMockRenderer();
      const scene = new THREE.Scene();

      mc.render(renderer, scene, 800, 600);

      // Only 1 camera rendered (second one disabled)
      expect(renderer.render).toHaveBeenCalledTimes(1);
    });

    it('sets correct viewport pixel coordinates from fractional viewports', () => {
      const mc = new MultiCamera();
      mc.addCamera(new Camera2D(), { x: 0.25, y: 0.1, width: 0.5, height: 0.8 });

      const renderer = createMockRenderer();
      const scene = new THREE.Scene();

      mc.render(renderer, scene, 1000, 500);

      // x = floor(0.25 * 1000) = 250
      // y = floor(0.1 * 500) = 50
      // width = floor(0.5 * 1000) = 500
      // height = floor(0.8 * 500) = 400
      expect(renderer.setViewport).toHaveBeenNthCalledWith(1, 250, 50, 500, 400);
      expect(renderer.setScissor).toHaveBeenNthCalledWith(1, 250, 50, 500, 400);
    });

    it('updates camera aspect ratio before rendering', () => {
      const mc = new MultiCamera();
      const cam = new Camera2D();
      const setAspectSpy = vi.spyOn(cam, 'setAspectRatio');
      mc.addCamera(cam, { x: 0, y: 0, width: 0.5, height: 1 });

      const renderer = createMockRenderer();
      const scene = new THREE.Scene();

      mc.render(renderer, scene, 800, 600);

      // aspectRatio = floor(0.5 * 800) / floor(1 * 600) = 400 / 600
      expect(setAspectSpy).toHaveBeenCalledWith(400 / 600);
    });

    it('renders with no cameras without error', () => {
      const mc = new MultiCamera();
      const renderer = createMockRenderer();
      const scene = new THREE.Scene();

      mc.render(renderer, scene, 800, 600);

      // No cameras to render, but still calls setScissorTest and setViewport
      expect(renderer.render).not.toHaveBeenCalled();
      expect(renderer.setScissorTest).toHaveBeenCalledTimes(2);
    });
  });
});
