// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { Scrubbable, makeScrubbable, makeScrubbableEntries } from './Scrubbable';
import { DecimalNumber } from '../mobjects/text/DecimalNumber';
import { DecimalTable } from '../mobjects/table/TableVariants';
import { MobjectMatrix } from '../mobjects/matrix/Matrix';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import type { Scene } from '../core/Scene';

// happy-dom has no canvas 2D context; DecimalNumber needs one to measure text.
beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...args: unknown[]
  ) {
    if (type === '2d') {
      return {
        clearRect: () => {},
        fillText: () => {},
        measureText: (t: string) => ({ width: t.length * 10 }),
        font: '',
        fillStyle: '',
        globalAlpha: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
      } as unknown as CanvasRenderingContext2D;
    }
    return orig.call(this, type, ...(args as []));
  } as typeof orig;
});

// Fake 2D scene: 800x600 px canvas over a 14x8 world frame (as in MovablePoint.test).
const W = 800;
const H = 600;
const FW = 14;
const FH = 8;

function createFakeScene() {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: W, bottom: H, width: W, height: H, x: 0, y: 0 }) as DOMRect;
  document.body.appendChild(canvas);
  return {
    getCanvas: () => canvas,
    camera: { frameWidth: FW, frameHeight: FH },
    isRenderLoopActive: false,
    render: vi.fn(),
    _canvas: canvas,
  };
}
type FakeScene = ReturnType<typeof createFakeScene>;

function toClient(wx: number, wy: number): [number, number] {
  return [((wx / FW) * 2 + 1) * (W / 2), (1 - (wy / FH) * 2) * (H / 2)];
}

function fire(target: EventTarget, type: string, x: number, y: number) {
  const e = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  target.dispatchEvent(e);
}

/** Press at world (wx, wy), move by (dx, dy) screen pixels, release. */
function scrub(scene: FakeScene, wx: number, wy: number, dx: number, dy: number) {
  const [x, y] = toClient(wx, wy);
  fire(scene._canvas, 'pointerdown', x, y);
  fire(window, 'pointermove', x + dx, y + dy);
  fire(window, 'pointerup', x + dx, y + dy);
}

describe('Scrubbable', () => {
  let scene: FakeScene;
  const made: Scrubbable[] = [];
  const asScene = () => scene as unknown as Scene;

  beforeEach(() => {
    scene = createFakeScene();
  });
  afterEach(() => {
    made.splice(0).forEach((s) => s.dispose());
    scene._canvas.remove();
  });

  // MIGRATION: example for the properties
  //   ∀ drag d, value === clamp(round((v0 + d*sensitivity)/step)*step, min, max)
  //   ∀ drag d, the decimal's world center is unchanged.
  // Replace with property tests once the suite lands.
  it('maps a horizontal drag to a snapped, clamped value without moving the number', () => {
    const d = new DecimalNumber({ value: 1, numDecimalPlaces: 1 }).moveTo([2, 1, 0]);
    const onChange = vi.fn();
    const tracker = new ValueTracker(0);
    made.push(
      makeScrubbable(d, asScene(), { step: 0.1, sensitivity: 0.05, max: 3, onChange, tracker }),
    );
    const before = d.getCenter();

    scrub(scene, 2, 1, 23.6, 0); // 1 + 23.6 px * 0.05 = 2.18 -> snapped to 2.2
    expect(d.getValue()).toBe(2.2);
    expect(onChange).toHaveBeenLastCalledWith(d.getValue(), d);
    expect(tracker.getValue()).toBe(2.2);

    scrub(scene, 2, 1, 400, 0); // far right -> clamped to max
    expect(d.getValue()).toBe(3);
    expect(d.getCenter()).toEqual(before);
    expect(scene.render).toHaveBeenCalled();
  });

  it('vertical: dragging up increases, presses off the number are ignored', () => {
    const d = new DecimalNumber({ value: 0, numDecimalPlaces: 0 });
    made.push(makeScrubbable(d, asScene(), { direction: 'vertical', min: -2 }));

    scrub(scene, 0, 0, 0, -5); // up 5 px, default step 1 per px
    expect(d.getValue()).toBe(5);
    scrub(scene, 0, 0, 0, 50); // down -> clamped to min
    expect(d.getValue()).toBe(-2);
    scrub(scene, 5, 3, 0, -50); // miss
    expect(d.getValue()).toBe(-2);
  });

  it('sets the resize cursor on hover and clears it on leave', () => {
    const d = new DecimalNumber({ value: 0 });
    made.push(makeScrubbable(d, asScene()));
    const [x, y] = toClient(0, 0);
    fire(scene._canvas, 'pointermove', x, y);
    expect(scene._canvas.style.cursor).toBe('ew-resize');
    fire(scene._canvas, 'pointermove', 10, 10);
    expect(scene._canvas.style.cursor).toBe('');
  });

  // MIGRATION: example for the property
  //   ∀ container c, makeScrubbableEntries(c) scrubs exactly the DecimalNumbers
  //   of c, hit-tested at their world positions.
  it('makeScrubbableEntries scrubs one DecimalTable cell in place', () => {
    const table = new DecimalTable({ data: [[1, 2]], numDecimalPlaces: 0 });
    table.shift([1, -1, 0]);
    const cells = makeScrubbableEntries(table, asScene());
    made.push(...cells);
    expect(cells).toHaveLength(2);

    const target = cells[1].decimal;
    const other = cells[0].decimal;
    const center = target.getCenter();
    const world = target._worldMatrix().elements;
    scrub(scene, world[12], world[13], 3, 0);
    expect(target.getValue()).toBe(5);
    expect(other.getValue()).toBe(1);
    expect(target.getCenter()).toEqual(center);

    // A MobjectMatrix of DecimalNumbers is the scrubbable-matrix form.
    const matrix = new MobjectMatrix([[new DecimalNumber({ value: 0 })]]);
    const entries = makeScrubbableEntries(matrix, asScene());
    made.push(...entries);
    expect(entries.map((e) => e.decimal)).toEqual([matrix.getEntry(0, 0)]);
  });
});
