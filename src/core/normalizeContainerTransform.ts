import * as THREE from 'three';
import { Mobject } from './Mobject';

interface ContainerLike {
  children: Mobject[];
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scaleVector: THREE.Vector3;
  _markDirty(): void;
}

interface NormalizeOptions {
  beforeTranslate?: () => void;
  translateChild: (child: Mobject, dx: number, dy: number, dz: number) => void;
}

function applyScale(container: ContainerLike): void {
  const sx = container.scaleVector.x;
  const sy = container.scaleVector.y;
  const sz = container.scaleVector.z;
  if (sx === 1 && sy === 1 && sz === 1) return;

  for (const child of container.children) {
    child.position.set(child.position.x * sx, child.position.y * sy, child.position.z * sz);
    child.scale([sx, sy, sz]);
  }
  container.scaleVector.set(1, 1, 1);
  container._markDirty();
}

const SCRATCH_EULER = new THREE.Euler();

function applyRotation(container: ContainerLike): void {
  const rx = container.rotation.x;
  const ry = container.rotation.y;
  const rz = container.rotation.z;
  if (rx === 0 && ry === 0 && rz === 0) return;

  SCRATCH_EULER.set(rx, ry, rz, container.rotation.order);
  for (const child of container.children) {
    child.position.applyEuler(SCRATCH_EULER);
    if (rx !== 0) child.rotate(rx, [1, 0, 0]);
    if (ry !== 0) child.rotate(ry, [0, 1, 0]);
    if (rz !== 0) child.rotate(rz, [0, 0, 1]);
  }
  container.rotation.set(0, 0, 0);
  container._markDirty();
}

function applyTranslation(container: ContainerLike, options: NormalizeOptions): void {
  const dx = container.position.x;
  const dy = container.position.y;
  const dz = container.position.z;
  if (dx === 0 && dy === 0 && dz === 0) return;

  options.beforeTranslate?.();
  for (const child of container.children) {
    options.translateChild(child, dx, dy, dz);
  }
  container.position.set(0, 0, 0);
  container._markDirty();
}

/**
 * Forward parent container S/R/T anchors into children, then reset parent anchors.
 * Order is S -> R -> T, then recurse into children.
 */
export function normalizeContainerTransform(
  container: ContainerLike,
  options: NormalizeOptions,
): void {
  applyScale(container);
  applyRotation(container);
  applyTranslation(container, options);

  for (const child of container.children) {
    child.normalizeTransform();
  }
}
