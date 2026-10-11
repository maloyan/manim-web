import { describe, it, expect } from 'vitest';
import {
  clockwisePath,
  counterclockwisePath,
  pathAlongArc,
  pathAlongCircles,
  straightPath,
} from './paths';

const close = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;
const expectVec = (got: number[], want: number[], eps = 1e-9): void => {
  got.forEach((v, i) => expect(close(v, want[i], eps)).toBe(true));
};

const START = [[1, 0, 0]];
const END = [[-1, 0, 0]];

describe('straightPath', () => {
  it('interpolates linearly between the point sets', () => {
    const path = straightPath();
    expectVec(path(START, END, 0)[0], [1, 0, 0]);
    expectVec(path(START, END, 0.5)[0], [0, 0, 0]);
    expectVec(path(START, END, 1)[0], [-1, 0, 0]);
  });
});

describe('pathAlongArc', () => {
  it('returns the start and end points at the boundaries', () => {
    const path = pathAlongArc(Math.PI);
    expectVec(path(START, END, 0)[0], [1, 0, 0]);
    expectVec(path(START, END, 1)[0], [-1, 0, 0]);
  });

  it('falls back to a straight path for a tiny arc', () => {
    const path = pathAlongArc(1e-6);
    expectVec(path(START, END, 0.5)[0], [0, 0, 0]);
  });
});

describe('counterclockwisePath', () => {
  it('bulges toward +y at the midpoint', () => {
    const mid = counterclockwisePath()(START, END, 0.5)[0];
    expectVec(mid, [0, 1, 0]);
  });
});

describe('clockwisePath', () => {
  it('bulges toward -y at the midpoint', () => {
    const mid = clockwisePath()(START, END, 0.5)[0];
    expectVec(mid, [0, -1, 0]);
  });
});

describe('pathAlongCircles', () => {
  it('returns the start and end points at the boundaries', () => {
    const path = pathAlongCircles(Math.PI, [[0, 0, 0]]);
    expectVec(path(START, END, 0)[0], [1, 0, 0]);
    expectVec(path(START, END, 1)[0], [-1, 0, 0]);
  });
});
