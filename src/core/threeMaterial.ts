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

type LitFlag =
  'isMeshStandardMaterial' | 'isMeshPhongMaterial' | 'isMeshLambertMaterial' | 'isMeshToonMaterial';

/**
 * Whether a material reacts to scene lights (a 3D shaded surface).
 * MeshPhysicalMaterial extends MeshStandardMaterial, so it is covered too.
 */
function isLitMaterial(material: THREE.Material): boolean {
  const flags = material as Partial<Record<LitFlag, boolean>>;
  return !!(
    flags.isMeshStandardMaterial ||
    flags.isMeshPhongMaterial ||
    flags.isMeshLambertMaterial ||
    flags.isMeshToonMaterial
  );
}

/**
 * Apply the 2D Scene depth policy to one material.
 *
 * A 2D Scene draws in add order (renderOrder), so flat materials turn depth
 * testing off and do not write depth. Lit 3D materials and depth-prepass
 * materials keep their depth settings, so a sphere or a molecule hides its
 * own far side (issue #859). Flat layers write no depth, so they never clip
 * a lit mesh that is drawn after them.
 *
 * @post (isLitMaterial(material) || material.userData.depthPrepass) =>
 *         material.depthTest === old.depthTest && material.depthWrite === old.depthWrite
 * @post !(isLitMaterial(material) || material.userData.depthPrepass) =>
 *         material.depthTest === false && material.depthWrite === false
 */
export function applyFlatSceneDepth(material: THREE.Material): void {
  if (isLitMaterial(material) || material.userData.depthPrepass) return;
  material.depthTest = false;
  material.depthWrite = false;
}
