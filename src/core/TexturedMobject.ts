import * as THREE from 'three';
import { Mobject } from './Mobject';

/**
 * Base class for mobjects that render via textured display meshes.
 *
 * Shape-morph code can use this contract to transfer texture/material state
 * without knowing the concrete textured subtype.
 */
export abstract class TexturedMobject extends Mobject {
  /**
   * Return the meshes that visually represent this mobject.
   * Textured morph code can use this for strict single-mesh validation.
   */
  abstract override getDisplayMeshes(): THREE.Mesh[];

  /**
   * Return how many display meshes this textured mobject contributes.
   */
  abstract override getDisplayMeshLength(): number;

  /**
   * Copy texture/material-relevant state from another textured mobject.
   */
  abstract applyTextureFrom(other: TexturedMobject): void;

  /**
   * Update class-authoritative visual size state so later sync cycles do not
   * revert display dimensions set during transform finish.
   */
  abstract applyVisualSize(width: number, height: number): void;

  /**
   * Copy class-authoritative content metadata from another textured mobject so that
   * future sync cycles and API reads (e.g. getText()) reflect the target's content.
   */
  abstract applyContentFrom(other: TexturedMobject): void;

  /**
   * Return this mobject's current persistent visual size `[width, height]` in
   * world units, or `null` if it has no own bakeable geometry right now (e.g. a
   * multi-part container whose parts are children, or content not yet rendered).
   *
   * Used by `_bakeOwnGeometry` to fold `scaleVector` into the display mesh size.
   * Default: `null` (no own geometry).
   */
  protected _currentVisualSize(): [number, number] | null {
    return null;
  }

  /**
   * Whether this mobject owns the display mesh(es) returned by
   * `getDisplayMeshes()` directly (vs. delegating to child mobjects, e.g. a
   * multi-part container). Containers must return `false` so that scale/rotation
   * baking is left to the children (which are normalized recursively) rather
   * than double-applied here. Default: `true`.
   */
  protected _ownsDisplayMesh(): boolean {
    return true;
  }

  /**
   * Bake this textured leaf's own `scaleVector` and Z-`rotation` into the
   * display mesh so the rendered mesh and `getBounds()` stay unchanged after
   * `_propagateTransformDownward` resets `scaleVector`/`rotation` to identity.
   *
   * Why this is needed: a TexturedMobject's geometry is a textured display mesh,
   * not `_points3D`. The base `_bakeOwnGeometry` is a no-op, so before this
   * override the scale/rotation accumulated on a textured leaf was silently
   * dropped by #417's normalization (tiny logo M; stray rotated axis labels).
   *
   * - Scale: folded into the persistent visual size via `applyVisualSize`, which
   *   rebuilds the plane geometry — so bounds reflect the baked size at scale=1.
   * - Rotation: only the in-plane Z component is folded into each display mesh's
   *   local rotation (the flat +Z quad cannot meaningfully bake X/Y rotation).
   *
   * Idempotent: the caller (`_propagateTransformDownward`) resets `scaleVector`
   * to (1,1,1) and `rotation` to (0,0,0) immediately after this returns, so a
   * second normalize reads identity and does nothing.
   *
   * ORDER ASSUMPTION (uniform scale): folding scale into the size and then adding
   * `rz` to the mesh's local rotation is only equivalent to three.js's
   * parent-scale-then-child-rotation when the scale is uniform (`sx === sy`).
   * A non-uniform scale and a non-zero `rz` do not commute: baking the scale into
   * the size shears the rendered quad in the wrong frame. For that case (and for
   * the pre-render case where there is no bakeable size yet) we delegate to
   * `_bakeFallbackScale`, which subclasses make DURABLE by persisting the factor
   * (see `ImageMobject`/`Text`) so a later async load / canvas re-render composes
   * with it rather than clobbering it. `getBounds()` stays correct either way (it
   * reads the actual world matrices). The common uniform-scale path is unchanged.
   */
  protected override _bakeOwnGeometry(): void {
    if (!this._ownsDisplayMesh()) return;

    const sx = this.scaleVector.x;
    const sy = this.scaleVector.y;
    const rz = this.rotation.z;

    if (sx !== 1 || sy !== 1) {
      const size = this._currentVisualSize();
      const nonUniformWhileRotated = rz !== 0 && sx !== sy;
      if (size && !nonUniformWhileRotated) {
        this.applyVisualSize(size[0] * sx, size[1] * sy);
      } else {
        // No bakeable size yet (content not rendered) OR non-uniform scale on a
        // Z-rotated mesh: delegate to the durable fallback so the factor survives
        // the caller's scaleVector→1 reset, a later load/re-render, and bounds.
        this._bakeFallbackScale(sx, sy);
      }
    }

    if (rz !== 0) {
      for (const mesh of this.getDisplayMeshes()) {
        mesh.rotation.z += rz;
      }
    }
  }

  /**
   * Durably bake a scale factor for the cases `_bakeOwnGeometry` cannot fold into
   * the persistent visual size: content not yet rendered/loaded, or a non-uniform
   * scale on a Z-rotated mesh.
   *
   * The base implementation writes the factor into the display mesh's local scale.
   * This is correct for the world-matrix `getBounds()` and composes in the right
   * order with the mesh-local rotation, BUT it is non-durable for subtypes whose
   * later async load / canvas re-render rewrites `mesh.scale` from scratch, or
   * whose `getBoundingBox()` ignores `mesh.scale`. Such subtypes (ImageMobject,
   * Text) override this to persist the factor in their own size state so it is
   * honored by later rebuilds and by `getBoundingBox()`.
   *
   * Idempotent across repeated normalizes: the caller resets `scaleVector`→1 right
   * after this returns, so a second normalize reads identity and does nothing.
   */
  protected _bakeFallbackScale(sx: number, sy: number): void {
    for (const mesh of this.getDisplayMeshes()) {
      mesh.scale.x *= sx;
      mesh.scale.y *= sy;
    }
  }

  /**
   * Sets material.map, marks material dirty, and disposes previous texture when replaced.
   */
  protected _handoffTextureMap(
    material: THREE.MeshBasicMaterial,
    nextTexture: THREE.Texture | null,
    previousTexture: THREE.Texture | null,
  ): void {
    material.map = nextTexture;
    material.needsUpdate = true;
    if (previousTexture && previousTexture !== nextTexture) {
      previousTexture.dispose();
    }
  }
}
