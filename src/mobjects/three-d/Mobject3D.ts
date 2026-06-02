import { Mobject } from '../../core/Mobject';

/**
 * Base class for 3D mesh mobjects (Cube, Sphere, Cylinder, Arrow3D, Polyhedron, …).
 *
 * Unlike VMobjects, a 3D mesh stores its geometry in a Three.js buffer rather
 * than in bakeable `_points3D`. The inherited `Mobject.normalizeTransform()`
 * folds geometry by baking points and then resets `rotation`/`scaleVector` to
 * identity — but for a mesh there are no points to bake, so it would reset the
 * transform fields WITHOUT folding them into the geometry, silently discarding
 * the object's rotation/scale (and mutating the source during `copy()`).
 *
 * 3D meshes therefore keep their transform intact: `normalizeTransform()` is a
 * no-op. Any 3D mesh primitive should extend this class rather than `Mobject`.
 */
export abstract class Mobject3D extends Mobject {
  override normalizeTransform(): this {
    return this;
  }
}
