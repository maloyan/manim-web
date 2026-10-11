// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slider, makeSlider } from './Slider';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import { Dot } from '../mobjects/geometry/Dot';
import { Line } from '../mobjects/geometry/Line';
import { Group } from '../core/Group';
import type { Scene } from '../core/Scene';

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

/** Grab the handle at its current position and drag it to world (wx, wy). */
function dragHandleTo(
  scene: ReturnType<typeof createFakeScene>,
  slider: Slider,
  wx: number,
  wy: number,
) {
  const h = slider.getHandle().getPoint();
  const down = worldToClient(h[0], h[1]);
  const move = worldToClient(wx, wy);
  fireMouse(scene._canvas, 'mousedown', down.clientX, down.clientY);
  fireMouse(window, 'mousemove', move.clientX, move.clientY);
  fireMouse(window, 'mouseup', move.clientX, move.clientY);
}

describe('Slider', () => {
  let scene: ReturnType<typeof createFakeScene>;
  const sliders: Slider[] = [];

  beforeEach(() => {
    scene = createFakeScene();
  });

  afterEach(() => {
    while (sliders.length) sliders.pop()?.dispose();
    scene._canvas.remove();
  });

  function make(options?: ConstructorParameters<typeof Slider>[1]): Slider {
    const s = new Slider(scene as unknown as Scene, options);
    sliders.push(s);
    return s;
  }

  it('builds track and handle mobjects as a group', () => {
    const s = make({ min: 0, max: 10, length: 4 });
    expect(s).toBeInstanceOf(Group);
    expect(s.getTrack()).toBeInstanceOf(Line);
    expect(s.getHandle()).toBeInstanceOf(Dot);
  });

  it('maps value to handle position across the track', () => {
    const s = make({ min: 0, max: 10, length: 4, center: [0, 0, 0], value: 0 });
    // value 0 -> left end at -length/2
    expect(s.getHandle().getPoint()[0]).toBeCloseTo(-2);
    s.setValue(5);
    expect(s.getValue()).toBeCloseTo(5);
    expect(s.getHandle().getPoint()[0]).toBeCloseTo(0);
    s.setValue(10);
    expect(s.getHandle().getPoint()[0]).toBeCloseTo(2);
  });

  it('clamps values to [min, max]', () => {
    const s = make({ min: 0, max: 10, length: 4 });
    s.setValue(100);
    expect(s.getValue()).toBe(10);
    s.setValue(-100);
    expect(s.getValue()).toBe(0);
  });

  it('snaps values to the step', () => {
    const s = make({ min: 0, max: 10, step: 2 });
    s.setValue(2.9);
    expect(s.getValue()).toBeCloseTo(2);
    s.setValue(3.1);
    expect(s.getValue()).toBeCloseTo(4);
  });

  it('binds to a ValueTracker and keeps it in sync', () => {
    const tracker = new ValueTracker(0);
    const s = make({ min: 0, max: 10, tracker });
    s.setValue(7);
    expect(tracker.getValue()).toBeCloseTo(7);
    expect(s.getValueTracker()).toBe(tracker);
  });

  it('dragging the handle updates value, tracker and fires onChange, clamped', () => {
    const tracker = new ValueTracker(0);
    const onChange = vi.fn();
    const s = make({ min: 0, max: 10, length: 4, value: 5, tracker, onChange });
    // handle starts at value 5 -> x 0 (canvas centre).
    dragHandleTo(scene, s, 2, 0); // right end -> value 10
    expect(s.getValue()).toBeCloseTo(10);
    expect(tracker.getValue()).toBeCloseTo(10);
    expect(onChange).toHaveBeenCalled();
  });

  it('clamps a drag past the track end to max', () => {
    const s = make({ min: 0, max: 10, length: 4, value: 5 });
    dragHandleTo(scene, s, 50, 0); // far past the right end
    expect(s.getValue()).toBe(10);
  });

  it('keeps the handle on the track line while dragging off-axis', () => {
    const s = make({ min: 0, max: 10, length: 4, value: 5, center: [0, 0, 0] });
    dragHandleTo(scene, s, 1, 3); // drag up and to the right
    expect(s.getHandle().getPoint()[1]).toBeCloseTo(0);
  });

  it('respects a non-origin center', () => {
    const s = make({ min: 0, max: 1, length: 4, center: [1, 2, 0], value: 0 });
    expect(s.getHandle().getPoint()[0]).toBeCloseTo(-1); // 1 - 4/2
    expect(s.getHandle().getPoint()[1]).toBeCloseTo(2);
  });

  it('makeSlider factory returns a Slider', () => {
    const s = makeSlider(scene as unknown as Scene, { min: 0, max: 5 });
    sliders.push(s);
    expect(s).toBeInstanceOf(Slider);
  });
});
