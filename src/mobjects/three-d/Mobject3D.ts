import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';

/**
 * Base class for 3D mesh mobjects (Cube, Sphere, Cylinder, Arrow3D, Polyhedron, …).
 *
 * Unlike VMobjects, a 3D mesh stores its geometry in a Three.js buffer rather
 * than in bakeable points, so it cannot fold a transform into geometry. Instead
 * of resetting its local transform to identity (which would silently discard
 * rotation/scale), `normalizeTransform()` *absolutizes*: it sets the local
 * transform equal to the incoming world matrix, so the mesh renders in the right
 * place once its ancestors collapse to identity. It is a flattening barrier — its
 * descendants stay relative to it. See {@link Mobject._flattenAsMesh}.
 *
 * Any 3D mesh primitive should extend this class rather than `Mobject`.
 */
export abstract class Mobject3D extends Mobject {
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsMesh(worldMatrix);
  }
}
