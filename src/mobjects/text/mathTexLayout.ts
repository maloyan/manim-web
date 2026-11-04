/**
 * Glyph-geometry helpers for MathTex: collect the leaf glyph paths of a
 * rendered expression, measure them, and bake a transform into them.
 */

import * as THREE from 'three';
import type { Mobject } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';

/** The leaf glyph paths under `root` (direct children or nested in part groups). */
export function collectGlyphs(root: Mobject): VMobject[] {
  const glyphs: VMobject[] = [];
  const visit = (mob: Mobject) => {
    if (mob instanceof VMobject && !(mob instanceof VGroup)) glyphs.push(mob);
    for (const child of mob.children) visit(child);
  };
  visit(root);
  return glyphs;
}

/**
 * [minX, maxX] over the glyphs' local points; [0, 0] when there are none.
 *
 * @post result[0] <= result[1]
 */
function horizontalExtent(glyphs: VMobject[]): [number, number] {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const glyph of glyphs) {
    for (const p of glyph.getLocalPoints()) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
    }
  }
  return minX <= maxX ? [minX, maxX] : [0, 0];
}

/**
 * Apply `matrix` to every local point of every glyph.
 *
 * @post glyphs[g].getLocalPoints()[i] === matrix * old.glyphs[g].getLocalPoints()[i]
 */
function bakeMatrixIntoGlyphs(glyphs: VMobject[], matrix: THREE.Matrix4): void {
  const v = new THREE.Vector3();
  for (const glyph of glyphs) {
    glyph.setPoints3D(
      glyph.getLocalPoints().map((p) => {
        v.set(p[0], p[1], p[2]).applyMatrix4(matrix);
        return [v.x, v.y, v.z];
      }),
    );
  }
}

type WithMaterial = THREE.Object3D & { material?: THREE.Material | THREE.Material[] };

/** The first material in a Three.js subtree, or null when it has none. */
export function firstMaterial(root: THREE.Object3D | null): THREE.Material | null {
  let found: THREE.Material | null = null;
  root?.traverse((node) => {
    const material = (node as WithMaterial).material;
    if (!found && material) found = Array.isArray(material) ? material[0] : material;
  });
  return found;
}

/**
 * Give the mobjects' Three.js subtrees `renderOrder` and, when `reference`
 * is given, its depth settings: the layering Scene.add() stamps on a
 * subtree, for children added after it.
 *
 * @post ∀ node in mobjects' subtrees: node.renderOrder === renderOrder
 */
export function inheritLayering(
  mobjects: Mobject[],
  renderOrder: number,
  reference: THREE.Material | null,
): void {
  for (const mobject of mobjects) {
    mobject.getThreeObject().traverse((node) => {
      node.renderOrder = renderOrder;
      const material = (node as WithMaterial).material;
      if (!reference || !material) return;
      for (const m of Array.isArray(material) ? material : [material]) {
        m.depthTest = reference.depthTest;
        m.depthWrite = reference.depthWrite;
      }
    });
  }
}

/**
 * Shift freshly laid-out glyphs horizontally so their `anchor` point lands
 * where the previous layout's was (no shift for a first layout), then bake
 * `geometryMatrix` into them. Returns the new layout's horizontal extent,
 * before `geometryMatrix`.
 *
 * @post previous !== null && anchor === 'left' => result[0] === previous[0]
 * @post previous !== null && anchor === 'right' => result[1] === previous[1]
 */
export function placeGlyphs(
  glyphs: VMobject[],
  previous: [number, number] | null,
  anchor: 'center' | 'left' | 'right',
  geometryMatrix: THREE.Matrix4,
): [number, number] {
  const [minX, maxX] = horizontalExtent(glyphs);
  let offsetX = 0;
  if (previous) {
    const [oldMin, oldMax] = previous;
    if (anchor === 'left') offsetX = oldMin - minX;
    else if (anchor === 'right') offsetX = oldMax - maxX;
    else offsetX = (oldMin + oldMax) / 2 - (minX + maxX) / 2;
  }
  bakeMatrixIntoGlyphs(
    glyphs,
    geometryMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(offsetX, 0, 0)),
  );
  return [minX + offsetX, maxX + offsetX];
}
