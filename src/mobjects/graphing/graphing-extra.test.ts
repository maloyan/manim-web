import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ImplicitFunction } from './ImplicitFunction';
import { VectorField, ArrowVectorField, StreamLines } from './VectorField';

const EPSILON = 1e-6;
function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

// BarChart creates Text (canvas-dependent). Mock document for Node.
describe('BarChart', () => {
  let BarChart: typeof import('./BarChart').BarChart;
  const mockCtx = {
    font: '',
    textBaseline: '',
    textAlign: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    measureText: (t: string) => ({
      width: t.length * 10,
      actualBoundingBoxAscent: 12,
      actualBoundingBoxDescent: 3,
    }),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };

  beforeAll(async () => {
    const origDoc = globalThis.document;
    vi.stubGlobal('document', {
      ...origDoc,
      createElement: (tag: string) => {
        if (tag === 'canvas')
          return {
            width: 100,
            height: 50,
            getContext: () => mockCtx,
            toDataURL: () => '',
            style: {},
          };
        return origDoc?.createElement?.(tag) ?? {};
      },
      fonts: { add: vi.fn() },
    });
    BarChart = (await import('./BarChart')).BarChart;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('should construct with simple data and store values', () => {
    const c = new BarChart({ values: [1, 2, 3] });
    expect(c).toBeDefined();
    expect(c.getValuesFlat()).toEqual([1, 2, 3]);
    expect(c.getNumSeries()).toBe(1);
    expect(c.getNumGroups()).toBe(3);
  });

  it('should have bars VGroup with correct count', () => {
    const c = new BarChart({ values: [4, 5, 6, 7] });
    expect(c.bars).toBeDefined();
    let count = 0;
    for (let g = 0; g < c.getNumGroups(); g++) if (c.getBar(g)) count++;
    expect(count).toBe(4);
  });

  it('should handle grouped bar data', () => {
    const c = new BarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(c.getNumGroups()).toBe(2);
    expect(c.getNumSeries()).toBe(2);
    for (let g = 0; g < 2; g++) for (let s = 0; s < 2; s++) expect(c.getBar(g, s)).toBeDefined();
  });

  it('bars with larger values should have larger heights', () => {
    const c = new BarChart({ values: [1, 5, 3] });
    const [h0, h1, h2] = [c.getBar(0)!, c.getBar(1)!, c.getBar(2)!].map((b) => b.getHeight());
    expect(h1).toBeGreaterThan(h0);
    expect(h1).toBeGreaterThan(h2);
    expect(h2).toBeGreaterThan(h0);
  });

  it('equal values should produce equal height bars', () => {
    const c = new BarChart({ values: [3, 3, 3] });
    const h0 = c.getBar(0)!.getHeight();
    const h1 = c.getBar(1)!.getHeight();
    const h2 = c.getBar(2)!.getHeight();
    expect(closeTo(h0, h1)).toBe(true);
    expect(closeTo(h1, h2)).toBe(true);
  });

  it('should accept custom colors (single and array)', () => {
    expect(new BarChart({ values: [1, 2], barColors: '#ff0000' })).toBeDefined();
    expect(new BarChart({ values: [1, 2], barColors: ['#ff0000', '#00ff00'] })).toBeDefined();
  });

  it('setBarColors should return this for chaining', () => {
    const c = new BarChart({ values: [1, 2] });
    expect(c.setBarColors('#123456')).toBe(c);
  });

  it('should accept custom barWidth and barGap', () => {
    expect(new BarChart({ values: [1, 2, 3], barWidth: 1.0 })).toBeDefined();
    const c = new BarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      barGap: 0.1,
      groupGap: 0.5,
    });
    expect(c.getNumGroups()).toBe(2);
  });

  it('should create xLabels for each group', () => {
    const c = new BarChart({ values: [1, 2], xLabels: ['X', 'Y'] });
    expect(c.xLabels).toBeDefined();
    expect(c.xLabels.children.length).toBe(2);
  });

  it('should use default and custom chart dimensions', () => {
    const d = new BarChart({ values: [1] });
    expect(d.getHeight()).toBe(5);
    expect(d.getWidth()).toBe(8);
    const c = new BarChart({ values: [1], height: 10, width: 12 });
    expect(c.getHeight()).toBe(10);
    expect(c.getWidth()).toBe(12);
  });

  it('should auto-calculate and accept custom yRange', () => {
    const auto = new BarChart({ values: [1, 2, 3] });
    const [yMin, yMax, step] = auto.getYRange();
    expect(yMin).toBe(0);
    expect(yMax).toBeGreaterThanOrEqual(3);
    expect(step).toBeGreaterThan(0);
    const custom = new BarChart({ values: [1, 2, 3], yRange: [0, 10, 2] });
    expect(custom.getYRange()).toEqual([0, 10, 2]);
  });

  it('changeBarValues should update values and return bars', () => {
    const c = new BarChart({ values: [1, 2, 3] });
    const result = c.changeBarValues([5, 3, 8]);
    expect(c.getValuesFlat()).toEqual([5, 3, 8]);
    expect(result).toBe(c.bars);
  });

  it('changeBarValues should handle values exceeding yRange', () => {
    const c = new BarChart({ values: [1, 2, 3], yRange: [0, 5, 1] });
    c.changeBarValues([10, 20, 30]);
    expect(c.getYRange()[1]).toBeGreaterThanOrEqual(30);
  });

  it('getBar should return bar or undefined', () => {
    const c = new BarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(c.getBar(0, 0)).toBeDefined();
    expect(c.getBar(1, 1)).toBeDefined();
    expect(c.getBar(5)).toBeUndefined();
    // Default seriesIndex = 0
    const c2 = new BarChart({ values: [1, 2, 3] });
    expect(c2.getBar(0)).toBeDefined();
  });

  it('getSeriesBars should return VGroup with bars', () => {
    // Note: getSeriesBars reparents bars via add(), shifting indices
    const c = new BarChart({
      values: [
        [1, 2, 3],
        [4, 5, 6],
      ],
    });
    const s = c.getSeriesBars(0);
    expect(s).toBeDefined();
    expect(s.children.length).toBeGreaterThan(0);
  });

  it('getValues should return a deep copy', () => {
    const c = new BarChart({ values: [1, 2, 3] });
    const vals = c.getValues();
    expect(vals).toEqual([[1, 2, 3]]);
    vals[0][0] = 999;
    expect(c.getValuesFlat()[0]).toBe(1);
  });

  it('setBarFillOpacity should return this', () => {
    const c = new BarChart({ values: [1, 2] });
    expect(c.setBarFillOpacity(0.5)).toBe(c);
  });

  it('legend should be null unless configured', () => {
    expect(new BarChart({ values: [1, 2] }).legend).toBeNull();
    const c = new BarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      seriesNames: ['A', 'B'],
      showLegend: true,
    });
    expect(c.legend).not.toBeNull();
  });

  it('should handle empty values', () => {
    expect(new BarChart({ values: [] }).getNumGroups()).toBe(0);
  });
});

