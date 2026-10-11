import { describe, it, expect } from 'vitest';
import {
  angleAxisFromQuaternion,
  angleBetweenVectors,
  angleOfVector,
  cartesianToSpherical,
  centerOfMass,
  complexFuncToR3Func,
  complexToR3,
  cross,
  cross2d,
  findIntersection,
  getUnitNormal,
  lineIntersection,
  midpoint,
  normalize,
  normSquared,
  perpendicularBisector,
  quaternionConjugate,
  quaternionFromAngleAxis,
  quaternionMult,
  r3ToComplex,
  regularVertices,
  rotateVector,
  rotationAboutZ,
  rotationMatrix,
  rotationMatrixTranspose,
  shoelace,
  shoelaceDirection,
  sphericalToCartesian,
  zToVector,
  compassDirections,
  thickDiagonal,
  getWindingNumber,
  earclipTriangulation,
} from './spaceOps';

const close = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;
const expectVec = (got: number[], want: number[], eps = 1e-9): void => {
  expect(got.length).toBe(want.length);
  got.forEach((v, i) => expect(close(v, want[i], eps)).toBe(true));
};

describe('normalize', () => {
  it('returns a unit-length vector preserving direction', () => {
    const n = normalize([3, 4, 0]);
    expectVec(n, [0.6, 0.8, 0]);
    expect(close(Math.sqrt(normSquared(n)), 1)).toBe(true);
  });

  it('returns a zero vector of the same length for a zero input', () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('returns the fallback for a zero input when supplied', () => {
    expect(normalize([0, 0, 0], [1, 0, 0])).toEqual([1, 0, 0]);
  });
});

describe('rotateVector', () => {
  it('rotates RIGHT by PI/2 about OUT to UP', () => {
    expectVec(rotateVector([1, 0, 0], Math.PI / 2), [0, 1, 0]);
  });

  it('promotes a 2D vector to 3D', () => {
    expectVec(rotateVector([1, 0], Math.PI / 2), [0, 1, 0]);
  });

  it('throws for a 4D vector', () => {
    expect(() => rotateVector([1, 0, 0, 0], 1)).toThrow();
  });
});

describe('rotationMatrix', () => {
  it('is orthogonal (R R^T = I)', () => {
    const r = rotationMatrix(0.7, [1, 2, 3]);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const dot = r[i][0] * r[j][0] + r[i][1] * r[j][1] + r[i][2] * r[j][2];
        expect(close(dot, i === j ? 1 : 0)).toBe(true);
      }
    }
  });

  it('matches rotationAboutZ for the z-axis', () => {
    const a = rotationMatrix(0.5, [0, 0, 1]);
    const b = rotationAboutZ(0.5);
    a.forEach((row, i) => expectVec(row, b[i]));
  });

  it('returns a 4x4 homogeneous matrix when requested', () => {
    const r = rotationMatrix(0.5, [0, 0, 1], true);
    expect(r.length).toBe(4);
    expectVec(r[3], [0, 0, 0, 1]);
  });
});

describe('rotationMatrixTranspose', () => {
  it('equals the transpose of rotationMatrix off the z-axis', () => {
    const t = rotationMatrixTranspose(0.5, [1, 1, 0]);
    const r = rotationMatrix(0.5, [1, 1, 0]);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) expect(close(t[i][j], r[j][i])).toBe(true);
    }
  });
});

describe('angleOfVector', () => {
  it('returns the polar angle in the xy-plane', () => {
    expect(close(angleOfVector([1, 0, 0]), 0)).toBe(true);
    expect(close(angleOfVector([0, 1, 0]), Math.PI / 2)).toBe(true);
    expect(close(angleOfVector([-1, 0, 0]), Math.PI)).toBe(true);
  });
});

describe('angleBetweenVectors', () => {
  it('is PI/2 for perpendicular vectors', () => {
    expect(close(angleBetweenVectors([1, 0, 0], [0, 1, 0]), Math.PI / 2)).toBe(true);
  });

  it('is PI for opposite vectors', () => {
    expect(close(angleBetweenVectors([1, 0, 0], [-1, 0, 0]), Math.PI)).toBe(true);
  });
});

