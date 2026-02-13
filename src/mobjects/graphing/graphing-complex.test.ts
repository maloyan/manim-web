import { describe, it, expect } from 'vitest';
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
});
