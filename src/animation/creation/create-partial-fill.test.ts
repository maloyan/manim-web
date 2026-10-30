// @vitest-environment happy-dom
/**
 * Create() grows a filled shape's fill along with its stroke, like Manim CE's
 * Create (pointwise_become_partial), instead of drawing the border and then
 * fading in the fill.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { Square } from '../../mobjects/geometry/Rectangle';
import { curveProportionFromArcLength } from '../../core/VMobjectCurveMath';
import { Create } from './Create';

/** Fill meshes (Line2 is a Mesh subclass, so exclude strokes). */
function fillMeshes(mob: { getThreeObject(): THREE.Object3D }): THREE.Mesh[] {
  const found: THREE.Mesh[] = [];
  mob.getThreeObject().traverse((child) => {
    if (child instanceof THREE.Mesh && !(child instanceof Line2)) found.push(child);
  });
  return found;
}

/** Total triangle area of the visible fill meshes (non-indexed triangles). */
function visibleFillArea(mob: { getThreeObject(): THREE.Object3D }): number {
  let area = 0;
  for (const mesh of fillMeshes(mob)) {
    if (!mesh.visible) continue;
    const pos = mesh.geometry.getAttribute('position');
    const idx = mesh.geometry.getIndex();
    const count = idx ? idx.count : pos.count;
    const at = (i: number) => (idx ? idx.getX(i) : i);
    for (let i = 0; i + 2 < count; i += 3) {
      const a = at(i);
      const b = at(i + 1);
      const c = at(i + 2);
      const abx = pos.getX(b) - pos.getX(a);
      const aby = pos.getY(b) - pos.getY(a);
      const acx = pos.getX(c) - pos.getX(a);
      const acy = pos.getY(c) - pos.getY(a);
      area += Math.abs(abx * acy - aby * acx) / 2;
    }
  }
  return area;
}

describe('Create partial fill', () => {
  // MIGRATION: example for the property
  //   ∀ single-outline filled VMobject m, ∀ alpha ∈ [0, 1]:
  //   during Create(m), fill area at alpha equals the area enclosed by the
  //   first alpha (by arc length) of m's path closed back to its start, and
  //   m.fillOpacity is never changed.
  // Replace with a property test once the suite lands.
  it('grows the fill with the stroke on a filled square', () => {
    const square = new Square({ sideLength: 2, fillOpacity: 1 });
    const anim = new Create(square);
    anim.begin();

    anim.interpolate(0);
    expect(visibleFillArea(square)).toBeCloseTo(0, 6);

    // Half the perimeter covers two sides: the closed region is half the square.
    anim.interpolate(0.5);
    expect(square.fillOpacity).toBe(1);
    expect(visibleFillArea(square)).toBeCloseTo(2, 2);

    anim.finish();
    expect(visibleFillArea(square)).toBeCloseTo(4, 2);
  });

  it('falls back to border-then-fill for multi-subpath fills', () => {
    // A square plus a second, disjoint square as its own subpath.
    const shape = new Square({ sideLength: 1, fillOpacity: 1 });
    const outline = shape.getLocalPoints();
    const shifted = outline.map((p) => [p[0] + 3, p[1], p[2]]);
    shape.setPoints3D([...outline, ...shifted]);
    shape.setBaseSubpathLengths([outline.length, shifted.length]);
    expect(shape.supportsPartialFill()).toBe(false);

    const anim = new Create(shape);
    anim.begin();
    anim.interpolate(0.25);
    expect(shape.fillOpacity).toBe(0);
    anim.finish();
    expect(shape.fillOpacity).toBe(1);
  });
});

describe('curveProportionFromArcLength', () => {
  // MIGRATION: example for the property
  //   ∀ path p, curveProportionFromArcLength(p, ·) is monotone, maps 0→0 and
  //   1→1, and is the identity when every curve has the same length.
  // Replace with a property test once the suite lands.
  it('maps arc length to curve index on uneven curves', () => {
    // Two straight curves: length 1 then length 3.
    const points = [
      [0, 0, 0],
      [1 / 3, 0, 0],
      [2 / 3, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ];
    expect(curveProportionFromArcLength(points, 0)).toBe(0);
    expect(curveProportionFromArcLength(points, 0.25)).toBeCloseTo(0.5, 6);
    expect(curveProportionFromArcLength(points, 0.625)).toBeCloseTo(0.75, 6);
    expect(curveProportionFromArcLength(points, 1)).toBe(1);
  });
});
