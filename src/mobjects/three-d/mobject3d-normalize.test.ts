import { describe, it, expect } from 'vitest';
import { Mobject3D } from './Mobject3D';
import { Cube } from './Cube';
import { Cone } from './Cylinder';
import { Tetrahedron } from './Polyhedra';

/**
 * A 3D mesh stores geometry in a Three.js buffer (no bakeable `_points3D`), so
 * the inherited Mobject.normalizeTransform() would reset rotation/scaleVector
 * to identity WITHOUT folding them into the geometry — silently discarding the
 * transform and corrupting the source during copy(). Mobject3D makes it a no-op.
 */
describe('Mobject3D.normalizeTransform is a no-op', () => {
  // Representatives: a plain mesh, a subclass (Cone←Cylinder), and a
  // Polyhedron subclass — to confirm the base override is inherited.
  // MIGRATION: examples for the properties, over all 3D mesh m:
  //   1. m instanceof Mobject3D
  //   2. m.normalizeTransform() === m  &&  it leaves rotation/scaleVector unchanged
  //   3. c = m.copy() => m unchanged && c.getBounds() === m.getBounds()
  // Replace with property tests once the generated suite lands.
  const makers: [string, () => Mobject3D][] = [
    ['Cube', () => new Cube({ sideLength: 2 })],
    ['Cone (←Cylinder)', () => new Cone({})],
    ['Tetrahedron (←Polyhedron)', () => new Tetrahedron()],
  ];

  for (const [name, make] of makers) {
    it(`${name}: normalizeTransform() preserves the transform`, () => {
      const m = make();
      expect(m).toBeInstanceOf(Mobject3D);
      m.rotation.z = 0.785;
      m.scaleVector.set(2, 3, 4);

      expect(m.normalizeTransform()).toBe(m);
      expect(m.rotation.z).toBeCloseTo(0.785);
      expect([m.scaleVector.x, m.scaleVector.y, m.scaleVector.z]).toEqual([2, 3, 4]);
    });

    it(`${name}: copy() carries the transform without mutating the source`, () => {
      const m = make();
      m.rotation.z = 0.785;
      m.scaleVector.set(2, 2, 2);
      m.position.set(1, 1, 0);
      const srcBounds = JSON.stringify(m.getBounds());

      const copy = m.copy() as Mobject3D;

      expect(m.rotation.z).toBeCloseTo(0.785); // source unchanged
      expect(JSON.stringify(m.getBounds())).toBe(srcBounds);
      expect(copy.rotation.z).toBeCloseTo(0.785); // clone reproduces it
      expect(JSON.stringify(copy.getBounds())).toBe(srcBounds);
    });
  }
});
