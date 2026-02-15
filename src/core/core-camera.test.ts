import { describe, it, expect } from 'vitest';
import { Camera2D } from './Camera';
import { Camera2DFrame } from './Camera2DFrame';
import { CameraFrame, CameraAnimateProxy } from './CameraFrame';
import { Mobject } from './Mobject';
import { VMobject } from './VMobject';
import { linear } from '../rate-functions';

describe('Camera2DFrame', () => {
  function makeCam(fw = 14, fh = 8) {
    return new Camera2D({ frameWidth: fw, frameHeight: fh });
  }

  it('constructs with invisible visual properties and dummy points', () => {
    const frame = new Camera2DFrame(makeCam());
    expect(frame.opacity).toBe(0);
    expect(frame.fillOpacity).toBe(0);
    expect(frame.strokeWidth).toBe(0);
    expect(frame.numPoints).toBeGreaterThan(0);
  });

  it('primary frame initializes position from camera center', () => {
    const frame = new Camera2DFrame(new Camera2D(), true);
    expect(frame.position.x).toBeCloseTo(0);
    expect(frame.position.y).toBeCloseTo(0);
  });

  it('non-primary frame does not sync position from camera', () => {
    const frame = new Camera2DFrame(new Camera2D({ position: [3, 5, 10] }), false);
    expect(frame.position.x).toBe(0);
    expect(frame.position.y).toBe(0);
  });

  it('getCenter returns current position', () => {
    const frame = new Camera2DFrame(makeCam());
    frame.position.set(2, 3, 0);
    const c = frame.getCenter();
    expect(c[0]).toBeCloseTo(2);
    expect(c[1]).toBeCloseTo(3);
    expect(c[2]).toBeCloseTo(0);
  });

  it('moveTo with array sets position and syncs camera', () => {
    const cam = makeCam();
    const frame = new Camera2DFrame(cam, true);
    const result = frame.moveTo([5, 7, 0]);
    expect(result).toBe(frame);
    expect(frame.position.x).toBeCloseTo(5);
    expect(frame.position.y).toBeCloseTo(7);
    expect(cam.position.x).toBeCloseTo(5);
    expect(cam.position.y).toBeCloseTo(7);
  });

  it('moveTo with Mobject centers on the mobject', () => {
    const frame = new Camera2DFrame(makeCam(), true);
    const mob = new VMobject();
    mob.moveTo([4, 6, 0]);
    frame.moveTo(mob);
    expect(frame.position.x).toBeCloseTo(4);
    expect(frame.position.y).toBeCloseTo(6);
  });

  it('scale on primary frame syncs frameWidth/Height to camera', () => {
    const cam = makeCam(14, 8);
    const frame = new Camera2DFrame(cam, true);
    frame.scale(2);
    expect(cam.frameWidth).toBeCloseTo(28);
    expect(cam.frameHeight).toBeCloseTo(16);
  });

  it('scale on non-primary frame does not sync to camera', () => {
    const cam = makeCam(14, 8);
    const frame = new Camera2DFrame(cam, false);
    frame.scale(2);
    expect(cam.frameWidth).toBeCloseTo(14);
    expect(cam.frameHeight).toBeCloseTo(8);
  });

  it('copy returns a non-primary clone with matching state', () => {
    const cam = makeCam();
    const frame = new Camera2DFrame(cam, true);
    frame.moveTo([3, 4, 0]);
    frame.scale(1.5);
    const copy = frame.copy() as Camera2DFrame;
    expect(copy.position.x).toBeCloseTo(3);
    expect(copy.position.y).toBeCloseTo(4);
    expect(copy.scaleVector.x).toBeCloseTo(1.5);
    expect(copy.opacity).toBe(0);
    expect(copy.fillOpacity).toBe(0);
    expect(copy.strokeWidth).toBe(0);
    expect(copy.numPoints).toBe(frame.numPoints);
    // Non-primary: further changes do not affect camera
    copy.moveTo([10, 10, 0]);
    expect(cam.position.x).toBeCloseTo(3);
    expect(cam.position.y).toBeCloseTo(4);
  });

  it('generateTarget creates a modifiable copy', () => {
    const frame = new Camera2DFrame(makeCam(), true);
    const target = frame.generateTarget();
    expect(target).not.toBe(frame);
    expect(frame.targetCopy).toBe(target);
  });

  it('saveState stores a copy that can be used later', () => {
    const frame = new Camera2DFrame(makeCam(), true);
    frame.moveTo([1, 2, 0]);
    frame.saveState();
    expect(frame.savedState).toBeDefined();
    expect(frame.savedState!.position.x).toBeCloseTo(1);
    expect(frame.savedState!.position.y).toBeCloseTo(2);
  });

  it('_markDirty on primary frame syncs camera position', () => {
    const cam = makeCam();
    const frame = new Camera2DFrame(cam, true);
    frame.position.set(9, 8, 0);
    frame._markDirty();
    expect(cam.position.x).toBeCloseTo(9);
    expect(cam.position.y).toBeCloseTo(8);
  });

  it('shift on primary frame updates camera', () => {
    const cam = makeCam();
    const frame = new Camera2DFrame(cam, true);
    frame.shift([2, 3, 0]);
    expect(cam.position.x).toBeCloseTo(2);
    expect(cam.position.y).toBeCloseTo(3);
  });
});

