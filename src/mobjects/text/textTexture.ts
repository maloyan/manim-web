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

/** Base supersampling multiplier for a text canvas, before the device pixel ratio. */
export const TEXT_BASE_RESOLUTION_SCALE = 2;

/**
 * Anisotropy requested for a text canvas texture. The renderer clamps this to
 * the GPU maximum at upload, so a fixed request is safe without the renderer.
 * It keeps oblique or scaled text sharp.
 */
const TEXT_TEXTURE_ANISOTROPY = 8;

/**
 * Supersampling scale for a text canvas, aware of the device pixel ratio.
 *
 * The glyphs draw to an off-screen canvas at this scale, and the plane shrinks
 * back by the same factor. So the on-screen size does not change. Only the
 * texture resolution behind the plane changes. On a retina screen
 * (`devicePixelRatio` 2) the browser upscales the plane to twice as many
 * physical pixels, so the texture must carry twice the detail to stay crisp.
 * The effective scale is `base(2) * clamp(devicePixelRatio, 1, 2)`, which is 4
 * on retina.
 *
 * Without a DOM (SSR or headless) the ratio is unknown, so it falls back to 1
 * and the scale to the base 2. The same scale value drives both the draw
 * (multiply) and the world-size computation (divide), so the on-screen size is
 * invariant to the device pixel ratio.
 */
export function getTextResolutionScale(): number {
  const dpr =
    typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
      ? window.devicePixelRatio
      : 1;
  const ratio = Math.min(Math.max(dpr, 1), 2);
  return TEXT_BASE_RESOLUTION_SCALE * ratio;
}

/**
 * Apply the shared sampling settings for a text, markup, or math canvas texture.
 *
 * It sets the sRGB color space, trilinear minification through mipmaps so
 * minified text does not alias, linear magnification, and anisotropic filtering
 * so oblique or scaled text stays sharp. WebGL2 (the three.js default) supports
 * mipmaps on a non-power-of-two canvas texture, so the backing canvas needs no
 * power-of-two padding. The caller owns `needsUpdate`.
 */
export function applyTextTextureFilters(texture: THREE.Texture): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = TEXT_TEXTURE_ANISOTROPY;
}

/**
 * Create a CanvasTexture for a text backing canvas with the standard settings,
 * and record the canvas size it was allocated for.
 */
export function createTextCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  applyTextTextureFilters(texture);
  texture.needsUpdate = true;
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
