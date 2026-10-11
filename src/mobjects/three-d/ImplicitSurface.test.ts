import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { ImplicitSurface } from './ImplicitSurface';

const sphere = (x: number, y: number, z: number): number => x * x + y * y + z * z;

function makeSphereSurface(
  extra: Partial<ConstructorParameters<typeof ImplicitSurface>[0]> = {},
): ImplicitSurface {
  return new ImplicitSurface({
    func: sphere,
    xRange: [-2, 2],
    yRange: [-2, 2],
    zRange: [-2, 2],
    resolution: 24,
    isoLevel: 1,
    ...extra,
  });
}

describe('ImplicitSurface', () => {
  it('constructs headless and exposes a non-empty mesh', () => {
    expect(() => {
      const surface = makeSphereSurface();
      surface.getThreeObject();
    }).not.toThrow();

    const surface = makeSphereSurface();
    expect(surface.getTriangleCount()).toBeGreaterThan(0);
    expect(surface.getPositions().length).toBe(surface.getTriangleCount() * 9);
  });

  it('builds a Three.js mesh with position and normal attributes', () => {
    const surface = makeSphereSurface();
    const mesh = surface.getThreeObject() as THREE.Mesh;
    expect(mesh.isMesh).toBe(true);
    expect(mesh.geometry.getAttribute('position')).toBeDefined();
    expect(mesh.geometry.getAttribute('normal')).toBeDefined();
  });

  it('places surface vertices on the sphere radius within tolerance', () => {
    const surface = makeSphereSurface({ resolution: 40 });
    const p = surface.getPositions();
    for (let i = 0; i < p.length; i += 3) {
      const r = Math.hypot(p[i], p[i + 1], p[i + 2]);
      expect(Math.abs(r - 1)).toBeLessThan(0.15);
    }
  });

  it('produces identical geometry on repeated construction', () => {
    const a = makeSphereSurface({ resolution: 16 });
    const b = makeSphereSurface({ resolution: 16 });
    expect(Array.from(a.getPositions())).toEqual(Array.from(b.getPositions()));
  });

  it('adds a depth-prepass child mesh only when translucent', () => {
    const hasPrepass = (surface: ImplicitSurface): boolean => {
      const mesh = surface.getThreeObject() as THREE.Mesh;
      const prepass = mesh.children.find(
        (c) =>
          (c as THREE.Mesh).isMesh &&
          ((c as THREE.Mesh).material as THREE.Material).userData.depthPrepass,
      ) as THREE.Mesh | undefined;
      if (!prepass) return false;
      const material = prepass.material as THREE.Material;
      return material.visible && material.depthWrite;
    };

    expect(hasPrepass(makeSphereSurface({ opacity: 0.5 }))).toBe(true);
    // Opaque surfaces write depth in the opaque pass, so the prepass is off.
    expect(hasPrepass(makeSphereSurface({ opacity: 1 }))).toBe(false);
  });

  it('rebuilds the mesh when the iso level changes', () => {
    const surface = makeSphereSurface({ resolution: 24, isoLevel: 1 });
    const before = surface.getTriangleCount();
    surface.setIsoLevel(2);
    // A larger iso radius sweeps more cells, so the triangle count changes.
    expect(surface.getTriangleCount()).not.toBe(before);
  });

  it('copies into an independent instance', () => {
    const surface = makeSphereSurface();
    const copy = surface.copy();
    expect(copy).toBeInstanceOf(ImplicitSurface);
    expect(copy.getTriangleCount()).toBe(surface.getTriangleCount());
  });
});
