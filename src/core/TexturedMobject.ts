import type * as THREE from 'three';
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
}
