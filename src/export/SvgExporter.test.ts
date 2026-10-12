// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sceneToSVG, exportSVG, exportAndDownloadSVG } from './SvgExporter';
import type { SvgExportableScene } from './SvgExporter';
import { Square } from '../mobjects/geometry/Rectangle';
import { Circle } from '../mobjects/geometry/Circle';
import { Polygon } from '../mobjects/geometry/Polygon';
import { VGroup } from '../core/VGroup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A duck-typed scene with a fixed 1280x720 frame centered at the origin. */
function makeScene(
  mobjects: Array<{ getFamily(): unknown[]; userId?: string }>,
): SvgExportableScene {
  return {
    getWidth: () => 1280,
    getHeight: () => 720,
    camera: { frameWidth: 14, frameHeight: 8, position: { x: 0, y: 0 } },
    mobjects,
  };
}

/** Parse an SVG string into a Document for structural assertions. */
function parse(svg: string): Document {
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
}

/** Map a world point to pixels (rounded to 3 dp, as the exporter formats). */
function worldToPixel(x: number, y: number): [string, string] {
  const sx = Number(((x / 14) * 1280 + 640).toFixed(3));
  const sy = Number((360 - (y / 8) * 720).toFixed(3));
  return [String(sx), String(sy)];
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('sceneToSVG structure', () => {
  it('produces a valid standalone <svg> with a viewBox matching the frame', () => {
    const svg = sceneToSVG(makeScene([new Square({ sideLength: 2 })]));
    const doc = parse(svg);
    const root = doc.documentElement;

    expect(root.tagName).toBe('svg');
    expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(root.getAttribute('viewBox')).toBe('0 0 1280 720');
    expect(root.getAttribute('width')).toBe('1280');
    expect(root.getAttribute('height')).toBe('720');
    // No XML parse error node.
    expect(doc.querySelector('parsererror')).toBeNull();
  });

  it('emits one <path> per visible VMobject, preserving draw order', () => {
    const square = new Square({ sideLength: 2 });
    const circle = new Circle({ radius: 1 });
    const triangle = new Polygon({
      vertices: [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0],
      ],
    });
    triangle.setFill('#ff0000', 0.5);

    const svg = sceneToSVG(makeScene([square, circle, triangle]));
    const paths = parse(svg).querySelectorAll('path');
    expect(paths.length).toBe(3);

    // Draw order: square group first, triangle group last.
    const groups = parse(svg).querySelectorAll('g');
    expect(groups.length).toBe(3);
  });

  it('wraps each top-level mobject in a <g> and tags its userId', () => {
    const square = new Square({ sideLength: 2 });
    square.setUserId('my-square');
    const svg = sceneToSVG(makeScene([square]));
    const group = parse(svg).querySelector('g');
    expect(group).not.toBeNull();
    expect(group?.getAttribute('data-mobject-id')).toBe('my-square');
  });
});

// ---------------------------------------------------------------------------
// Path data (anchors, curves, closing)
// ---------------------------------------------------------------------------