// VectorField (base class)
describe('VectorField', () => {
  it('should construct and store function', () => {
    const func = (x: number, y: number): [number, number] => [x, y];
    const vf = new VectorField({ func });
    expect(vf).toBeDefined();
    expect(vf.getFunction()).toBe(func);
  });

  it('should have default ranges', () => {
    const vf = new VectorField({ func: (x, y) => [x, y] });
    expect(vf.getXRange()).toEqual([-5, 5, 0.5]);
    expect(vf.getYRange()).toEqual([-3, 3, 0.5]);
  });

  it('should accept custom ranges', () => {
    const vf = new VectorField({
      func: (x, y) => [x, y],
      xRange: [-2, 2, 1],
      yRange: [-1, 1, 0.5],
    });
    expect(vf.getXRange()).toEqual([-2, 2, 1]);
    expect(vf.getYRange()).toEqual([-1, 1, 0.5]);
  });

  it('lengthScale default, custom, and setter', () => {
    const vf = new VectorField({ func: (x, y) => [x, y] });
    expect(vf.getLengthScale()).toBe(1);
    const vf2 = new VectorField({ func: (x, y) => [x, y], lengthScale: 2.5 });
    expect(vf2.getLengthScale()).toBe(2.5);
    expect(vf.setLengthScale(3)).toBe(vf);
    expect(vf.getLengthScale()).toBe(3);
  });

  it('setFunction should update and chain', () => {
    const vf = new VectorField({ func: (x, y) => [x, y] });
    const fn2 = (x: number, y: number): [number, number] => [-y, x];
    expect(vf.setFunction(fn2)).toBe(vf);
    expect(vf.getFunction()).toBe(fn2);
  });

  it('interpolateFunction at alpha 0, 0.5, 1', () => {
    const vf0 = new VectorField({ func: (x, y) => [x, y] });
    vf0.interpolateFunction((x, y) => [-y, x], 0);
    const [a0x, a0y] = vf0.getFunction()(1, 0);
    expect(closeTo(a0x, 1) && closeTo(a0y, 0)).toBe(true);

    const vf1 = new VectorField({ func: (x, y) => [x, y] });
    vf1.interpolateFunction((x, y) => [-y, x], 1);
    const [a1x, a1y] = vf1.getFunction()(1, 0);
    expect(closeTo(a1x, 0) && closeTo(a1y, 1)).toBe(true);

    const vf5 = new VectorField({ func: (x, y) => [x, y] });
    expect(vf5.interpolateFunction((x, y) => [-y, x], 0.5)).toBe(vf5);
    const [mx, my] = vf5.getFunction()(2, 0);
    expect(closeTo(mx, 1) && closeTo(my, 1)).toBe(true);
  });

  it('copy should produce independent VectorField', () => {
    const vf = new VectorField({ func: (x, y) => [x, y], xRange: [-2, 2, 0.5] });
    const cp = vf.copy();
    expect(cp).toBeInstanceOf(VectorField);
    expect(cp).not.toBe(vf);
    expect(cp.getXRange()).toEqual([-2, 2, 0.5]);
  });
});

