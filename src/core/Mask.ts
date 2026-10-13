/**
 * Stencil-buffer clip masking for mobjects.
 *
 * A mask shape (any VMobject, e.g. a Circle or Rectangle) defines a visible
 * region. The masked content is drawn only where it overlaps the mask shape's
 * filled area, like an After-Effects track matte. The implementation uses the
 * WebGL stencil buffer: the mask shape writes a dedicated stencil bit over its
 * fill region (drawing no color), then the masked content is set to pass the
 * stencil test only where that bit is set.
 *
 * Design notes:
 * - A single dedicated bit ({@link MASK_STENCIL_BIT}) carries the mask. The
 *   mask write touches only that bit (`stencilWriteMask = MASK_STENCIL_BIT`)
 *   and the content test reads only that bit (`stencilFuncMask =
 *   MASK_STENCIL_BIT`). This keeps the mask independent of the low stencil
 *   bits that VMobjectRendering already uses for its transparent-stroke
 *   anti-overlap pass.
 * - The mask shape renders in the opaque pass with a very low renderOrder, so
 *   it writes the stencil before any masked content draws, regardless of pass.
 * - These helpers only ever change state when a mask is active. An unmasked
 *   mobject's materials are never touched, so the default render path stays
 *   byte-identical.
 */

import * as THREE from 'three';

/**
 * The stencil bit reserved for clip masking. It is the high bit so it never
 * collides with the low-bit refs that transparent-stroke anti-overlap uses.
 */
export const MASK_STENCIL_BIT = 0x80;

/**
 * renderOrder applied to a mask shape so it draws before all normal content
 * (normal content starts at renderOrder 0 and counts up). A large negative
 * value guarantees the mask's stencil write precedes every content draw.
 */
export const MASK_RENDER_ORDER = -1_000_000;

/** Options for {@link Mobject.setMask}. */
export interface MaskOptions {
  /**
   * When true, show the content OUTSIDE the mask shape instead of inside it
   * (an inverted / "hold-out" matte). Defaults to false.
   */
  invert?: boolean;
}

/**
 * Run a callback for every material in an Object3D subtree.
 * Handles both single-material and multi-material meshes.
 */
function forEachMaterial(root: THREE.Object3D, fn: (material: THREE.Material) => void): void {
  root.traverse((child) => {
    const withMaterial = child as THREE.Object3D & {
      material?: THREE.Material | THREE.Material[];
    };
    const material = withMaterial.material;
    if (!material) return;
    if (Array.isArray(material)) {
      for (const m of material) fn(m);
    } else {
      fn(material);
    }
  });
}

/**
 * Configure a mask shape's materials to write {@link MASK_STENCIL_BIT} over its
 * fill region while drawing no color, and to draw before all content.
 *
 * @param maskObject - The mask shape's backing Three.js object.
 * @param renderOrder - renderOrder to force on the whole subtree.
 */
export function applyMaskWriteStencil(maskObject: THREE.Object3D, renderOrder: number): void {
  maskObject.renderOrder = renderOrder;
  maskObject.traverse((child) => {
    child.renderOrder = renderOrder;
  });
  forEachMaterial(maskObject, (material) => {
    material.stencilWrite = true;
    material.stencilFunc = THREE.AlwaysStencilFunc;
    material.stencilRef = MASK_STENCIL_BIT;
    material.stencilFuncMask = MASK_STENCIL_BIT;
    material.stencilWriteMask = MASK_STENCIL_BIT;
    material.stencilFail = THREE.KeepStencilOp;
    material.stencilZFail = THREE.KeepStencilOp;
    material.stencilZPass = THREE.ReplaceStencilOp;
    // The mask is a matte: it drives the stencil but is never seen.
    material.colorWrite = false;
    material.depthWrite = false;
    material.depthTest = false;
  });
}

/**
 * Configure masked content's materials to draw only where the mask bit is set
 * (or only where it is NOT set, when inverted). The content never modifies the
 * stencil buffer (`stencilWriteMask = 0`).
 *
 * @param contentObject - The masked content's backing Three.js object.
 * @param invert - When true, draw outside the mask instead of inside.
 */
export function applyMaskedStencil(contentObject: THREE.Object3D, invert: boolean): void {
  forEachMaterial(contentObject, (material) => {
    material.stencilWrite = true;
    material.stencilFunc = invert ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc;
    material.stencilRef = MASK_STENCIL_BIT;
    material.stencilFuncMask = MASK_STENCIL_BIT;
    material.stencilWriteMask = 0x00;
    material.stencilFail = THREE.KeepStencilOp;
    material.stencilZFail = THREE.KeepStencilOp;
    material.stencilZPass = THREE.KeepStencilOp;
  });
}

/**
 * Restore an Object3D subtree's materials to Three.js stencil defaults and
 * re-enable color writes. Used when a mask is cleared. Material-specific state
 * (such as anti-overlap stencil for transparent strokes) is re-established by
 * the mobject's own material sync on the next dirty cycle.
 *
 * @param contentObject - The subtree whose materials to reset.
 */
export function resetMaskStencil(contentObject: THREE.Object3D): void {
  forEachMaterial(contentObject, (material) => {
    material.stencilWrite = false;
    material.stencilFunc = THREE.AlwaysStencilFunc;
    material.stencilRef = 0;
    material.stencilFuncMask = 0xff;
    material.stencilWriteMask = 0xff;
    material.stencilFail = THREE.KeepStencilOp;
    material.stencilZFail = THREE.KeepStencilOp;
    material.stencilZPass = THREE.KeepStencilOp;
    material.colorWrite = true;
  });
}