describe('CameraFrame', () => {
  it('constructs with default Euler angles', () => {
    const frame = new CameraFrame();
    const [theta, phi, gamma] = frame.getEulerAngles();
    expect(theta).toBeCloseTo(-Math.PI / 2);
    expect(phi).toBeCloseTo(Math.PI / 4);
    expect(gamma).toBe(0);
  });

  it('constructs with custom options', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: 1.0,
      phi: 0.5,
      gamma: 0.2,
      distance: 20,
      fov: 60,
    });
    expect(frame.getTheta()).toBeCloseTo(1.0);
    expect(frame.getPhi()).toBeCloseTo(0.5);
    expect(frame.getGamma()).toBeCloseTo(0.2);
    expect(frame.getDistance()).toBe(20);
    expect(frame.getFieldOfView()).toBe(60);
  });

  it('getCamera3D and getThreeCamera return valid cameras', () => {
    const frame = new CameraFrame();
    expect(frame.getCamera3D()).toBeDefined();
    expect(frame.getCamera3D().getCamera).toBeDefined();
    expect(frame.getThreeCamera().isPerspectiveCamera).toBe(true);
  });

  it('setTheta/setPhi/setGamma update and return this', () => {
    const frame = new CameraFrame();
    expect(frame.setTheta(1.5)).toBe(frame);
    expect(frame.getTheta()).toBeCloseTo(1.5);
    expect(frame.setPhi(0.8)).toBe(frame);
    expect(frame.getPhi()).toBeCloseTo(0.8);
    expect(frame.setGamma(0.3)).toBe(frame);
    expect(frame.getGamma()).toBeCloseTo(0.3);
  });

  it('incrementTheta/Phi/Gamma add deltas', () => {
    const frame = new CameraFrame();
    const t0 = frame.getTheta();
    const p0 = frame.getPhi();
    frame.incrementTheta(0.5);
    frame.incrementPhi(0.3);
    frame.incrementGamma(0.1);
    expect(frame.getTheta()).toBeCloseTo(t0 + 0.5);
    expect(frame.getPhi()).toBeCloseTo(p0 + 0.3);
    expect(frame.getGamma()).toBeCloseTo(0.1);
  });

  it('setEulerAngles sets multiple angles, leaves others unchanged', () => {
    const frame = new CameraFrame(16 / 9, { theta: 1.0, phi: 0.5 });
    frame.setEulerAngles({ gamma: 0.7 });
    expect(frame.getTheta()).toBeCloseTo(1.0);
    expect(frame.getPhi()).toBeCloseTo(0.5);
    expect(frame.getGamma()).toBeCloseTo(0.7);
  });

  it('setDistance clamps to minimum 0.1', () => {
    const frame = new CameraFrame();
    frame.setDistance(0.01);
    expect(frame.getDistance()).toBeCloseTo(0.1);
    frame.setDistance(-5);
    expect(frame.getDistance()).toBeCloseTo(0.1);
  });

  it('setDistance updates and returns this', () => {
    const frame = new CameraFrame();
    expect(frame.setDistance(15)).toBe(frame);
    expect(frame.getDistance()).toBe(15);
  });

  it('setFieldOfView updates fov', () => {
    const frame = new CameraFrame();
    frame.setFieldOfView(90);
    expect(frame.getFieldOfView()).toBe(90);
  });

  it('getCenter and moveTo control look-at center', () => {
    const frame = new CameraFrame(16 / 9, { lookAt: [1, 2, 3] });
    expect(frame.getCenter()).toEqual([1, 2, 3]);
    expect(frame.moveTo([5, 6, 7])).toBe(frame);
    const c = frame.getCenter();
    expect(c[0]).toBeCloseTo(5);
    expect(c[1]).toBeCloseTo(6);
    expect(c[2]).toBeCloseTo(7);
  });

  it('setAspectRatio returns this', () => {
    expect(new CameraFrame().setAspectRatio(4 / 3)).toBeInstanceOf(CameraFrame);
  });

  it('mobjectStub is a Mobject instance', () => {
    expect(new CameraFrame().mobjectStub).toBeInstanceOf(Mobject);
  });

  it('camera position reflects spherical coordinates', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: -Math.PI / 2,
      phi: Math.PI / 2,
      distance: 10,
    });
    const cam = frame.getThreeCamera();
    expect(cam.position.x).toBeCloseTo(0, 4);
    expect(cam.position.y).toBeCloseTo(0, 4);
    expect(cam.position.z).toBeCloseTo(-10, 4);
  });

  it('camera position updates when theta changes', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: 0,
      phi: Math.PI / 2,
      distance: 10,
    });
    const cam = frame.getThreeCamera();
    expect(cam.position.x).toBeCloseTo(10, 4);
    expect(cam.position.z).toBeCloseTo(0, 4);
    frame.setTheta(Math.PI / 2);
    expect(cam.position.x).toBeCloseTo(0, 4);
    expect(cam.position.z).toBeCloseTo(10, 4);
  });

  it('gamma applies roll to the camera up vector', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: -Math.PI / 2,
      phi: Math.PI / 4,
      gamma: Math.PI / 4,
      distance: 10,
    });
    const up = frame.getThreeCamera().up;
    expect(up.x === 0 && up.y === 1 && up.z === 0).toBe(false);
  });

  it('gamma=0 leaves up vector as world Y', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: -Math.PI / 2,
      phi: Math.PI / 4,
      gamma: 0,
      distance: 10,
    });
    const up = frame.getThreeCamera().up;
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeCloseTo(1);
    expect(up.z).toBeCloseTo(0);
  });
});

