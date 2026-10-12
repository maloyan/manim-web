// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { PanZoomControls, makePanZoomControls, type PanZoomCamera } from './PanZoomControls';

// ---------------------------------------------------------------------------
// Test helpers: a stub Camera2D-like object and a fake DOM element whose
// bounding rect is fixed (happy-dom returns zeros otherwise).
// ---------------------------------------------------------------------------

function makeStubCamera(frameWidth = 14, frameHeight = 8): PanZoomCamera {
  return {
    frameWidth,
    frameHeight,
    position: new THREE.Vector3(0, 0, 10),
    moveTo(point: [number, number, number]) {
      this.position.set(point[0], point[1], point[2]);
    },
  };
}

function makeElement(width = 800, height = 600): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  document.body.appendChild(el);
  return el;
}

/** World point currently shown under a screen pixel, for the stub camera. */
function worldAt(cam: PanZoomCamera, clientX: number, clientY: number, width = 800, height = 600) {
  const ndcX = (clientX / width) * 2 - 1;
  const ndcY = -(clientY / height) * 2 + 1;
  return {
    x: cam.position.x + (ndcX * cam.frameWidth) / 2,
    y: cam.position.y + (ndcY * cam.frameHeight) / 2,
  };
}

function fireWheel(
  target: EventTarget,
  opts: { deltaY: number; clientX: number; clientY: number },
): void {
  const event = new WheelEvent('wheel', {
    deltaY: opts.deltaY,
    clientX: opts.clientX,
    clientY: opts.clientY,
    bubbles: true,
    cancelable: true,
  });
  // happy-dom's WheelEvent does not carry the inherited MouseEvent client
  // coords from its init dict, so set them explicitly for the test.
  Object.defineProperty(event, 'clientX', { value: opts.clientX, configurable: true });
  Object.defineProperty(event, 'clientY', { value: opts.clientY, configurable: true });
  target.dispatchEvent(event);
}

