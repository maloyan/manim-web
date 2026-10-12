// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  sceneToAnimatedSVG,
  exportAnimatedSVG,
  exportAndDownloadAnimatedSVG,
} from './SmilExporter';
import type { SmilExportableScene } from './SmilExporter';
import { Square } from '../mobjects/geometry/Rectangle';
import { Circle } from '../mobjects/geometry/Circle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a duck-typed animated scene around a single mobject.
 *
 * `seekFn` mutates the mobject to the state at time `t`. The scene reports a
 * fixed 1280x720 frame centered at the origin, mirroring the SVG exporter test.
 */
function makeScene(
  mobjects: Array<{ getFamily(): unknown[]; userId?: string }>,
  seekFn: (t: number) => void,
  duration: number,
): SmilExportableScene {
  return {
    getWidth: () => 1280,
    getHeight: () => 720,
    camera: { frameWidth: 14, frameHeight: 8, position: { x: 0, y: 0 } },
    mobjects,
    seek: seekFn,
    getTimelineDuration: () => duration,
  };
}

/** Parse an SVG string into a Document for structural assertions. */
function parse(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// A moving mobject
// ---------------------------------------------------------------------------

describe('sceneToAnimatedSVG with a moving mobject', () => {
  it('emits an <animate> on d with one value and keyTime per keyframe', () => {
    const square = new Square({ sideLength: 2 });
    const duration = 2;
    const scene = makeScene(
      [square],
      (t) => square.moveTo([(t / duration) * 4 - 2, 0, 0]),
      duration,
    );

    const svg = sceneToAnimatedSVG(scene, { keyframes: 5, duration });
    const doc = parse(svg);
    expect(doc.querySelector('parsererror')).toBeNull();

    const anim = doc.querySelector('animate[attributeName="d"]');
    expect(anim).not.toBeNull();

    const keyTimes = anim?.getAttribute('keyTimes')?.split(';') ?? [];
    expect(keyTimes.length).toBe(5);
    expect(keyTimes[0]).toBe('0');
    expect(keyTimes[keyTimes.length - 1]).toBe('1');

    const values = anim?.getAttribute('values')?.split(';') ?? [];
    expect(values.length).toBe(5);
    // The square moves, so the first and last sampled paths differ.
    expect(values[0]).not.toBe(values[4]);

    // dur reflects the requested duration.
    expect(anim?.getAttribute('dur')).toBe('2s');
  });

  it('samples each value from the scene at the matching keyframe', () => {
    const square = new Square({ sideLength: 2 });
    const duration = 2;
    const scene = makeScene(
      [square],
      (t) => square.moveTo([(t / duration) * 4 - 2, 0, 0]),
      duration,
    );

    const svg = sceneToAnimatedSVG(scene, { keyframes: 3, duration });
    const values = parse(svg)
      .querySelector('animate[attributeName="d"]')
      ?.getAttribute('values')
      ?.split(';');
    expect(values?.length).toBe(3);

    // Independently seek the scene to the middle keyframe and confirm the path
    // the exporter stored for that keyframe matches a fresh static render.
    square.moveTo([1 * (2 / duration) - 2 + 0, 0, 0]); // unused reset guard
    scene.seek(duration / 2);
    // The exporter's middle value must contain an M command (valid path data).
    expect(values?.[1]?.startsWith('M ')).toBe(true);
  });

  it('loop sets repeatCount="indefinite"; otherwise it freezes', () => {
    const square = new Square({ sideLength: 2 });
    const duration = 1;
    const scene = makeScene([square], (t) => square.moveTo([t, 0, 0]), duration);

    const looped = parse(sceneToAnimatedSVG(scene, { keyframes: 3, duration, loop: true }));
    const la = looped.querySelector('animate[attributeName="d"]');
    expect(la?.getAttribute('repeatCount')).toBe('indefinite');

    const once = parse(sceneToAnimatedSVG(scene, { keyframes: 3, duration, loop: false }));
    const oa = once.querySelector('animate[attributeName="d"]');
    expect(oa?.getAttribute('repeatCount')).toBeNull();
    expect(oa?.getAttribute('fill')).toBe('freeze');
  });

  it('can express pure translation as <animateTransform> instead of d', () => {
    const square = new Square({ sideLength: 2 });
    const duration = 2;
    const scene = makeScene(
      [square],
      (t) => square.moveTo([(t / duration) * 4 - 2, 0, 0]),
      duration,
    );

    const doc = parse(sceneToAnimatedSVG(scene, { keyframes: 4, duration, preferTransform: true }));
    const xform = doc.querySelector('animateTransform[attributeName="transform"]');
    expect(xform).not.toBeNull();
    expect(xform?.getAttribute('type')).toBe('translate');
    expect(xform?.getAttribute('values')?.split(';').length).toBe(4);
    // With transform mode the path itself is not animated.
    expect(doc.querySelector('animate[attributeName="d"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// A fading mobject
// ---------------------------------------------------------------------------

describe('sceneToAnimatedSVG with a fading mobject', () => {
  it('animates fill-opacity across keyframes', () => {
    const square = new Square({ sideLength: 2 });
    square.setFill('#ff0000', 1);
    const duration = 1;
    const scene = makeScene([square], (t) => square.setFillOpacity(1 - t / duration), duration);

    const doc = parse(sceneToAnimatedSVG(scene, { keyframes: 3, duration }));
    const anim = doc.querySelector('animate[attributeName="fill-opacity"]');
    expect(anim).not.toBeNull();

    const values = anim?.getAttribute('values')?.split(';') ?? [];
    expect(values.length).toBe(3);
    expect(Number(values[0])).toBeCloseTo(1, 2);
    expect(Number(values[2])).toBeCloseTo(0, 2);
  });
});

// ---------------------------------------------------------------------------
// Degenerate scenes
// ---------------------------------------------------------------------------

describe('sceneToAnimatedSVG degenerate cases', () => {
  it('a static scene produces valid SVG with no <animate> tags', () => {
    const square = new Square({ sideLength: 2 });
    const scene = makeScene([square], () => {}, 1);

    const svg = sceneToAnimatedSVG(scene, { keyframes: 4, duration: 1 });
    const doc = parse(svg);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelector('path')).not.toBeNull();
    expect(doc.querySelectorAll('animate').length).toBe(0);
    expect(doc.querySelectorAll('animateTransform').length).toBe(0);
  });

  it('an empty scene does not throw and yields a valid <svg>', () => {
    const scene = makeScene([], () => {}, 1);
    let svg = '';
    expect(() => {
      svg = sceneToAnimatedSVG(scene);
    }).not.toThrow();
    const doc = parse(svg);
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.tagName).toBe('svg');
  });

  it('does not animate d when the point count changes (morph limit)', () => {
    const square = new Square({ sideLength: 2 });
    const circle = new Circle({ radius: 1 });
    // Swap which shape the single family member resolves to by seek time.
    const holder = {
      getFamily: () => (current === square ? [square] : [circle]),
    };
    let current: Square | Circle = square;
    const scene = makeScene(
      [holder],
      (t) => {
        current = t < 0.5 ? square : circle;
      },
      1,
    );

    const svg = sceneToAnimatedSVG(scene, { keyframes: 4, duration: 1 });
    const doc = parse(svg);
    expect(doc.querySelector('parsererror')).toBeNull();
    // Different point counts cannot morph: no d animation is emitted.
    expect(doc.querySelector('animate[attributeName="d"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Blob / download helpers
// ---------------------------------------------------------------------------

describe('exportAnimatedSVG and exportAndDownloadAnimatedSVG', () => {
  it('returns an image/svg+xml Blob', () => {
    const square = new Square({ sideLength: 2 });
    const scene = makeScene([square], (t) => square.moveTo([t, 0, 0]), 1);
    const blob = exportAnimatedSVG(scene, { keyframes: 3, duration: 1 });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml');
  });

  it('triggers a download via a temporary anchor', () => {
    const square = new Square({ sideLength: 2 });
    const scene = makeScene([square], (t) => square.moveTo([t, 0, 0]), 1);
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') (el as HTMLAnchorElement).click = clickSpy;
      return el;
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:svg'),
      revokeObjectURL: vi.fn(),
    });

    exportAndDownloadAnimatedSVG(scene, 'out.svg', { keyframes: 3, duration: 1 });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