describe('cross and cross2d', () => {
  it('computes the 3D cross product', () => {
    expectVec(cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
  });

  it('computes the 2D determinant', () => {
    expect(cross2d([1, 2], [3, 4])).toBe(-2);
  });
});

describe('getUnitNormal', () => {
  it('returns the unit normal of two basis vectors', () => {
    expectVec(getUnitNormal([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
  });
});

describe('zToVector', () => {
  it('maps the z-axis to the given direction', () => {
    const m = zToVector([1, 0, 0]);
    const col = [m[0][2], m[1][2], m[2][2]];
    expectVec(col, [1, 0, 0]);
  });
});

describe('complex helpers', () => {
  it('round-trips complex <-> R3', () => {
    expectVec(complexToR3({ re: 2, im: 3 }), [2, 3, 0]);
    expect(r3ToComplex([2, 3, 0])).toEqual({ re: 2, im: 3 });
  });

  it('lifts a complex function to a point function', () => {
    const square = complexFuncToR3Func(({ re, im }) => ({
      re: re * re - im * im,
      im: 2 * re * im,
    }));
    expectVec(square([0, 1, 0]), [-1, 0, 0]);
  });
});

describe('centerOfMass and midpoint', () => {
  it('averages points', () => {
    expectVec(
      centerOfMass([
        [0, 0, 0],
        [2, 2, 2],
      ]),
      [1, 1, 1],
    );
    expectVec(midpoint([0, 0, 0], [4, 2, 0]), [2, 1, 0]);
  });
});

describe('lineIntersection', () => {
  it('finds a known crossing', () => {
    const p = lineIntersection(
      [
        [-1, 0, 0],
        [1, 0, 0],
      ],
      [
        [0, -1, 0],
        [0, 1, 0],
      ],
    );
    expectVec(p, [0, 0, 0]);
  });

  it('throws on parallel lines', () => {
    expect(() =>
      lineIntersection(
        [
          [0, 0, 0],
          [1, 0, 0],
        ],
        [
          [0, 1, 0],
          [1, 1, 0],
        ],
      ),
    ).toThrow();
  });

  it('throws for points off the xy-plane', () => {
    expect(() =>
      lineIntersection(
        [
          [0, 0, 1],
          [1, 0, 0],
        ],
        [
          [0, -1, 0],
          [0, 1, 0],
        ],
      ),
    ).toThrow();
  });
});

describe('findIntersection', () => {
  it('intersects two coplanar rays', () => {
    const res = findIntersection([[-1, 0, 0]], [[1, 0, 0]], [[0, -1, 0]], [[0, 1, 0]]);
    expectVec(res[0], [0, 0, 0]);
  });
});

describe('quaternions', () => {
  it('multiplies with identity', () => {
    expect(quaternionMult()).toEqual([1, 0, 0, 0]);
    expectVec(quaternionMult([1, 0, 0, 0], [0, 1, 0, 0]), [0, 1, 0, 0]);
  });

  it('conjugates', () => {
    expect(quaternionConjugate([1, 2, 3, 4])).toEqual([1, -2, -3, -4]);
  });

  it('round-trips angle/axis <-> quaternion', () => {
    const angle = 1.1;
    const axis = normalize([1, 2, 3]);
    const q = quaternionFromAngleAxis(angle, axis);
    const [gotAngle, gotAxis] = angleAxisFromQuaternion(q);
    expect(close(gotAngle, angle, 1e-9)).toBe(true);
    expectVec(gotAxis, axis, 1e-9);
  });
});

describe('spherical coordinates', () => {
  it('round-trips cartesian <-> spherical', () => {
    const vec = [1, 2, 3];
    const sph = cartesianToSpherical(vec);
    expectVec(sphericalToCartesian(sph), vec, 1e-9);
  });

  it('returns zeros for the origin', () => {
    expect(cartesianToSpherical([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('shoelace', () => {
  it('reports CW for a clockwise unit square path', () => {
    const square = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ];
    expect(shoelace(square)).toBeGreaterThan(0);
    expect(shoelaceDirection(square)).toBe('CW');
  });
});

describe('regularVertices', () => {
  it('places n vertices on a circle of the given radius', () => {
    const [vertices, startAngle] = regularVertices(4, { radius: 2 });
    expect(vertices.length).toBe(4);
    expect(startAngle).toBe(0);
    expectVec(vertices[0], [2, 0, 0]);
    vertices.forEach((v) => expect(close(Math.sqrt(normSquared(v)), 2)).toBe(true));
  });
});

describe('perpendicularBisector', () => {
  it('bisects a horizontal segment with a vertical line through its midpoint', () => {
    const [a, b] = perpendicularBisector([
      [-1, 0, 0],
      [1, 0, 0],
    ]);
    expect(close(a[0], 0)).toBe(true);
    expect(close(b[0], 0)).toBe(true);
    expect(close((a[1] + b[1]) / 2, 0)).toBe(true);
  });
});

describe('compassDirections', () => {
  it('returns n unit directions starting at RIGHT by default', () => {
    const dirs = compassDirections(4);
    expect(dirs.length).toBe(4);
    expectVec(dirs[0], [1, 0, 0]);
    expectVec(dirs[1], [0, 1, 0]);
    expectVec(dirs[2], [-1, 0, 0]);
    expectVec(dirs[3], [0, -1, 0]);
  });

  it('honours a custom start vector', () => {
    const dirs = compassDirections(2, [0, 1, 0]);
    expectVec(dirs[0], [0, 1, 0]);
    expectVec(dirs[1], [0, -1, 0]);
  });
});

describe('thickDiagonal', () => {
  it('marks the band of width `thickness` around the diagonal', () => {
    expect(thickDiagonal(3)).toEqual([
      [1, 1, 0],
      [1, 1, 1],
      [0, 1, 1],
    ]);
  });

  it('with thickness 1 is the identity pattern', () => {
    expect(thickDiagonal(3, 1)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
});

describe('getWindingNumber', () => {
  it('is 1 for a CCW unit square around the origin', () => {
    const square = [
      [1, 1, 0],
      [-1, 1, 0],
      [-1, -1, 0],
      [1, -1, 0],
    ];
    expect(close(getWindingNumber(square), 1, 1e-9)).toBe(true);
  });

  it('is 0 for a polygon that does not enclose the origin', () => {
    const square = [
      [1, 1, 0],
      [3, 1, 0],
      [3, 3, 0],
      [1, 3, 0],
    ];
    expect(close(getWindingNumber(square), 0, 1e-9)).toBe(true);
  });
});

describe('earclipTriangulation', () => {
  it('triangulates a square into two triangles (6 indices)', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const indices = earclipTriangulation(square);
    expect(indices.length).toBe(6);
    expect(indices.every((i) => i >= 0 && i < 4)).toBe(true);
  });
});