// ArrowVectorField
describe('ArrowVectorField', () => {
  it('should construct and have arrow children', () => {
    const avf = new ArrowVectorField({
      func: (_x, _y) => [1, 0],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
    });
    expect(avf).toBeDefined();
    expect(avf.children.length).toBeGreaterThan(0);
  });

  it('finer resolution produces more arrows', () => {
    const coarse = new ArrowVectorField({
      func: () => [1, 0] as [number, number],
      xRange: [-2, 2, 2],
      yRange: [-2, 2, 2],
    });
    const fine = new ArrowVectorField({
      func: () => [1, 0] as [number, number],
      xRange: [-2, 2, 1],
      yRange: [-2, 2, 1],
    });
    expect(fine.children.length).toBeGreaterThan(coarse.children.length);
  });

  it('should respect custom ranges', () => {
    const avf = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [0, 2, 1],
      yRange: [0, 2, 1],
    });
    expect(avf.getXRange()).toEqual([0, 2, 1]);
    expect(avf.getYRange()).toEqual([0, 2, 1]);
  });

  it('should evaluate function at grid points', () => {
    const pts: [number, number][] = [];
    new ArrowVectorField({
      func: (x, y) => {
        pts.push([x, y]);
        return [1, 0];
      },
      xRange: [0, 1, 1],
      yRange: [0, 1, 1],
    });
    expect(pts.length).toBeGreaterThanOrEqual(4);
    expect(pts.some(([x, y]) => closeTo(x, 0) && closeTo(y, 0))).toBe(true);
    expect(pts.some(([x, y]) => closeTo(x, 1) && closeTo(y, 1))).toBe(true);
  });

  it('zero vectors produce no arrows', () => {
    const avf = new ArrowVectorField({
      func: () => [0, 0] as [number, number],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
    });
    expect(avf.children.length).toBe(0);
  });

  it('normalizeArrows default, option, and setter', () => {
    const a = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
    });
    expect(a.getNormalizeArrows()).toBe(false);
    const b = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
      normalizeArrows: true,
    });
    expect(b.getNormalizeArrows()).toBe(true);
    expect(a.setNormalizeArrows(true)).toBe(a);
    expect(a.getNormalizeArrows()).toBe(true);
  });

  it('maxArrowLength default and setter', () => {
    const a = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [-1, 1, 0.5],
      yRange: [-1, 1, 0.5],
    });
    expect(a.getMaxArrowLength()).toBeGreaterThan(0);
    a.setMaxArrowLength(2.0);
    expect(a.getMaxArrowLength()).toBe(2.0);
  });

  it('should accept static color string and color function', () => {
    const a = new ArrowVectorField({
      func: () => [1, 0] as [number, number],
      xRange: [0, 0, 1],
      yRange: [0, 0, 1],
      color: '#00ff00',
    });
    expect(a.children.length).toBeGreaterThan(0);
    const b = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
      color: (m: number) => (m > 1 ? '#f00' : '#00f'),
    });
    expect(b.children.length).toBeGreaterThan(0);
  });

  it('minMagnitude filters small vectors', () => {
    const a = new ArrowVectorField({
      func: (x, y) => [x * 0.01, y * 0.01],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
      minMagnitude: 0.1,
    });
    expect(a.children.length).toBe(0);
  });

  it('copy produces ArrowVectorField', () => {
    const a = new ArrowVectorField({
      func: (x, y) => [x, y],
      xRange: [-1, 1, 1],
      yRange: [-1, 1, 1],
    });
    const cp = a.copy();
    expect(cp).toBeInstanceOf(ArrowVectorField);
    expect(cp).not.toBe(a);
  });
});

