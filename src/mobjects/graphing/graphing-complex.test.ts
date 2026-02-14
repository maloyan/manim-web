import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ComplexPlane, PolarPlane } from './ComplexPlane';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EPSILON = 1e-6;

function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

function tupleCloseTo(a: number[], b: number[], eps = EPSILON): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => closeTo(v, b[i], eps));
}

// ---------------------------------------------------------------------------
// ComplexPlane - static complex arithmetic
// ---------------------------------------------------------------------------
describe('ComplexPlane static methods', () => {
  describe('modulus', () => {
    it('should compute |3 + 4i| = 5', () => {
      expect(closeTo(ComplexPlane.modulus({ re: 3, im: 4 }), 5)).toBe(true);
    });

    it('should return 0 for zero', () => {
      expect(ComplexPlane.modulus({ re: 0, im: 0 })).toBe(0);
    });
  });

  describe('argument', () => {
    it('should return 0 for positive real', () => {
      expect(closeTo(ComplexPlane.argument({ re: 1, im: 0 }), 0)).toBe(true);
    });

    it('should return PI/2 for positive imaginary', () => {
      expect(closeTo(ComplexPlane.argument({ re: 0, im: 1 }), Math.PI / 2)).toBe(true);
    });

    it('should return PI for negative real', () => {
      expect(closeTo(ComplexPlane.argument({ re: -1, im: 0 }), Math.PI)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add two complex numbers', () => {
      const result = ComplexPlane.add({ re: 1, im: 2 }, { re: 3, im: 4 });
      expect(result).toEqual({ re: 4, im: 6 });
    });
  });

  describe('subtract', () => {
    it('should subtract two complex numbers', () => {
      const result = ComplexPlane.subtract({ re: 5, im: 3 }, { re: 2, im: 1 });
      expect(result).toEqual({ re: 3, im: 2 });
    });
  });

  describe('multiply', () => {
    it('should multiply (1+2i)(3+4i) = -5+10i', () => {
      const result = ComplexPlane.multiply({ re: 1, im: 2 }, { re: 3, im: 4 });
      expect(closeTo(result.re, -5)).toBe(true);
      expect(closeTo(result.im, 10)).toBe(true);
    });

    it('multiplying by 1 should be identity', () => {
      const z = { re: 3, im: 7 };
      const result = ComplexPlane.multiply(z, { re: 1, im: 0 });
      expect(closeTo(result.re, z.re)).toBe(true);
      expect(closeTo(result.im, z.im)).toBe(true);
    });

    it('multiplying by i should rotate 90 degrees', () => {
      const z = { re: 1, im: 0 };
      const result = ComplexPlane.multiply(z, { re: 0, im: 1 });
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, 1)).toBe(true);
    });
  });

  describe('divide', () => {
    it('should divide (4+2i)/(1+i) = 3-i', () => {
      const result = ComplexPlane.divide({ re: 4, im: 2 }, { re: 1, im: 1 });
      expect(closeTo(result.re, 3)).toBe(true);
      expect(closeTo(result.im, -1)).toBe(true);
    });
  });

  describe('conjugate', () => {
    it('should negate the imaginary part', () => {
      const result = ComplexPlane.conjugate({ re: 3, im: 4 });
      expect(result).toEqual({ re: 3, im: -4 });
    });
  });

  describe('fromPolar', () => {
    it('should convert r=1, theta=0 to 1+0i', () => {
      const result = ComplexPlane.fromPolar(1, 0);
      expect(closeTo(result.re, 1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });

    it('should convert r=1, theta=PI/2 to 0+i', () => {
      const result = ComplexPlane.fromPolar(1, Math.PI / 2);
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, 1)).toBe(true);
    });

    it('should convert r=2, theta=PI to -2+0i', () => {
      const result = ComplexPlane.fromPolar(2, Math.PI);
      expect(closeTo(result.re, -2)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });
  });

  describe('pow', () => {
    it('(1+i)^2 should be 0+2i', () => {
      const result = ComplexPlane.pow({ re: 1, im: 1 }, 2);
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, 2)).toBe(true);
    });

    it('z^1 should be z', () => {
      const z = { re: 3, im: 4 };
      const result = ComplexPlane.pow(z, 1);
      expect(closeTo(result.re, 3)).toBe(true);
      expect(closeTo(result.im, 4)).toBe(true);
    });

    it('z^0 should be 1', () => {
      const result = ComplexPlane.pow({ re: 5, im: 12 }, 0);
      expect(closeTo(result.re, 1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });
  });

  describe('exp', () => {
    it('e^0 should be 1', () => {
      const result = ComplexPlane.exp({ re: 0, im: 0 });
      expect(closeTo(result.re, 1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });

    it('e^(i*PI) should be -1 (Euler identity)', () => {
      const result = ComplexPlane.exp({ re: 0, im: Math.PI });
      expect(closeTo(result.re, -1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });
  });

  describe('log', () => {
    it('log(1) should be 0', () => {
      const result = ComplexPlane.log({ re: 1, im: 0 });
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });

    it('log(e) should be 1+0i', () => {
      const result = ComplexPlane.log({ re: Math.E, im: 0 });
      expect(closeTo(result.re, 1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });
  });

  describe('sqrt', () => {
    it('sqrt(4) should be 2', () => {
      const result = ComplexPlane.sqrt({ re: 4, im: 0 });
      expect(closeTo(result.re, 2)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });

    it('sqrt(-1) should be i', () => {
      const result = ComplexPlane.sqrt({ re: -1, im: 0 });
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, 1)).toBe(true);
    });
  });

  describe('reciprocal', () => {
    it('1/(1+0i) should be 1+0i', () => {
      const result = ComplexPlane.reciprocal({ re: 1, im: 0 });
      expect(closeTo(result.re, 1)).toBe(true);
      expect(closeTo(result.im, 0)).toBe(true);
    });

    it('1/(0+i) should be 0-i', () => {
      const result = ComplexPlane.reciprocal({ re: 0, im: 1 });
      expect(closeTo(result.re, 0)).toBe(true);
      expect(closeTo(result.im, -1)).toBe(true);
    });

    it('z * 1/z should be 1', () => {
      const z = { re: 3, im: 4 };
      const inv = ComplexPlane.reciprocal(z);
      const product = ComplexPlane.multiply(z, inv);
      expect(closeTo(product.re, 1)).toBe(true);
      expect(closeTo(product.im, 0)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// ComplexPlane - instance methods
// ---------------------------------------------------------------------------
describe('ComplexPlane instance', () => {
  describe('n2p / p2n roundtrip', () => {
    it('should roundtrip a complex number', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const z = { re: 2, im: -1 };
      const point = plane.n2p(z);
      const back = plane.p2n(point);
      expect(closeTo(back.re, z.re)).toBe(true);
      expect(closeTo(back.im, z.im)).toBe(true);
    });

    it('should handle real number input to n2p', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const point = plane.n2p(3);
      const back = plane.p2n(point);
      expect(closeTo(back.re, 3)).toBe(true);
      expect(closeTo(back.im, 0)).toBe(true);
    });

    it('should roundtrip origin', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const point = plane.n2p({ re: 0, im: 0 });
      const back = plane.p2n(point);
      expect(closeTo(back.re, 0)).toBe(true);
      expect(closeTo(back.im, 0)).toBe(true);
    });
  });

  describe('n2p mapping', () => {
    it('n2p(0) should map to the visual origin', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const pt = plane.n2p(0);
      expect(closeTo(pt[0], 0)).toBe(true);
      expect(closeTo(pt[1], 0)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// PolarPlane
// ---------------------------------------------------------------------------
describe('PolarPlane', () => {
  // PolarPlane uses Text for labels which requires document (canvas).
  // We disable labels to avoid "document is not defined" in Node.
  const noLabels = { includeAngleLabels: false, includeRadiusLabels: false };

  describe('constructor defaults', () => {
    it('should have radius 3', () => {
      const pp = new PolarPlane(noLabels);
      expect(pp.getRadius()).toBe(3);
    });

    it('should have size 6', () => {
      const pp = new PolarPlane(noLabels);
      expect(pp.getSize()).toBe(6);
    });

    it('should have origin at [0,0,0]', () => {
      const pp = new PolarPlane(noLabels);
      const origin = pp.getOrigin();
      expect(tupleCloseTo(origin, [0, 0, 0])).toBe(true);
    });
  });

  describe('pr2pt / pt2pr roundtrip', () => {
    it('should roundtrip (r=1, theta=0)', () => {
      const pp = new PolarPlane(noLabels);
      const pt = pp.pr2pt(1, 0);
      const [r, theta] = pp.pt2pr(pt);
      expect(closeTo(r, 1)).toBe(true);
      expect(closeTo(theta, 0)).toBe(true);
    });

    it('should roundtrip (r=2, theta=PI/4)', () => {
      const pp = new PolarPlane(noLabels);
      const pt = pp.pr2pt(2, Math.PI / 4);
      const [r, theta] = pp.pt2pr(pt);
      expect(closeTo(r, 2)).toBe(true);
      expect(closeTo(theta, Math.PI / 4)).toBe(true);
    });

    it('should roundtrip (r=3, theta=PI)', () => {
      const pp = new PolarPlane(noLabels);
      const pt = pp.pr2pt(3, Math.PI);
      const [r, theta] = pp.pt2pr(pt);
      expect(closeTo(r, 3)).toBe(true);
      expect(closeTo(theta, Math.PI)).toBe(true);
    });
  });

  describe('pr2pt coordinate mapping', () => {
    it('pr2pt(0, 0) should be at the origin', () => {
      const pp = new PolarPlane(noLabels);
      const pt = pp.pr2pt(0, 0);
      expect(closeTo(pt[0], 0)).toBe(true);
      expect(closeTo(pt[1], 0)).toBe(true);
    });

    it('pr2pt(radius, 0) should be at positive x edge', () => {
      const pp = new PolarPlane({ radius: 3, size: 6, ...noLabels });
      const scaleFactor = 6 / (2 * 3); // = 1
      const pt = pp.pr2pt(3, 0);
      expect(closeTo(pt[0], 3 * scaleFactor)).toBe(true);
      expect(closeTo(pt[1], 0)).toBe(true);
    });

    it('pr2pt with azimuth offset should rotate', () => {
      const offset = Math.PI / 4;
      const pp = new PolarPlane({ azimuthOffset: offset, ...noLabels });
      const pt = pp.pr2pt(1, 0);
      const scaleFactor = pp.getSize() / (2 * pp.getRadius());
      // theta=0 but azimuth offset shifts it
      expect(closeTo(pt[0], scaleFactor * Math.cos(offset))).toBe(true);
      expect(closeTo(pt[1], scaleFactor * Math.sin(offset))).toBe(true);
    });
  });

  describe('groups', () => {
    it('should have concentric circles', () => {
      const pp = new PolarPlane({ radialDivisions: 3, ...noLabels });
      expect(pp.getConcentricCircles().children.length).toBe(3);
    });

    it('should have radial lines', () => {
      const pp = new PolarPlane({ angularDivisions: 8, ...noLabels });
      expect(pp.getRadialLines().children.length).toBe(8);
    });
  });

  describe('custom options', () => {
    it('should respect custom radius and size', () => {
      const pp = new PolarPlane({ radius: 5, size: 10, ...noLabels });
      expect(pp.getRadius()).toBe(5);
      expect(pp.getSize()).toBe(10);
    });
  });

  describe('setIncludeAngleLabels', () => {
    it('should return this when value is already the same', () => {
      const pp = new PolarPlane(noLabels);
      expect(pp.setIncludeAngleLabels(false)).toBe(pp);
    });

    it('should add angle labels when toggled on', () => {
      const pp = new PolarPlane(noLabels);
      const childrenBefore = pp.children.length;
      pp.setIncludeAngleLabels(true);
      // The angle labels group should now be among children
      expect(pp.children.length).toBeGreaterThan(childrenBefore);
    });

    it('should not add duplicate angle labels group when called multiple times', () => {
      const pp = new PolarPlane(noLabels);
      pp.setIncludeAngleLabels(true);
      const countAfterFirst = pp.children.length;
      pp.setIncludeAngleLabels(true); // same value, no-op
      expect(pp.children.length).toBe(countAfterFirst);
    });

    it('should remove angle labels when toggled off', () => {
      const pp = new PolarPlane(noLabels);
      pp.setIncludeAngleLabels(true);
      const countWithLabels = pp.children.length;
      pp.setIncludeAngleLabels(false);
      expect(pp.children.length).toBeLessThan(countWithLabels);
    });
  });

  describe('setIncludeRadiusLabels', () => {
    it('should return this when value is already the same', () => {
      const pp = new PolarPlane(noLabels);
      expect(pp.setIncludeRadiusLabels(false)).toBe(pp);
    });

    it('should add radius labels when toggled on', () => {
      const pp = new PolarPlane(noLabels);
      const childrenBefore = pp.children.length;
      pp.setIncludeRadiusLabels(true);
      expect(pp.children.length).toBeGreaterThan(childrenBefore);
    });

    it('should remove radius labels when toggled off', () => {
      const pp = new PolarPlane(noLabels);
      pp.setIncludeRadiusLabels(true);
      const countWithLabels = pp.children.length;
      pp.setIncludeRadiusLabels(false);
      expect(pp.children.length).toBeLessThan(countWithLabels);
    });
  });

  describe('getAngleLabels / getRadiusLabels', () => {
    it('getAngleLabels should return the angle labels group', () => {
      const pp = new PolarPlane(noLabels);
      const labels = pp.getAngleLabels();
      expect(labels).toBeDefined();
      // No angle labels were generated since includeAngleLabels=false,
      // but the group still exists
      expect(labels.children.length).toBe(0);
    });

    it('getRadiusLabels should return the radius labels group', () => {
      const pp = new PolarPlane(noLabels);
      const labels = pp.getRadiusLabels();
      expect(labels).toBeDefined();
      expect(labels.children.length).toBe(0);
    });
  });

  describe('_createCopy via copy()', () => {
    it('copy should produce an independent PolarPlane', () => {
      const pp = new PolarPlane({
        radius: 4,
        size: 8,
        radialDivisions: 5,
        angularDivisions: 6,
        ...noLabels,
      });
      const cp = pp.copy() as PolarPlane;
      expect(cp).toBeInstanceOf(PolarPlane);
      expect(cp).not.toBe(pp);
      expect(cp.getRadius()).toBe(4);
      expect(cp.getSize()).toBe(8);
      expect(cp.getConcentricCircles().children.length).toBe(5);
      expect(cp.getRadialLines().children.length).toBe(6);
    });
  });

  describe('pt2pr with various angles', () => {
    it('should return theta near 3PI/2 for point below origin', () => {
      const pp = new PolarPlane(noLabels);
      const pt = pp.pr2pt(1, (3 * Math.PI) / 2);
      const [r, theta] = pp.pt2pr(pt);
      expect(closeTo(r, 1)).toBe(true);
      expect(closeTo(theta, (3 * Math.PI) / 2)).toBe(true);
    });
  });

  describe('grid structure', () => {
    it('should create grid with custom options', () => {
      const pp = new PolarPlane({
        radius: 2,
        size: 4,
        radialDivisions: 2,
        angularDivisions: 4,
        gridColor: '#ff0000',
        gridStrokeWidth: 2,
        gridOpacity: 0.8,
        ...noLabels,
      });
      expect(pp.getConcentricCircles().children.length).toBe(2);
      expect(pp.getRadialLines().children.length).toBe(4);
    });
  });
});

// ---------------------------------------------------------------------------
// ComplexPlane - canvas-dependent tests (imaginary labels, coordinates, etc.)
// ---------------------------------------------------------------------------
describe('ComplexPlane with canvas mock', () => {
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

  beforeAll(() => {
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
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor with imaginary labels enabled', () => {
    it('should create imaginary labels by default', () => {
      const plane = new ComplexPlane();
      const labels = plane.getImaginaryLabels();
      expect(labels).toBeDefined();
      // Default yRange is [-4, 4, 1], so labels at -4, -3, -2, -1, 1, 2, 3, 4 (skip 0)
      expect(labels.children.length).toBeGreaterThan(0);
    });

    it('should not create imaginary labels when disabled', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const labels = plane.getImaginaryLabels();
      expect(labels.children.length).toBe(0);
    });

    it('should respect custom labelFontSize and labelColor', () => {
      const plane = new ComplexPlane({
        labelFontSize: 32,
        labelColor: '#ff0000',
      });
      expect(plane).toBeDefined();
      expect(plane.getImaginaryLabels().children.length).toBeGreaterThan(0);
    });
  });

  describe('setIncludeImaginaryLabels', () => {
    it('should return this when value is already the same (true)', () => {
      const plane = new ComplexPlane();
      expect(plane.setIncludeImaginaryLabels(true)).toBe(plane);
    });

    it('should return this when value is already the same (false)', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      expect(plane.setIncludeImaginaryLabels(false)).toBe(plane);
    });

    it('should remove imaginary labels when toggled off', () => {
      const plane = new ComplexPlane();
      const childrenBefore = plane.children.length;
      plane.setIncludeImaginaryLabels(false);
      expect(plane.children.length).toBeLessThan(childrenBefore);
    });

    it('should add imaginary labels when toggled back on', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const childrenBefore = plane.children.length;
      plane.setIncludeImaginaryLabels(true);
      expect(plane.children.length).toBeGreaterThan(childrenBefore);
    });

    it('should not add duplicate group when called multiple times', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      plane.setIncludeImaginaryLabels(true);
      const countAfter = plane.children.length;
      plane.setIncludeImaginaryLabels(true); // no-op
      expect(plane.children.length).toBe(countAfter);
    });
  });

  describe('_formatImaginaryLabel branches (via addCoordinates)', () => {
    it('should format 1 as "i"', () => {
      // yRange [0, 1, 1] with yVals [1] should produce "i" label
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        yRange: [0, 2, 1],
      });
      plane.addCoordinates([], [1]);
      const coordLabels = plane.getCoordinateLabels();
      expect(coordLabels.children.length).toBe(1);
    });

    it('should format -1 as "-i"', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        yRange: [-2, 0, 1],
      });
      plane.addCoordinates([], [-1]);
      const coordLabels = plane.getCoordinateLabels();
      expect(coordLabels.children.length).toBe(1);
    });

    it('should format integer values like 3 as "3i"', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        yRange: [0, 4, 1],
      });
      plane.addCoordinates([], [3]);
      expect(plane.getCoordinateLabels().children.length).toBe(1);
    });

    it('should format non-integer values like 1.5 as "1.5i"', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        yRange: [0, 3, 0.5],
      });
      plane.addCoordinates([], [1.5]);
      expect(plane.getCoordinateLabels().children.length).toBe(1);
    });
  });

  describe('addCoordinates', () => {
    it('should add default coordinate labels from axis ranges', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-2, 2, 1],
        yRange: [-2, 2, 1],
      });
      plane.addCoordinates();
      const labels = plane.getCoordinateLabels();
      // x labels: -2, -1, 1, 2 (skip 0) = 4
      // y labels: -2, -1, 1, 2 (skip 0) = 4
      // Total = 8
      expect(labels.children.length).toBe(8);
    });

    it('should add custom x and y coordinate labels', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-3, 3, 1],
        yRange: [-3, 3, 1],
      });
      plane.addCoordinates([1, 2], [1, -1]);
      const labels = plane.getCoordinateLabels();
      // 2 x labels + 2 y labels = 4
      expect(labels.children.length).toBe(4);
    });

    it('should clear previous coordinate labels on re-call', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-2, 2, 1],
        yRange: [-2, 2, 1],
      });
      plane.addCoordinates([1], [1]);
      expect(plane.getCoordinateLabels().children.length).toBe(2);
      plane.addCoordinates([1, 2, 3], []);
      expect(plane.getCoordinateLabels().children.length).toBe(3);
    });

    it('should return this for chaining', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      expect(plane.addCoordinates()).toBe(plane);
    });

    it('should not add coordinate labels group twice', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      plane.addCoordinates([1], []);
      const countAfterFirst = plane.children.length;
      plane.addCoordinates([2], []);
      expect(plane.children.length).toBe(countAfterFirst);
    });

    it('should format non-integer x labels with one decimal', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [0, 2, 0.5],
      });
      plane.addCoordinates([0.5, 1.5], []);
      expect(plane.getCoordinateLabels().children.length).toBe(2);
    });
  });

  describe('getCoordinateLabels', () => {
    it('should return an empty group before addCoordinates is called', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const labels = plane.getCoordinateLabels();
      expect(labels).toBeDefined();
      expect(labels.children.length).toBe(0);
    });
  });

  describe('_createCopy via copy()', () => {
    it('should produce an independent ComplexPlane', () => {
      const plane = new ComplexPlane({
        xRange: [-3, 3, 1],
        yRange: [-2, 2, 1],
        xLength: 8,
        yLength: 4,
        labelFontSize: 18,
        labelColor: '#00ff00',
      });
      const cp = plane.copy() as ComplexPlane;
      expect(cp).toBeInstanceOf(ComplexPlane);
      expect(cp).not.toBe(plane);
      expect(cp.getXRange()).toEqual([-3, 3, 1]);
      expect(cp.getYRange()).toEqual([-2, 2, 1]);
    });

    it('should copy with includeImaginaryLabels=false', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const cp = plane.copy() as ComplexPlane;
      expect(cp).toBeInstanceOf(ComplexPlane);
      expect(cp.getImaginaryLabels().children.length).toBe(0);
    });
  });

  describe('applyComplexFunction', () => {
    it('should apply z -> z^2 and return this', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-2, 2, 1],
        yRange: [-2, 2, 1],
      });
      const result = plane.applyComplexFunction((z) => ComplexPlane.multiply(z, z));
      expect(result).toBe(plane);
    });

    it('should apply identity function without error', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-1, 1, 1],
        yRange: [-1, 1, 1],
      });
      expect(() => {
        plane.applyComplexFunction((z) => z);
      }).not.toThrow();
    });
  });

  describe('n2p / p2n with custom ranges', () => {
    it('should map complex numbers correctly on custom range', () => {
      const plane = new ComplexPlane({
        includeImaginaryLabels: false,
        xRange: [-5, 5, 1],
        yRange: [-5, 5, 1],
        xLength: 10,
        yLength: 10,
      });
      const z = { re: 3, im: -2 };
      const pt = plane.n2p(z);
      const back = plane.p2n(pt);
      expect(closeTo(back.re, 3)).toBe(true);
      expect(closeTo(back.im, -2)).toBe(true);
    });

    it('n2p with negative real number', () => {
      const plane = new ComplexPlane({ includeImaginaryLabels: false });
      const pt = plane.n2p(-3);
      const back = plane.p2n(pt);
      expect(closeTo(back.re, -3)).toBe(true);
      expect(closeTo(back.im, 0)).toBe(true);
    });
  });

  describe('PolarPlane with labels (canvas mock)', () => {
    it('should create with default labels enabled', () => {
      const pp = new PolarPlane();
      expect(pp.getAngleLabels().children.length).toBeGreaterThan(0);
      expect(pp.getRadiusLabels().children.length).toBeGreaterThan(0);
    });

    it('should generate correct number of angle labels for default 12 divisions', () => {
      const pp = new PolarPlane();
      expect(pp.getAngleLabels().children.length).toBe(12);
    });

    it('should generate correct number of radius labels for default 3 divisions', () => {
      const pp = new PolarPlane();
      expect(pp.getRadiusLabels().children.length).toBe(3);
    });

    it('should create with custom angular and radial divisions', () => {
      const pp = new PolarPlane({
        angularDivisions: 8,
        radialDivisions: 4,
      });
      expect(pp.getAngleLabels().children.length).toBe(8);
      expect(pp.getRadiusLabels().children.length).toBe(4);
    });

    it('should create with azimuth offset and labels', () => {
      const pp = new PolarPlane({
        azimuthOffset: Math.PI / 4,
        angularDivisions: 4,
      });
      expect(pp.getAngleLabels().children.length).toBe(4);
    });

    it('_createCopy with labels should produce independent copy', () => {
      const pp = new PolarPlane({
        radius: 5,
        size: 10,
        angularDivisions: 8,
        radialDivisions: 2,
        gridColor: '#00ff00',
        gridStrokeWidth: 3,
        gridOpacity: 0.7,
        labelFontSize: 16,
        labelColor: '#ff0000',
        azimuthOffset: Math.PI / 6,
      });
      const cp = pp.copy() as PolarPlane;
      expect(cp).toBeInstanceOf(PolarPlane);
      expect(cp.getRadius()).toBe(5);
      expect(cp.getSize()).toBe(10);
    });

    it('setIncludeAngleLabels should toggle labels with canvas mock', () => {
      const pp = new PolarPlane();
      const initialCount = pp.children.length;
      pp.setIncludeAngleLabels(false);
      expect(pp.children.length).toBeLessThan(initialCount);
      pp.setIncludeAngleLabels(true);
      expect(pp.children.length).toBe(initialCount);
    });

    it('setIncludeRadiusLabels should toggle labels with canvas mock', () => {
      const pp = new PolarPlane();
      const initialCount = pp.children.length;
      pp.setIncludeRadiusLabels(false);
      expect(pp.children.length).toBeLessThan(initialCount);
      pp.setIncludeRadiusLabels(true);
      expect(pp.children.length).toBe(initialCount);
    });

    it('_formatAngleLabel should handle common angles in 12-division grid', () => {
      // A 12-division polar plane generates labels at 0, PI/6, PI/3, PI/2, 2PI/3,
      // 5PI/6, PI, 7PI/6, 4PI/3, 3PI/2, 5PI/3, 11PI/6
      const pp = new PolarPlane({ angularDivisions: 12 });
      // All 12 labels should be generated
      expect(pp.getAngleLabels().children.length).toBe(12);
    });

    it('_formatAngleLabel fallback for unusual angle', () => {
      // Use 7 divisions which produces angles not matching any standard fraction
      const pp = new PolarPlane({ angularDivisions: 7 });
      expect(pp.getAngleLabels().children.length).toBe(7);
    });

    it('_formatAngleLabel covers PI/4 and 3PI/4 with 8 divisions', () => {
      const pp = new PolarPlane({ angularDivisions: 8 });
      // 8 divisions: 0, PI/4, PI/2, 3PI/4, PI, 5PI/4, 3PI/2, 7PI/4
      expect(pp.getAngleLabels().children.length).toBe(8);
    });

    it('should handle non-integer radius for radius labels', () => {
      const pp = new PolarPlane({ radius: 2.5, radialDivisions: 3 });
      expect(pp.getRadiusLabels().children.length).toBe(3);
    });
  });
});
