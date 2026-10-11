import { describe, it, expect } from 'vitest';
import { Surface, Surface3D, CurvesAsSubmobjects, earclipTriangulation } from './index';
import { triangulatePolygon } from './utils/triangulate';

describe('ManimCE parity residual public exports', () => {
  it('exposes Surface as an alias of Surface3D', () => {
    expect(Surface).toBe(Surface3D);
  });

  it('exposes CurvesAsSubmobjects', () => {
    expect(typeof CurvesAsSubmobjects).toBe('function');
  });

  it('exposes earclipTriangulation as triangulatePolygon', () => {
    expect(earclipTriangulation).toBe(triangulatePolygon);
  });
});
