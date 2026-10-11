/**
 * Canvas-texture helpers for the raster Text mobject and its subclasses.
 *
 * A Text draws its glyphs to an off-screen 2D canvas and shows that canvas as a
 * `THREE.CanvasTexture` on a plane. When the string changes length the canvas is
 * resized, and three.js keeps the GPU texture at its first allocated size: a
 * resized CanvasTexture re-uploaded in place is clipped to the old size (issue
 * #607, a growing click counter froze at "9"). These helpers create the texture
 * with the standard settings and recreate it when the canvas changes size, which
 * forces a fresh GPU allocation.
 *
 * The canvas size each texture was allocated for is kept here, in a WeakMap keyed
 * by the texture, so the caller does not have to track it. Entries disappear when
 * the texture is garbage-collected.
 */
import * as THREE from 'three';

const allocatedSize = new WeakMap<THREE.Texture, { width: number; height: number }>();

/**
 * Create a CanvasTexture for a text backing canvas with the standard settings,
 * and record the canvas size it was allocated for.
 */
export function createTextCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  allocatedSize.set(texture, { width: canvas.width, height: canvas.height });
  return texture;
}

/**
 * Recreate the texture when the backing canvas changed size.
 *
 * Returns the new texture, or null when nothing was done: an input is missing,
 * the size matches the texture's allocation, or the material is not a
 * `MeshBasicMaterial`. On a change the new texture becomes `material.map`, the
 * material is flagged for re-upload, and the previous texture is disposed. A
 * texture with no recorded size (e.g. adopted in a transform handoff) counts as
 * a size mismatch, so it is replaced by a fresh texture for the current canvas.
 */
export function reallocateTextureIfResized(
  mesh: THREE.Mesh | null,
  canvas: HTMLCanvasElement | null,
  texture: THREE.Texture | null,
): THREE.CanvasTexture | null {
  if (!mesh || !canvas || !texture) {
    return null;
  }
  const size = allocatedSize.get(texture);
  if (size && canvas.width === size.width && canvas.height === size.height) {
    return null;
  }
  const material = mesh.material;
  if (!(material instanceof THREE.MeshBasicMaterial)) {
    return null;
  }
  const next = createTextCanvasTexture(canvas);
  material.map = next;
  material.needsUpdate = true;
  texture.dispose();
  return next;
}
