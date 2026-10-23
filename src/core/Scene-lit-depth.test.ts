/**
 * Regression tests for issue #859: the 2D Scene turned depth testing off on
 * every material, so lit 3D meshes (Molecule3D, Protein, Sphere) drew far
 * parts over near parts. Lit materials now keep depth testing; 2D layering
 * (depthTest off, ordered by renderOrder) stays as before.
 */
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { Scene } from './Scene';
import { Circle } from '../mobjects/geometry/Circle';
import { Sphere } from '../mobjects/three-d/Sphere';

function materialsOf(obj: THREE.Object3D): THREE.Material[] {
  const out: THREE.Material[] = [];
  obj.traverse((c) => {
    const holder: THREE.Object3D & { material?: THREE.Material | THREE.Material[] } = c;
    if (!holder.material) return;
    out.push(...(Array.isArray(holder.material) ? holder.material : [holder.material]));
  });
  return out;
}

describe('Scene.add depth settings (issue #859)', () => {
  // MIGRATION: example for the property
  //   ∀ mobject m added to a 2D Scene, ∀ material x of m:
  //     isLit(x) => x.depthTest === true
  //     !isLit(x) => x.depthTest === false && x.depthWrite === false
  // Replace with a property test once the suite lands.
  it('keeps depthTest on lit 3D meshes and off on 2D VMobjects', () => {
    const scene = Scene.createHeadless();
    const circle = new Circle({ radius: 1 });
    const sphere = new Sphere({ radius: 1 });
    scene.add(circle, sphere);

    const flat = materialsOf(circle.getThreeObject());
    expect(flat.length).toBeGreaterThan(0);
    for (const m of flat) {
      expect(m.depthTest).toBe(false);
      // A 2D layer must not write depth, or it would clip a lit mesh behind it.
      expect(m.depthWrite).toBe(false);
    }

    const lit = materialsOf(sphere.getThreeObject());
    expect(lit.length).toBeGreaterThan(0);
    for (const m of lit) expect(m.depthTest).toBe(true);

    scene.dispose();
  });
});
