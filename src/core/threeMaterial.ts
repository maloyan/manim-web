/**
 * Typed access to a THREE.Mesh material.
 *
 * A `THREE.Mesh` declares `material` as `THREE.Material | THREE.Material[]`.
 * A mobject builds its mesh with one known material type, so every read needs
 * a narrowing assertion. This helper does that assertion in ONE place so the
 * mobjects do not repeat it at each call site.
 */

import * as THREE from 'three';

/**
 * Return the single material of a mesh, typed as T.
 *
 * The caller builds the mesh with a known material type, so the assertion is
 * safe. A mesh in this library always carries one material; the array branch
 * returns the first element to keep a defined result.
 *
 * @param mesh - The mesh to read the material from.
 * @returns The mesh material as T.
 */
export function meshMaterial<T extends THREE.Material = THREE.Material>(mesh: THREE.Mesh): T {
  const material = mesh.material;
  return (Array.isArray(material) ? material[0] : material) as T;
}
