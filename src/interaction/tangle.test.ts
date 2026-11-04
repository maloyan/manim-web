// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeTangle, type Tangle, type TangleOptions } from './Tangle';
import { worldBoxOf } from './pointerShared';
import { TangleTex } from '../mobjects/text/tangle/TangleTex';
import type { Animation } from '../animation/Animation';
import type { Scene } from '../core/Scene';
import type { VMobject } from '../core/VMobject';

// Fake 2D scene: 800x600 px canvas over a 14x8 world frame (as in Scrubbable.test).
const W = 800;
const H = 600;
const FW = 14;
const FH = 8;

function createFakeScene() {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: W, bottom: H, width: W, height: H, x: 0, y: 0 }) as DOMRect;
  const container = document.createElement('div');
  container.appendChild(canvas);
  document.body.appendChild(container);
  return {
    getCanvas: () => canvas,
    getContainer: () => container,
    camera: { frameWidth: FW, frameHeight: FH },
    isRenderLoopActive: false,
    isPlaying: false,
    isHeadless: false,
    render: vi.fn(),
    // Run an animation straight to its end, after the async renders it needs.
    play: vi.fn(async (animation: Animation) => {
      await (animation.mobject as TangleTex).waitForRender();
      animation.begin();
      animation.interpolate(1);
      animation.finish();
    }),
    _canvas: canvas,
    _container: container,
  };
}
type FakeScene = ReturnType<typeof createFakeScene>;

/** Client point at the center of some glyphs. */
function centerOf(glyphs: VMobject[]): [number, number] {
  const box = worldBoxOf(glyphs)!;
  const wx = (box.minX + box.maxX) / 2;
  const wy = (box.minY + box.maxY) / 2;
  return [((wx / FW) * 2 + 1) * (W / 2), (1 - (wy / FH) * 2) * (H / 2)];
}

function fire(target: EventTarget, type: string, x: number, y: number, pointerType = 'mouse') {
  const e = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  target.dispatchEvent(e);
}

const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

