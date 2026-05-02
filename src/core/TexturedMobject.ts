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
   * Shared texture handoff for transform swaps.
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