// StreamLines
describe('StreamLines', () => {
  it('should construct and generate children', () => {
    const sl = new StreamLines({
      func: () => [1, 0] as [number, number],
      xRange: [-2, 2, 1],
      yRange: [-2, 2, 1],
      numLines: 5,
    });
    expect(sl).toBeDefined();
    expect(sl.children.length).toBeGreaterThan(0);
  });

  it('numLines default, custom, and setter', () => {
    expect(new StreamLines({ func: () => [1, 0] as [number, number] }).getNumLines()).toBe(15);
    expect(
      new StreamLines({ func: () => [1, 0] as [number, number], numLines: 8 }).getNumLines(),
    ).toBe(8);
    const sl = new StreamLines({ func: () => [1, 0] as [number, number], numLines: 5 });
    sl.setNumLines(10);
    expect(sl.getNumLines()).toBe(10);
  });

  it('should accept and update startPoints', () => {
    const pts: [number, number][] = [
      [0, 0],
      [1, 1],
      [-1, -1],
    ];
    const sl = new StreamLines({ func: () => [1, 0] as [number, number], startPoints: pts });
    expect(sl.getStartPoints()).toEqual(pts);
    const newPts: [number, number][] = [
      [0, 0],
      [1, 0],
    ];
    sl.setStartPoints(newPts);
    expect(sl.getStartPoints()).toEqual(newPts);
  });

  it('maxLineLength default and setter', () => {
    const sl = new StreamLines({ func: () => [1, 0] as [number, number] });
    expect(sl.getMaxLineLength()).toBe(10);
    sl.setMaxLineLength(20);
    expect(sl.getMaxLineLength()).toBe(20);
  });

  it('showArrows default and setter', () => {
    const sl = new StreamLines({ func: () => [1, 0] as [number, number] });
    expect(sl.getShowArrows()).toBe(false);
    sl.setShowArrows(true);
    expect(sl.getShowArrows()).toBe(true);
  });

  it('copy produces StreamLines', () => {
    const sl = new StreamLines({ func: () => [1, 0] as [number, number], numLines: 5 });
    const cp = sl.copy();
    expect(cp).toBeInstanceOf(StreamLines);
    expect(cp).not.toBe(sl);
  });
});