function makeTex(): TangleTex {
  return new TangleTex({
    latex: String.raw`y = \tangle{a} \tanglematrix{R} x`,
    fontSize: 96,
    parameters: {
      a: { value: 1, step: 0.5, pixelsPerStep: 10, display: 'symbol', symbol: 'a' },
      k: { value: 2, step: 0.1 },
    },
    matrices: {
      R: {
        entries: [
          [String.raw`\tangle{k}`, 0],
          [0, 1],
        ],
      },
    },
  });
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('Tangle', { timeout: 20000 }, () => {
  let scene: FakeScene;
  let tangle: Tangle | null = null;

  async function setup(options: TangleOptions = {}): Promise<TangleTex> {
    scene = createFakeScene();
    const tex = makeTex();
    await tex.waitForRender();
    tangle = makeTangle(tex, scene as unknown as Scene, options);
    return tex;
  }

  afterEach(() => {
    tangle?.dispose();
    tangle = null;
    scene?._container.remove();
  });

  // MIGRATION: example for the property
  //   ∀ parameter p, drag of dx pixels: value === snap(start + trunc(dx / pixelsPerStep) * step),
  //   and a 'symbol' parameter shows its number exactly while dragged.
  // Replace with a property test once the suite lands.
  it('drags a number by whole steps, revealing a symbol parameter while dragged', async () => {
    const onChange = vi.fn();
    const onScrubEnd = vi.fn();
    const tex = await setup({ onChange, onScrubEnd, keyboard: false });
    const [x, y] = centerOf(tex.getParameterGlyphs('a'));

    fire(scene._canvas, 'pointerdown', x, y);
    expect(tex.isShowingNumber('a')).toBe(true);
    fire(window, 'pointermove', x + 35, y);
    expect(tex.getValue('a')).toBe(2.5);
    expect(onChange).toHaveBeenLastCalledWith('a', 2.5, tex);
    fire(window, 'pointerup', x + 35, y);

    expect(onScrubEnd).toHaveBeenCalledWith('a', 2.5, tex);
    expect(tex.isShowingNumber('a')).toBe(false);
    expect(document.querySelector('.manim-tangle-editor')).toBeNull();
  });

  // MIGRATION: example for the property
  //   ∀ burst of pointer moves within one task: Tangle renders the scene
  //   once, after the latest glyphs land, with onBeforeRender just before.
  // Replace with a property test once the suite lands.
  it('renders a burst of drag moves once, after onBeforeRender', async () => {
    const order: string[] = [];
    const tex = await setup({ keyboard: false, onBeforeRender: () => order.push('before') });
    scene.render.mockImplementation(() => order.push('render'));
    const [x, y] = centerOf(tex.getParameterGlyphs('a'));

    fire(scene._canvas, 'pointerdown', x, y);
    for (let i = 1; i <= 5; i++) fire(window, 'pointermove', x + i * 10 + 1, y);
    await tex.waitForRender();
    await settle();
    fire(window, 'pointerup', x + 51, y);

    expect(tex.getValue('a')).toBe(3.5);
    expect(order).toEqual(['before', 'render']);
  });

  it('opens an editor on click and commits a snapped value on Enter', async () => {
    const tex = await setup({ keyboard: false });
    const [x, y] = centerOf(tex.getParameterGlyphs('a'));
    fire(scene._canvas, 'pointerdown', x, y);
    fire(window, 'pointerup', x, y);

    const input = document.querySelector<HTMLInputElement>('.manim-tangle-editor')!;
    expect(input).not.toBeNull();
    input.value = 'oops';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    input.value = '3.3';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(tex.getValue('a')).toBe(3.5);
    expect(document.querySelector('.manim-tangle-editor')).toBeNull();
  });

  it('expands a matrix on hover through scene.play, and collapses it on leave', async () => {
    const onExpandChange = vi.fn();
    const onExpandEnd = vi.fn();
    const tex = await setup({
      openDelay: 0,
      closeDelay: 0,
      keyboard: false,
      onExpandChange,
      onExpandEnd,
    });
    const [x, y] = centerOf(tex.getMatrixGlyphs('R'));

    fire(scene._canvas, 'pointermove', x, y);
    await settle();
    await tex.waitForRender();
    expect(scene.play).toHaveBeenCalledTimes(1);
    expect(tex.isExpanded('R')).toBe(true);

    fire(scene._canvas, 'pointerleave', 0, 0);
    await settle();
    await tex.waitForRender();
    await settle();
    expect(tex.isExpanded('R')).toBe(false);
    expect(onExpandChange.mock.calls).toEqual([
      ['R', 0, true],
      ['R', 0, false],
    ]);
    expect(onExpandEnd.mock.calls).toEqual(onExpandChange.mock.calls);
  });

  // MIGRATION: example for the property
  //   ∀ touch tap missing the formula: every matrix marker collapses and
  //   the tap still reaches the canvas's other listeners.
  // Replace with a property test once the suite lands.
  it('opens a matrix on tap and closes it on a tap outside, which passes on', async () => {
    const tex = await setup({ expandDuration: 0, keyboard: false });
    const [x, y] = centerOf(tex.getMatrixGlyphs('R'));
    const other = vi.fn();
    scene._canvas.addEventListener('pointerdown', other);

    fire(scene._canvas, 'pointerdown', x, y, 'touch');
    fire(window, 'pointerup', x, y, 'touch');
    expect(tex.isExpanded('R')).toBe(true);
    expect(other).not.toHaveBeenCalled();

    fire(scene._canvas, 'pointerdown', 1, 1, 'touch');
    expect(tex.isExpanded('R')).toBe(false);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('gives keyboard users a button per parameter and per matrix marker', async () => {
    const tex = await setup({ expandDuration: 0 });
    const buttons = [...scene._container.querySelectorAll('.manim-tangle-keyboard button')];
    expect(buttons.map((b) => b.getAttribute('aria-label')?.split(':')[0])).toEqual([
      'parameter a',
      'parameter k',
      'parameter R_1_2',
      'parameter R_2_1',
      'parameter R_2_2',
      'matrix R',
    ]);

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }));
    expect(tex.getValue('a')).toBe(6);
    expect(buttons[0].getAttribute('aria-label')).toContain('6.0');

    // k shows only inside the collapsed R: the focus ring goes around R's symbol.
    (buttons[1] as HTMLButtonElement).focus();
    const ring = document.querySelector<HTMLElement>('.manim-tangle-focus');
    const [rx] = centerOf(tex.getMatrixGlyphs('R'));
    expect(ring).not.toBeNull();
    expect(parseFloat(ring!.style.left) + parseFloat(ring!.style.width) / 2).toBeCloseTo(rx, 0);
    (buttons[1] as HTMLButtonElement).blur();
    expect(document.querySelector('.manim-tangle-focus')).toBeNull();

    (buttons[5] as HTMLButtonElement).click();
    await tex.waitForRender();
    expect(tex.isExpanded('R')).toBe(true);
    expect(buttons[5].getAttribute('aria-expanded')).toBe('true');
  });

  // MIGRATION: example for the property
  //   ∀ readOnly parameter p: no pointer gesture or key changes p, and p has
  //   no keyboard button; setValue from code still changes it.
  // Replace with a property test once the suite lands.
  it('leaves readOnly parameters to code', async () => {
    scene = createFakeScene();
    const tex = new TangleTex({
      latex: String.raw`\tangle{a} \cdot 2 = \tangle{r}`,
      fontSize: 96,
      parameters: { a: { value: 1 }, r: { value: 2, readOnly: true } },
    });
    await tex.waitForRender();
    tangle = makeTangle(tex, scene as unknown as Scene, {
      onChange: (_name, value) => tex.setValue('r', value * 2),
    });
    const labels = [...scene._container.querySelectorAll('.manim-tangle-keyboard button')].map(
      (b) => b.getAttribute('aria-label')?.split(':')[0],
    );
    expect(labels).toEqual(['parameter a']);

    const [rx, ry] = centerOf(tex.getParameterGlyphs('r'));
    fire(scene._canvas, 'pointerdown', rx, ry);
    fire(window, 'pointermove', rx + 50, ry);
    fire(window, 'pointerup', rx + 50, ry);
    expect(tex.getValue('r')).toBe(2);
    expect(document.querySelector('.manim-tangle-editor')).toBeNull();

    const [ax, ay] = centerOf(tex.getParameterGlyphs('a'));
    fire(scene._canvas, 'pointerdown', ax, ay);
    fire(window, 'pointermove', ax + 21, ay);
    fire(window, 'pointerup', ax + 21, ay);
    expect(tex.getValue('a')).toBe(4);
    expect(tex.getValue('r')).toBe(8);
  });
  // MIGRATION: example for the property
  //   ∀ scene that pins tex to a HUD frame F: Tangle maps pointer positions
  //   with F, and a press on a number reaches no other canvas listener.
  // Replace with a property test once the suite lands.
  it('hit-tests a formula pinned to a 3D screen frame, ahead of orbit controls', async () => {
    scene = createFakeScene();
    const tex = makeTex();
    await tex.waitForRender();
    tex.shift([2, 1, 0]); // off-center, so a mapping in the wrong frame misses
    // A HUD frame half the camera's size: the formula is drawn twice as big.
    const hud = { width: FW / 2, height: FH / 2 };
    const orbit = vi.fn();
    scene._canvas.addEventListener('pointerdown', orbit); // registered first, like OrbitControls
    const pinned = Object.assign(scene, {
      isFixedInFrame: (m: unknown) => m === tex,
      fixedInFrameSize: hud,
    });
    tangle = makeTangle(tex, pinned as unknown as Scene, { keyboard: false });

    const box = worldBoxOf(tex.getParameterGlyphs('a'))!;
    const cx = (((box.minX + box.maxX) / 2 / hud.width) * 2 + 1) * (W / 2);
    const cy = (1 - ((box.minY + box.maxY) / 2 / hud.height) * 2) * (H / 2);
    fire(scene._canvas, 'pointerdown', cx, cy);
    fire(window, 'pointermove', cx + 31, cy);
    fire(window, 'pointerup', cx + 31, cy);
    expect(tex.getValue('a')).toBe(2.5);
    expect(orbit).not.toHaveBeenCalled();

    fire(scene._canvas, 'pointerdown', 5, H - 5); // empty corner: the orbit gets it
    expect(orbit).toHaveBeenCalledTimes(1);
  });
});
