// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MovablePoint, makeMovablePoint } from './MovablePoint';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import { Dot } from '../mobjects/geometry/Dot';
import type { Scene } from '../core/Scene';

// ---------------------------------------------------------------------------
// A minimal fake Scene. Draggable only reads getCanvas(), camera.frameWidth /
// frameHeight, isRenderLoopActive and render(). The fake is NOT a ThreeDScene
// instance, so Draggable takes its 2D screen-to-world path.
// ---------------------------------------------------------------------------
const CANVAS_W = 800;
const CANVAS_H = 600;
const FRAME_W = 14;
const FRAME_H = 8;

function createFakeScene() {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: CANVAS_W,
    bottom: CANVAS_H,
    width: CANVAS_W,
    height: CANVAS_H,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  document.body.appendChild(canvas);
  return {
    getCanvas: () => canvas,
    camera: { frameWidth: FRAME_W, frameHeight: FRAME_H },
    isRenderLoopActive: false,
    render: vi.fn(),
    _canvas: canvas,
  };
}

/** World (x, y) -> canvas client coordinates, inverse of Draggable screenToWorld. */
function worldToClient(wx: number, wy: number): { clientX: number; clientY: number } {
  const ndcX = (wx * 2) / FRAME_W;
  const ndcY = (wy * 2) / FRAME_H;
  return {
    clientX: ((ndcX + 1) / 2) * CANVAS_W,
    clientY: ((1 - ndcY) / 2) * CANVAS_H,
  };
}

function fireMouse(target: EventTarget, type: string, clientX: number, clientY: number) {
  target.dispatchEvent(
    new MouseEvent(type, { clientX, clientY, button: 0, bubbles: true, cancelable: true }),
  );
}

/** Press on the point's current world position and drag it to (wx, wy). */
function dragTo(
  scene: ReturnType<typeof createFakeScene>,
  mp: MovablePoint,
  wx: number,
  wy: number,
) {
  const start = mp.getPoint();
  const down = worldToClient(start[0], start[1]);
  const move = worldToClient(wx, wy);
  fireMouse(scene._canvas, 'mousedown', down.clientX, down.clientY);
  fireMouse(window, 'mousemove', move.clientX, move.clientY);
  fireMouse(window, 'mouseup', move.clientX, move.clientY);
}

describe('MovablePoint', () => {
  let scene: ReturnType<typeof createFakeScene>;
  const points: MovablePoint[] = [];

  beforeEach(() => {
    scene = createFakeScene();
  });

  afterEach(() => {
    while (points.length) points.pop()?.dispose();
    scene._canvas.remove();
  });

  function make(options?: ConstructorParameters<typeof MovablePoint>[1]): MovablePoint {
    const mp = new MovablePoint(scene as unknown as Scene, options);
    points.push(mp);
    return mp;
  }

  it('is a Dot mobject that can be added to a scene', () => {
    const mp = make({ point: [1, 2, 0] });
    expect(mp).toBeInstanceOf(Dot);
    expect(mp.getPoint()[0]).toBeCloseTo(1);
    expect(mp.getPoint()[1]).toBeCloseTo(2);
  });

  it('drag updates position, bound trackers and fires onChange', () => {
    const xTracker = new ValueTracker(0);
    const yTracker = new ValueTracker(0);
    const onChange = vi.fn();
    const mp = make({ point: [0, 0, 0], xTracker, yTracker, onChange });

    dragTo(scene, mp, 0.875, 0);

    expect(mp.getPoint()[0]).toBeCloseTo(0.875);
    expect(mp.getPoint()[1]).toBeCloseTo(0);
    expect(xTracker.getValue()).toBeCloseTo(0.875);
    expect(yTracker.getValue()).toBeCloseTo(0);
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last[0]).toBeCloseTo(0.875);
  });

  it('setPoint moves the point, syncs trackers and fires onChange', () => {
    const xTracker = new ValueTracker(0);
    const onChange = vi.fn();
    const mp = make({ xTracker, onChange });
    mp.setPoint([3, -1, 0]);
    expect(mp.getPoint()[0]).toBeCloseTo(3);
    expect(xTracker.getValue()).toBeCloseTo(3);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('constrainToFunction keeps the point on y = f(x)', () => {
    const mp = make();
    mp.constrainToFunction((x) => x * x);

    mp.setPoint([2, 99, 0]);
    expect(mp.getPoint()[0]).toBeCloseTo(2);
    expect(mp.getPoint()[1]).toBeCloseTo(4);

    dragTo(scene, mp, 0.875, 10);
    expect(mp.getPoint()[0]).toBeCloseTo(0.875);
    expect(mp.getPoint()[1]).toBeCloseTo(0.875 * 0.875);
  });

  it('constrainToFunction does not fire onChange while only setting the constraint', () => {
    const onChange = vi.fn();
    const mp = make({ onChange });
    mp.constrainToFunction((x) => x + 1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('constrainToParametric projects the drag onto the curve', () => {
    const mp = make();
    // Unit circle.
    mp.constrainToParametric((t) => [Math.cos(t), Math.sin(t)], [0, Math.PI * 2]);

    mp.setPoint([2, 0, 0]);
    expect(mp.getPoint()[0]).toBeCloseTo(1, 2);
    expect(mp.getPoint()[1]).toBeCloseTo(0, 2);

    mp.setPoint([0, 3, 0]);
    expect(mp.getPoint()[0]).toBeCloseTo(0, 2);
    expect(mp.getPoint()[1]).toBeCloseTo(1, 2);

    // Any projected point stays on the unit circle (magnitude 1).
    mp.setPoint([5, 5, 0]);
    const p = mp.getPoint();
    expect(Math.hypot(p[0], p[1])).toBeCloseTo(1, 2);
  });

  it('constrainToSegment clamps to the segment, constrainToLine does not', () => {
    const seg = make();
    seg.constrainToSegment([0, 0, 0], [2, 0, 0]);
    seg.setPoint([1, 5, 0]);
    expect(seg.getPoint()[0]).toBeCloseTo(1);
    expect(seg.getPoint()[1]).toBeCloseTo(0);
    seg.setPoint([9, 9, 0]);
    expect(seg.getPoint()[0]).toBeCloseTo(2);

    const line = make();
    line.constrainToLine([0, 0, 0], [2, 0, 0]);
    line.setPoint([9, 9, 0]);
    expect(line.getPoint()[0]).toBeCloseTo(9);
    expect(line.getPoint()[1]).toBeCloseTo(0);
  });

  it('drives a dependent mobject through the existing updater path', () => {
    const xTracker = new ValueTracker(0);
    const mp = make({ xTracker });

    const dependent = new Dot({ point: [0, 0, 0] });
    dependent.addUpdater((d) => {
      d.moveTo([xTracker.getValue(), 0, 0]);
    });

    dragTo(scene, mp, 0.875, 0);
    dependent.update(0);

    expect(dependent.getPoint()[0]).toBeCloseTo(0.875);
  });

  it('makeMovablePoint factory returns a MovablePoint', () => {
    const mp = makeMovablePoint(scene as unknown as Scene, { point: [1, 1, 0] });
    points.push(mp);
    expect(mp).toBeInstanceOf(MovablePoint);
  });

  it('getDraggable exposes the underlying Draggable and dispose stops dragging', () => {
    const onChange = vi.fn();
    const mp = make({ onChange });
    expect(mp.getDraggable()).toBeDefined();
    mp.dispose();
    // After dispose, a drag gesture no longer updates the point.
    dragTo(scene, mp, 1, 0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