// ImplicitFunction
describe('ImplicitFunction', () => {
  const circleFunc = (x: number, y: number) => x * x + y * y - 1;

  it('should create circle and have non-empty points', () => {
    const c = new ImplicitFunction({ func: circleFunc });
    expect(c).toBeDefined();
    expect(c.getPoints().length).toBeGreaterThan(0);
  });

  it('should have points near the unit circle', () => {
    const c = new ImplicitFunction({ func: circleFunc, minDepth: 5, maxDepth: 7 });
    const pts = c.getPoints();
    let found = false;
    for (let i = 0; i < pts.length; i += 3) {
      const d = Math.sqrt(pts[i][0] ** 2 + pts[i][1] ** 2);
      if (Math.abs(d - 1) < 0.2) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('should accept and update custom ranges', () => {
    const imp = new ImplicitFunction({ func: circleFunc, xRange: [-2, 2], yRange: [-2, 2] });
    expect(imp.getXRange()).toEqual([-2, 2]);
    expect(imp.getYRange()).toEqual([-2, 2]);
    imp.setXRange([-3, 3]);
    expect(imp.getXRange()).toEqual([-3, 3]);
    imp.setYRange([-4, 4]);
    expect(imp.getYRange()).toEqual([-4, 4]);
  });

  it('should accept custom depth and finer depth produces more points', () => {
    const low = new ImplicitFunction({
      func: circleFunc,
      xRange: [-2, 2],
      yRange: [-2, 2],
      minDepth: 3,
      maxDepth: 4,
    });
    const high = new ImplicitFunction({
      func: circleFunc,
      xRange: [-2, 2],
      yRange: [-2, 2],
      minDepth: 3,
      maxDepth: 7,
    });
    expect(low.getPoints().length).toBeGreaterThan(0);
    expect(high.getPoints().length).toBeGreaterThan(low.getPoints().length);
  });

  it('different equations produce different point sets', () => {
    const circle = new ImplicitFunction({
      func: circleFunc,
      xRange: [-3, 3],
      yRange: [-3, 3],
      minDepth: 4,
      maxDepth: 6,
    });
    const line = new ImplicitFunction({
      func: (x, y) => y - x,
      xRange: [-3, 3],
      yRange: [-3, 3],
      minDepth: 4,
      maxDepth: 6,
    });
    expect(circle.getPoints().length).toBeGreaterThan(0);
    expect(line.getPoints().length).toBeGreaterThan(0);
    expect(circle.getPoints().length).not.toBe(line.getPoints().length);
  });

  it('hyperbola and sine curve produce points', () => {
    const hyp = new ImplicitFunction({
      func: (x, y) => x * x - y * y - 1,
      xRange: [-3, 3],
      yRange: [-3, 3],
      minDepth: 4,
      maxDepth: 6,
    });
    expect(hyp.getPoints().length).toBeGreaterThan(0);
    const sine = new ImplicitFunction({
      func: (x, y) => y - Math.sin(x),
      xRange: [-3, 3],
      yRange: [-2, 2],
      minDepth: 4,
      maxDepth: 7,
    });
    expect(sine.getPoints().length).toBeGreaterThan(0);
  });

  it('no-solution equation has no points', () => {
    const ns = new ImplicitFunction({
      func: (x, y) => x * x + y * y + 1,
      xRange: [-2, 2],
      yRange: [-2, 2],
      minDepth: 3,
      maxDepth: 5,
    });
    expect(ns.getPoints().length).toBe(0);
  });

  it('styling defaults and custom', () => {
    const d = new ImplicitFunction({ func: circleFunc });
    expect(d.color).toBe('#58c4dd');
    expect(d.fillOpacity).toBe(0);
    const c = new ImplicitFunction({ func: circleFunc, color: '#ff0000', strokeWidth: 5 });
    expect(c.color).toBe('#ff0000');
    expect(c.strokeWidth).toBe(5);
  });

  it('setFunction should regenerate and chain', () => {
    const imp = new ImplicitFunction({
      func: circleFunc,
      xRange: [-3, 3],
      yRange: [-3, 3],
      minDepth: 4,
      maxDepth: 6,
    });
    const before = imp.getPoints().length;
    expect(imp.setFunction((x, y) => y - x)).toBe(imp);
    const after = imp.getPoints().length;
    expect(after).toBeGreaterThan(0);
    expect(after).not.toBe(before);
  });

  it('getFunction returns stored function', () => {
    const imp = new ImplicitFunction({ func: circleFunc });
    expect(imp.getFunction()).toBe(circleFunc);
  });

  it('setAxes(null) chains', () => {
    const imp = new ImplicitFunction({ func: circleFunc });
    expect(imp.setAxes(null)).toBe(imp);
  });

  it('copy produces independent ImplicitFunction', () => {
    const imp = new ImplicitFunction({
      func: circleFunc,
      color: '#00ff00',
      xRange: [-2, 2],
      yRange: [-2, 2],
    });
    const cp = imp.copy();
    expect(cp).toBeInstanceOf(ImplicitFunction);
    expect(cp).not.toBe(imp);
    expect(cp.color).toBe('#00ff00');
    expect(cp.getXRange()).toEqual([-2, 2]);
  });
});