describe('CameraFrame snapshot/restore', () => {
  it('_snapshot captures current state', () => {
    const frame = new CameraFrame(16 / 9, {
      theta: 1.0,
      phi: 0.5,
      gamma: 0.2,
      distance: 15,
      fov: 60,
      lookAt: [1, 2, 3],
    });
    const s = frame._snapshot();
    expect(s.theta).toBeCloseTo(1.0);
    expect(s.phi).toBeCloseTo(0.5);
    expect(s.gamma).toBeCloseTo(0.2);
    expect(s.distance).toBe(15);
    expect(s.fov).toBe(60);
    expect(s.center).toEqual([1, 2, 3]);
  });

  it('_applyState restores a previously captured state', () => {
    const frame = new CameraFrame();
    const snap = frame._snapshot();
    frame.setTheta(2.0);
    frame.setPhi(1.0);
    frame.setGamma(0.5);
    frame.setDistance(25);
    frame.setFieldOfView(90);
    frame.moveTo([10, 20, 30]);
    expect(frame.getTheta()).toBeCloseTo(2.0);
    frame._applyState(snap);
    expect(frame.getTheta()).toBeCloseTo(snap.theta);
    expect(frame.getPhi()).toBeCloseTo(snap.phi);
    expect(frame.getGamma()).toBeCloseTo(snap.gamma);
    expect(frame.getDistance()).toBe(snap.distance);
    expect(frame.getFieldOfView()).toBe(snap.fov);
    expect(frame.getCenter()).toEqual(snap.center);
  });
});

