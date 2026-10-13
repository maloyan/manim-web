import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';

/**
 * The local axis that Three.js primitives (cylinder, cone, tube segment) point
 * along by default. A mesh is oriented by rotating this axis onto a target.
 */
const UNIT_Y = new THREE.Vector3(0, 1, 0);

/**
 * Orient a mesh so its local +Y axis points along a direction.
 *
 * Three.js cylinders and cones are built along +Y, so a start->end primitive
 * needs one rotation that maps +Y onto the normalized direction. The rotation
 * is a quaternion from `setFromUnitVectors`, which itself handles the
 * antiparallel (-Y) edge case by choosing an orthogonal axis.
 *
 * A zero-length direction has no orientation, so the mesh is left at identity.
 *
 * @param mesh - The object to orient (its quaternion is overwritten).
 * @param direction - The target direction as a tuple or THREE.Vector3.
 */
export function orientMeshAlong(
  mesh: THREE.Object3D,
  direction: Vector3Tuple | THREE.Vector3,
): void {
  const dir =
    direction instanceof THREE.Vector3
      ? direction.clone()
      : new THREE.Vector3(direction[0], direction[1], direction[2]);

  const length = dir.length();
  if (length === 0) {
    // No direction to align to; keep the mesh at its default orientation.
    mesh.quaternion.identity();
    return;
  }

  dir.divideScalar(length);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(UNIT_Y, dir);
  mesh.quaternion.copy(quaternion);
}