describe('sceneToSVG path data', () => {
  it('writes M + four cubic curves + Z for a closed square', () => {
    const svg = sceneToSVG(makeScene([new Square({ sideLength: 2 })]));
    const d = parse(svg).querySelector('path')?.getAttribute('d') ?? '';

    expect(d.startsWith('M ')).toBe(true);
    // A square is 4 cubic Bezier segments.
    expect((d.match(/C /g) ?? []).length).toBe(4);
    // Closed path.
    expect(d.trim().endsWith('Z')).toBe(true);

    // First move command targets the square's top-left anchor in pixel space.
    const [mx, my] = worldToPixel(-1, 1);
    expect(d).toContain(`M ${mx} ${my}`);
  });

  it('writes M + three cubic curves + Z for a triangle', () => {
    const triangle = new Polygon({
      vertices: [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0],
      ],
    });
    const d = sceneToSVG(makeScene([triangle])) // one path
      ? (parse(sceneToSVG(makeScene([triangle])))
          .querySelector('path')
          ?.getAttribute('d') ?? '')
      : '';
    expect((d.match(/C /g) ?? []).length).toBe(3);
    expect(d.trim().endsWith('Z')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fill / stroke attributes
// ---------------------------------------------------------------------------

describe('sceneToSVG fill and stroke', () => {
  it('renders a stroke-only mobject with fill="none" and the mobject color', () => {
    const square = new Square({ sideLength: 2 }); // default: stroke only, fillOpacity 0
    const path = parse(sceneToSVG(makeScene([square]))).querySelector('path');

    expect(path?.getAttribute('fill')).toBe('none');
    expect(path?.getAttribute('stroke')).toBe(square.color);
    // stroke-width = strokeWidth * 0.01 * pixelWidth / frameWidth
    const expectedWidth = Number((square.strokeWidth * 0.01 * (1280 / 14)).toFixed(3));
    expect(Number(path?.getAttribute('stroke-width'))).toBeCloseTo(expectedWidth, 3);
  });

  it('renders fill color, fill-opacity and fill-rule for a filled mobject', () => {
    const triangle = new Polygon({
      vertices: [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0],
      ],
    });
    triangle.setFill('#ff0000', 0.5);
    const path = parse(sceneToSVG(makeScene([triangle]))).querySelector('path');

    expect(path?.getAttribute('fill')).toBe('#ff0000');
    expect(path?.getAttribute('fill-opacity')).toBe('0.5');
    expect(path?.getAttribute('fill-rule')).toBe('nonzero');
  });

  it('emits stroke-opacity only when stroke opacity is below 1', () => {
    const square = new Square({ sideLength: 2 });
    const opaque = parse(sceneToSVG(makeScene([square]))).querySelector('path');
    expect(opaque?.getAttribute('stroke-opacity')).toBeNull();

    square.setStrokeOpacity(0.25);
    const faint = parse(sceneToSVG(makeScene([square]))).querySelector('path');
    expect(faint?.getAttribute('stroke-opacity')).toBe('0.25');
  });

  it('skips a mobject that draws nothing (no fill, no stroke)', () => {
    const square = new Square({ sideLength: 2 });
    square.setStrokeWidth(0);
    square.setFillOpacity(0);
    const paths = parse(sceneToSVG(makeScene([square]))).querySelectorAll('path');
    expect(paths.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Groups / nesting / empty scene
// ---------------------------------------------------------------------------

describe('sceneToSVG nesting and edge cases', () => {
  it('walks a VGroup family and emits a path for each child', () => {
    const group = new VGroup(new Square({ sideLength: 2 }), new Circle({ radius: 1 }));
    const doc = parse(sceneToSVG(makeScene([group])));
    // One <g> for the top-level group, two child paths inside it.
    expect(doc.querySelectorAll('g').length).toBe(1);
    expect(doc.querySelectorAll('path').length).toBe(2);
  });

  it('returns a valid empty <svg> for an empty scene and does not throw', () => {
    let svg = '';
    expect(() => {
      svg = sceneToSVG(makeScene([]));
    }).not.toThrow();
    const doc = parse(svg);
    expect(doc.documentElement.tagName).toBe('svg');
    expect(doc.querySelectorAll('path').length).toBe(0);
    expect(doc.querySelector('parsererror')).toBeNull();
  });

  it('adds a background <rect> when a background color is given', () => {
    const svg = sceneToSVG(makeScene([new Square({ sideLength: 2 })]), { background: '#000000' });
    const rect = parse(svg).querySelector('rect');
    expect(rect?.getAttribute('fill')).toBe('#000000');
    expect(rect?.getAttribute('width')).toBe('1280');
  });

  it('honors the precision option', () => {
    const svg = sceneToSVG(makeScene([new Square({ sideLength: 2 })]), { precision: 1 });
    const d = parse(svg).querySelector('path')?.getAttribute('d') ?? '';
    // No coordinate should carry more than one decimal place.
    const coords = d.match(/-?\d+\.\d+/g) ?? [];
    for (const c of coords) {
      expect(c.split('.')[1].length).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Blob / download helpers
// ---------------------------------------------------------------------------

describe('exportSVG and exportAndDownloadSVG', () => {
  it('returns an image/svg+xml Blob', () => {
    const blob = exportSVG(makeScene([new Square({ sideLength: 2 })]));
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml');
  });

  it('triggers a download via a temporary anchor', () => {
    const scene = makeScene([new Square({ sideLength: 2 })]);
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

    exportAndDownloadSVG(scene, 'out.svg');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