function fireMouse(
  target: EventTarget,
  type: string,
  opts: { clientX?: number; clientY?: number; button?: number } = {},
): void {
  target.dispatchEvent(
    new MouseEvent(type, {
      clientX: opts.clientX ?? 0,
      clientY: opts.clientY ?? 0,
      button: opts.button ?? 0,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/**
 * happy-dom has no Touch/TouchEvent constructors, so fake the shape the
 * controller reads: a `touches` array (and `changedTouches`) of objects with
 * clientX/clientY. Matches the approach already used in interaction.test.ts.
 */
function fireTouch(
  target: EventTarget,
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
): void {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    touches: Array<{ clientX: number; clientY: number }>;
    changedTouches: Array<{ clientX: number; clientY: number }>;
  };
  event.touches = touches;
  event.changedTouches = touches;
  target.dispatchEvent(event);
}

describe('PanZoomControls', () => {
  let camera: PanZoomCamera;
  let element: HTMLElement;
  let controls: PanZoomControls;

  beforeEach(() => {
    camera = makeStubCamera();
    element = makeElement();
  });

  afterEach(() => {
    controls?.dispose();
    document.body.innerHTML = '';
  });

  // ── Zoom ────────────────────────────────────────────────────────

  it('wheel up zooms in (frame width decreases)', () => {
    controls = new PanZoomControls(camera, element);
    const before = camera.frameWidth;
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBeLessThan(before);
    expect(camera.frameHeight).toBeLessThan(8);
  });

  it('wheel down zooms out (frame width increases)', () => {
    controls = new PanZoomControls(camera, element);
    fireWheel(element, { deltaY: 100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBeGreaterThan(14);
  });

  it('keeps aspect ratio when zooming', () => {
    controls = new PanZoomControls(camera, element);
    const ratioBefore = camera.frameWidth / camera.frameHeight;
    fireWheel(element, { deltaY: -120, clientX: 200, clientY: 100 });
    expect(camera.frameWidth / camera.frameHeight).toBeCloseTo(ratioBefore, 10);
  });

  it('zooms to cursor: the world point under the cursor stays fixed', () => {
    controls = new PanZoomControls(camera, element);
    const cx = 620;
    const cy = 140;
    const worldBefore = worldAt(camera, cx, cy);
    fireWheel(element, { deltaY: -100, clientX: cx, clientY: cy });
    const worldAfter = worldAt(camera, cx, cy);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);
    // center actually moved (cursor was off-center), proving it is not center-zoom
    expect(camera.position.x).not.toBeCloseTo(0, 3);
  });

  it('invertZoom reverses the wheel direction', () => {
    controls = new PanZoomControls(camera, element, { invertZoom: true });
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBeGreaterThan(14);
  });

  it('clamps zoom-in at maxZoom', () => {
    controls = new PanZoomControls(camera, element, { maxZoom: 2 });
    // base 14, maxZoom 2 => min frame width 7
    for (let i = 0; i < 50; i++) {
      fireWheel(element, { deltaY: -200, clientX: 400, clientY: 300 });
    }
    expect(camera.frameWidth).toBeGreaterThanOrEqual(7 - 1e-9);
    expect(camera.frameWidth).toBeCloseTo(7, 6);
  });

  it('clamps zoom-out at minZoom', () => {
    controls = new PanZoomControls(camera, element, { minZoom: 0.5 });
    // base 14, minZoom 0.5 => max frame width 28
    for (let i = 0; i < 50; i++) {
      fireWheel(element, { deltaY: 200, clientX: 400, clientY: 300 });
    }
    expect(camera.frameWidth).toBeLessThanOrEqual(28 + 1e-9);
    expect(camera.frameWidth).toBeCloseTo(28, 6);
  });

  it('does not zoom when enableZoom is false', () => {
    controls = new PanZoomControls(camera, element, { enableZoom: false });
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBe(14);
  });

  // ── Pan ─────────────────────────────────────────────────────────

  it('drag pans the camera center by the correct world delta', () => {
    controls = new PanZoomControls(camera, element);
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300, button: 0 });
    // move right 100px: worldPerPx = 14/800 = 0.0175 => 1.75 world units
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(camera.position.x).toBeCloseTo(-1.75, 6);
    expect(camera.position.y).toBeCloseTo(0, 6);
    // move down 100px: worldPerPx = 8/600 => 1.3333 world units
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 400 });
    expect(camera.position.y).toBeCloseTo(8 / 6, 6);
    fireMouse(window, 'mouseup', {});
    // after mouseup, further moves do nothing
    const x = camera.position.x;
    fireMouse(window, 'mousemove', { clientX: 700, clientY: 400 });
    expect(camera.position.x).toBeCloseTo(x, 6);
  });

  it('does not pan with a button other than panButton', () => {
    controls = new PanZoomControls(camera, element, { panButton: 0 });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300, button: 2 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(camera.position.x).toBe(0);
  });

  it('respects a custom panButton', () => {
    controls = new PanZoomControls(camera, element, { panButton: 2 });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300, button: 2 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(camera.position.x).toBeCloseTo(-1.75, 6);
  });

  it('enablePanX=false locks the x axis', () => {
    controls = new PanZoomControls(camera, element, { enablePanX: false });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 400 });
    expect(camera.position.x).toBeCloseTo(0, 6);
    expect(camera.position.y).toBeCloseTo(8 / 6, 6);
  });

  it('enablePanY=false locks the y axis', () => {
    controls = new PanZoomControls(camera, element, { enablePanY: false });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 400 });
    expect(camera.position.x).toBeCloseTo(-1.75, 6);
    expect(camera.position.y).toBeCloseTo(0, 6);
  });

  it('clamps the camera center to bounds', () => {
    controls = new PanZoomControls(camera, element, {
      bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
    });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 10, clientY: 300 }); // large pan right-to-left
    expect(camera.position.x).toBeLessThanOrEqual(1 + 1e-9);
    expect(camera.position.x).toBeGreaterThanOrEqual(-1 - 1e-9);
  });

  // ── onChange ─────────────────────────────────────────────────────

  it('fires onChange on zoom and on pan', () => {
    const onChange = vi.fn();
    controls = new PanZoomControls(camera, element, { onChange });
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  // ── Lifecycle: enable / disable / dispose ───────────────────────

  it('disable() detaches listeners (no effect after)', () => {
    controls = new PanZoomControls(camera, element);
    controls.disable();
    expect(controls.isEnabled()).toBe(false);
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(camera.frameWidth).toBe(14);
    expect(camera.position.x).toBe(0);
  });

  it('enable() after disable() re-attaches listeners', () => {
    controls = new PanZoomControls(camera, element);
    controls.disable();
    controls.enable();
    expect(controls.isEnabled()).toBe(true);
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBeLessThan(14);
  });

  it('starts disabled when enabled:false and attaches no listeners', () => {
    const spy = vi.spyOn(element, 'addEventListener');
    controls = new PanZoomControls(camera, element, { enabled: false });
    expect(controls.isEnabled()).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBe(14);
    spy.mockRestore();
  });

  it('dispose() removes listeners via removeEventListener and stops responding', () => {
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');
    controls = new PanZoomControls(camera, element);
    expect(addSpy).toHaveBeenCalled();
    controls.dispose();
    expect(removeSpy).toHaveBeenCalled();
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    fireMouse(element, 'mousedown', { clientX: 400, clientY: 300 });
    fireMouse(window, 'mousemove', { clientX: 500, clientY: 300 });
    expect(camera.frameWidth).toBe(14);
    expect(camera.position.x).toBe(0);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('calling enable() twice does not double-attach listeners', () => {
    controls = new PanZoomControls(camera, element, { enabled: false });
    const spy = vi.spyOn(element, 'addEventListener');
    controls.enable();
    controls.enable();
    const wheelAdds = spy.mock.calls.filter((c) => c[0] === 'wheel').length;
    expect(wheelAdds).toBe(1);
    spy.mockRestore();
  });

  // ── Headless safety ─────────────────────────────────────────────

  it('does not throw when the bounding rect has zero size', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.appendChild(el);
    controls = new PanZoomControls(camera, el);
    expect(() => fireWheel(el, { deltaY: -100, clientX: 0, clientY: 0 })).not.toThrow();
    // no NaN leaked into the camera
    expect(Number.isNaN(camera.frameWidth)).toBe(false);
    expect(camera.frameWidth).toBe(14);
  });

  // ── Touch: single-finger pan ─────────────────────────────────────

  it('single-finger drag pans the camera like a mouse pan', () => {
    controls = new PanZoomControls(camera, element);
    fireTouch(element, 'touchstart', [{ clientX: 400, clientY: 300 }]);
    // move right 100px: worldPerPx = 14/800 = 0.0175 => 1.75 world units
    fireTouch(window, 'touchmove', [{ clientX: 500, clientY: 300 }]);
    expect(camera.position.x).toBeCloseTo(-1.75, 6);
    expect(camera.position.y).toBeCloseTo(0, 6);
    // move down 100px: worldPerPx = 8/600 => 1.3333 world units
    fireTouch(window, 'touchmove', [{ clientX: 500, clientY: 400 }]);
    expect(camera.position.y).toBeCloseTo(8 / 6, 6);
    // lift the finger; further moves do nothing
    fireTouch(window, 'touchend', []);
    const x = camera.position.x;
    fireTouch(window, 'touchmove', [{ clientX: 700, clientY: 400 }]);
    expect(camera.position.x).toBeCloseTo(x, 6);
  });

  it('single-finger drag does not zoom (frame unchanged)', () => {
    controls = new PanZoomControls(camera, element);
    fireTouch(element, 'touchstart', [{ clientX: 400, clientY: 300 }]);
    fireTouch(window, 'touchmove', [{ clientX: 500, clientY: 350 }]);
    expect(camera.frameWidth).toBe(14);
    expect(camera.frameHeight).toBe(8);
  });

  // ── Touch: two-finger pinch zoom ─────────────────────────────────

  it('pinch out (fingers apart) zooms in about the midpoint', () => {
    controls = new PanZoomControls(camera, element);
    // start: two fingers 100px apart, centered on the element center
    fireTouch(element, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    // spread to 200px apart, same midpoint (400,300) => factor 100/200 = 0.5
    fireTouch(window, 'touchmove', [
      { clientX: 300, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    expect(camera.frameWidth).toBeCloseTo(7, 6);
    expect(camera.frameHeight).toBeCloseTo(4, 6);
    // midpoint was the element center, so the center does not move
    expect(camera.position.x).toBeCloseTo(0, 6);
    expect(camera.position.y).toBeCloseTo(0, 6);
  });

  it('pinch in (fingers together) zooms out', () => {
    controls = new PanZoomControls(camera, element);
    fireTouch(element, 'touchstart', [
      { clientX: 300, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    // close to 100px apart => factor 200/100 = 2
    fireTouch(window, 'touchmove', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    expect(camera.frameWidth).toBeCloseTo(28, 6);
    expect(camera.frameHeight).toBeCloseTo(16, 6);
  });

  it('pinch zooms about the midpoint: the world point under it stays fixed', () => {
    controls = new PanZoomControls(camera, element);
    const midX = 600;
    const midY = 300;
    const worldBefore = worldAt(camera, midX, midY);
    // 100px apart about (600,300)
    fireTouch(element, 'touchstart', [
      { clientX: 550, clientY: 300 },
      { clientX: 650, clientY: 300 },
    ]);
    // 200px apart, same midpoint
    fireTouch(window, 'touchmove', [
      { clientX: 500, clientY: 300 },
      { clientX: 700, clientY: 300 },
    ]);
    const worldAfter = worldAt(camera, midX, midY);
    expect(camera.frameWidth).toBeCloseTo(7, 6);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);
    // the center actually moved (midpoint was off-center)
    expect(camera.position.x).not.toBeCloseTo(0, 3);
  });

  it('two-finger drag (constant spread) pans by the midpoint delta', () => {
    controls = new PanZoomControls(camera, element);
    fireTouch(element, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    // both fingers move right 50px: midpoint 400 -> 450, spread unchanged
    fireTouch(window, 'touchmove', [
      { clientX: 400, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    // worldDx = 50 * 14 / 800 = 0.875
    expect(camera.position.x).toBeCloseTo(-0.875, 6);
    expect(camera.frameWidth).toBeCloseTo(14, 6);
  });

  it('does not pinch-zoom when enableZoom is false (two-finger still pans)', () => {
    controls = new PanZoomControls(camera, element, { enableZoom: false });
    fireTouch(element, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    fireTouch(window, 'touchmove', [
      { clientX: 300, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    expect(camera.frameWidth).toBe(14);
  });

  it('continues panning when one finger lifts after a pinch', () => {
    controls = new PanZoomControls(camera, element);
    fireTouch(element, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    // lift to one finger at (500,300)
    fireTouch(window, 'touchend', [{ clientX: 500, clientY: 300 }]);
    const before = camera.position.x;
    // single finger drags right 100px
    fireTouch(window, 'touchmove', [{ clientX: 600, clientY: 300 }]);
    expect(camera.position.x).toBeCloseTo(before - 1.75, 6);
  });

  // ── Touch: lifecycle ─────────────────────────────────────────────

  it('disable() detaches touch listeners (no effect after)', () => {
    controls = new PanZoomControls(camera, element);
    controls.disable();
    fireTouch(element, 'touchstart', [
      { clientX: 350, clientY: 300 },
      { clientX: 450, clientY: 300 },
    ]);
    fireTouch(window, 'touchmove', [
      { clientX: 300, clientY: 300 },
      { clientX: 500, clientY: 300 },
    ]);
    expect(camera.frameWidth).toBe(14);
    expect(camera.position.x).toBe(0);
  });

  it('dispose() removes the touch listeners it added', () => {
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');
    controls = new PanZoomControls(camera, element);
    expect(addSpy.mock.calls.some((c) => c[0] === 'touchstart')).toBe(true);
    controls.dispose();
    expect(removeSpy.mock.calls.some((c) => c[0] === 'touchstart')).toBe(true);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('touch gestures are safe with a zero-size bounding rect', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.appendChild(el);
    controls = new PanZoomControls(camera, el);
    expect(() => {
      fireTouch(el, 'touchstart', [
        { clientX: 0, clientY: 0 },
        { clientX: 10, clientY: 0 },
      ]);
      fireTouch(window, 'touchmove', [
        { clientX: 0, clientY: 0 },
        { clientX: 20, clientY: 0 },
      ]);
    }).not.toThrow();
    expect(Number.isNaN(camera.frameWidth)).toBe(false);
    expect(camera.frameWidth).toBe(14);
  });

  // ── Factory ──────────────────────────────────────────────────────

  it('makePanZoomControls returns a working instance', () => {
    controls = makePanZoomControls(camera, element);
    expect(controls).toBeInstanceOf(PanZoomControls);
    fireWheel(element, { deltaY: -100, clientX: 400, clientY: 300 });
    expect(camera.frameWidth).toBeLessThan(14);
  });
});