describe('CameraAnimateProxy', () => {
  it('frame.animate returns a CameraAnimateProxy with defaults', () => {
    const frame = new CameraFrame();
    const proxy = frame.animate;
    expect(proxy).toBeInstanceOf(CameraAnimateProxy);
    expect(proxy.duration).toBe(1);
    expect(proxy.getFrame()).toBe(frame);
  });

  it('animateTo passes custom duration and rateFunc', () => {
    const frame = new CameraFrame();
    const proxy = frame.animateTo({ duration: 3, rateFunc: linear });
    expect(proxy.duration).toBe(3);
    expect(proxy.rateFunc).toBe(linear);
  });

  it('builder methods are chainable', () => {
    const frame = new CameraFrame();
    const proxy = frame.animate;
    const result = proxy
      .incrementTheta(0.5)
      .incrementPhi(0.3)
      .incrementGamma(0.1)
      .setDistance(20)
      .setFieldOfView(60)
      .moveTo([1, 2, 3])
      .setEulerAngles({ theta: 1 });
    expect(result).toBe(proxy);
  });

  it('withDuration and withRateFunc override animation params', () => {
    const frame = new CameraFrame();
    const proxy = frame.animate.withDuration(5).withRateFunc(linear);
    expect(proxy.duration).toBe(5);
    expect(proxy.rateFunc).toBe(linear);
  });

  it('interpolate(0) keeps start state', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, phi: Math.PI / 4, distance: 10 });
    const proxy = frame.animate.incrementTheta(Math.PI / 2);
    proxy.begin();
    proxy.interpolate(0);
    expect(frame.getTheta()).toBeCloseTo(0);
  });

  it('interpolate(1) reaches target state', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, phi: Math.PI / 4, distance: 10 });
    const proxy = frame.animate.incrementTheta(Math.PI / 2);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getTheta()).toBeCloseTo(Math.PI / 2);
  });

  it('interpolate(0.5) gives midpoint', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, distance: 10 });
    const proxy = frame.animate.incrementTheta(Math.PI);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getTheta()).toBeCloseTo(Math.PI / 2);
  });

  it('absolute setEulerAngles interpolates to target', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, phi: 0, gamma: 0 });
    const proxy = frame.animate.setEulerAngles({ theta: Math.PI, phi: Math.PI / 2 });
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getTheta()).toBeCloseTo(Math.PI);
    expect(frame.getPhi()).toBeCloseTo(Math.PI / 2);
    expect(frame.getGamma()).toBeCloseTo(0);
  });

  it('setDistance animates distance', () => {
    const frame = new CameraFrame(16 / 9, { distance: 10 });
    const proxy = frame.animate.setDistance(20);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getDistance()).toBeCloseTo(15);
    proxy.interpolate(1);
    expect(frame.getDistance()).toBeCloseTo(20);
  });

  it('setFieldOfView animates fov', () => {
    const frame = new CameraFrame(16 / 9, { fov: 45 });
    const proxy = frame.animate.setFieldOfView(90);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getFieldOfView()).toBeCloseTo(67.5);
    proxy.interpolate(1);
    expect(frame.getFieldOfView()).toBeCloseTo(90);
  });

  it('moveTo animates center', () => {
    const frame = new CameraFrame(16 / 9, { lookAt: [0, 0, 0] });
    const proxy = frame.animate.moveTo([10, 20, 30]);
    proxy.begin();
    proxy.interpolate(0.5);
    expect(frame.getCenter()[0]).toBeCloseTo(5);
    expect(frame.getCenter()[1]).toBeCloseTo(10);
    expect(frame.getCenter()[2]).toBeCloseTo(15);
    proxy.interpolate(1);
    expect(frame.getCenter()[0]).toBeCloseTo(10);
    expect(frame.getCenter()[1]).toBeCloseTo(20);
    expect(frame.getCenter()[2]).toBeCloseTo(30);
  });

  it('finish applies final state', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, phi: 0, distance: 10 });
    const proxy = frame.animate.incrementPhi(1.0);
    proxy.begin();
    proxy.finish();
    expect(frame.getPhi()).toBeCloseTo(1.0);
  });

  it('combined deltas accumulate', () => {
    const frame = new CameraFrame(16 / 9, { theta: 0, phi: 0 });
    const proxy = frame.animate.incrementTheta(0.5).incrementTheta(0.5);
    proxy.begin();
    proxy.interpolate(1);
    expect(frame.getTheta()).toBeCloseTo(1.0);
  });
});

describe('Camera2D frame interaction', () => {
  it('camera.frame is lazily created, cached, and is a Camera2DFrame', () => {
    const cam = new Camera2D();
    const f1 = cam.frame;
    expect(f1).toBeInstanceOf(Camera2DFrame);
    expect(cam.frame).toBe(f1);
  });

  it('updateFrame with no frame is a no-op', () => {
    new Camera2D().updateFrame(0.016); // should not throw
  });

  it('updateFrame with frame does not throw', () => {
    const cam = new Camera2D();
    const frame = cam.frame; // create the frame
    expect(frame).toBeDefined();
    cam.updateFrame(0.016);
  });
});
