import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VMobject } from './VMobject';
import { Circle } from '../mobjects/geometry/Circle';
import { Square } from '../mobjects/geometry/Rectangle';
import { GradientVMobject } from '../mobjects/svg/svgGradients';

/** Linear working-space RGB of a CSS color, as the renderer stores it. */
function rgbOf(color: string): [number, number, number] {
  const c = new THREE.Color(color);
  return [c.r, c.g, c.b];
}

/** The fill mesh of a mobject after a sync. */
function fillMeshOf(mob: VMobject): THREE.Mesh {
  const group = mob.getThreeObject() as THREE.Group;
  // The stroke Line2 is also a Mesh, so match the fill by its material type.
  const mesh = group.children.find(
    (c) => c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial,
  );
  if (!mesh) throw new Error('no fill mesh');
  return mesh as THREE.Mesh;
}

/** Color of the vertex that is closest to (x, y). */
function colorNear(mesh: THREE.Mesh, x: number, y: number): [number, number, number] {
  const pos = mesh.geometry.getAttribute('position');
  const col = mesh.geometry.getAttribute('color');
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const d = Math.hypot(pos.getX(i) - x, pos.getY(i) - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return [col.getX(best), col.getY(best), col.getZ(best)];
}

function expectClose(a: number[], b: number[], eps = 0.03): void {
  for (let i = 0; i < 3; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(eps);
}

const RED_BLUE = [
  { offset: 0, color: '#ff0000' },
  { offset: 1, color: '#0000ff' },
];

describe('VMobject fill gradient', () => {
  it('linear: axis min maps to first stop, max to last, middle is blended', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    sq.setFillGradient({ type: 'linear', angle: 0, stops: RED_BLUE });
    const mesh = fillMeshOf(sq);
    expect(mesh.geometry.getAttribute('color')).toBeDefined();
    expectClose(colorNear(mesh, -1, 0), rgbOf('#ff0000'));
    expectClose(colorNear(mesh, 1, 0), rgbOf('#0000ff'));
    // The renderer blends in sRGB space, so the middle is #800080 (linearized).
    expectClose(colorNear(mesh, 0, 0), rgbOf('#800080'), 0.04);
  });

  it('linear: angle 90 degrees runs bottom to top', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    sq.setFillGradient({
      type: 'linear',
      angle: Math.PI / 2,
      stops: [
        { offset: 0, color: '#00ff00' },
        { offset: 1, color: '#ffffff' },
      ],
    });
    const mesh = fillMeshOf(sq);
    expectClose(colorNear(mesh, 0, -1), rgbOf('#00ff00'));
    expectClose(colorNear(mesh, 0, 1), rgbOf('#ffffff'));
  });

  it('radial: center is first stop, rim is last stop', () => {
    const c = new Circle({ radius: 1, fillOpacity: 1 });
    c.setFillGradient({
      type: 'radial',
      stops: [
        { offset: 0, color: '#ffff00' },
        { offset: 1, color: '#800000' },
      ],
    });
    const mesh = fillMeshOf(c);
    expectClose(colorNear(mesh, 0, 0), rgbOf('#ffff00'));
    expectClose(colorNear(mesh, 1, 0), rgbOf('#800000'));
    // The interior must be resolved, not only the boundary vertices.
    const quarter = colorNear(mesh, 0.5, 0);
    expect(quarter[1]).toBeGreaterThan(0.05);
    expect(quarter[0]).toBeGreaterThan(rgbOf('#800000')[0] + 0.05);
  });

  it('three stops hit the middle stop at its offset', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    sq.setFillGradient({
      type: 'linear',
      stops: [
        { offset: 0, color: '#ff0000' },
        { offset: 0.5, color: '#00ff00' },
        { offset: 1, color: '#0000ff' },
      ],
    });
    const mesh = fillMeshOf(sq);
    expectClose(colorNear(mesh, 0, 0), rgbOf('#00ff00'), 0.06);
  });

  it('no gradient gives a flat fill without vertex colors', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    const mesh = fillMeshOf(sq);
    expect(mesh.geometry.getAttribute('color')).toBeUndefined();
    expect((mesh.material as THREE.MeshBasicMaterial).vertexColors).toBe(false);
    expect(mesh.geometry.getAttribute('position').count).toBeGreaterThanOrEqual(6);
  });

  it('gradient material uses vertex colors and keeps fill opacity', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 0.4 });
    sq.setFillGradient({ type: 'linear', stops: RED_BLUE });
    const mat = fillMeshOf(sq).material as THREE.MeshBasicMaterial;
    expect(mat.vertexColors).toBe(true);
    expect(mat.opacity).toBeCloseTo(0.4, 5);
  });

  it('copy keeps the gradient spec', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    sq.setFillGradient({ type: 'radial', stops: RED_BLUE });
    const clone = sq.copy();
    expect(clone.getFillGradient()).toEqual(sq.getFillGradient());
    expect(clone.getFillGradient()).not.toBe(sq.getFillGradient());
    expect(fillMeshOf(clone).geometry.getAttribute('color')).toBeDefined();
  });

  it('clearing the gradient restores a flat fill', () => {
    const sq = new Square({ sideLength: 2, fillOpacity: 1 });
    sq.setFillGradient({ type: 'linear', stops: RED_BLUE });
    fillMeshOf(sq);
    sq.setFillGradient(null);
    expect(sq.getFillGradient()).toBeNull();
    const mesh = fillMeshOf(sq);
    expect(mesh.geometry.getAttribute('color')).toBeUndefined();
    expect((mesh.material as THREE.MeshBasicMaterial).vertexColors).toBe(false);
  });

  it('rejects an empty stop list', () => {
    const sq = new Square({ sideLength: 2 });
    expect(() => sq.setFillGradient({ type: 'linear', stops: [] })).toThrow();
  });

  it('GradientVMobject renders its stops', () => {
    const g = new GradientVMobject({
      gradient: {
        id: 'g',
        type: 'linear',
        stops: [
          { offset: 0, color: '#ff0000', opacity: 1 },
          { offset: 1, color: '#0000ff', opacity: 1 },
        ],
      },
      points3D: new Square({ sideLength: 2 })
        .getPoints()
        .map((p): [number, number, number] => [p[0], p[1], p[2] ?? 0]),
      fillOpacity: 1,
    });
    expect(g.getFillGradient()?.stops).toHaveLength(2);
    expect(fillMeshOf(g).geometry.getAttribute('color')).toBeDefined();
  });
});
