import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { meshMaterial } from '../../core/threeMaterial';
import { Mobject3D } from '../three-d/Mobject3D';
import { hsvToRgb, rgbToHex } from '../../utils/color';
import { Complex } from './ComplexPlane';

/** A complex function w = f(z), mapping one complex number to another. */
export type ComplexFunction = (z: Complex) => Complex;

/**
 * How the modulus |f(z)| drives brightness.
 *
 * - `smooth`: brightness rises monotonically with the modulus, dark at zeros
 *   and bright at poles.
 * - `banded`: brightness oscillates over each octave (power of two) of the
 *   modulus, giving the dark/light contour bands of a Wegert phase portrait.
 */
export type BrightnessScheme = 'smooth' | 'banded';

/** Options for creating a {@link DomainColoring}. */
export interface DomainColoringOptions {
  /** The complex function w = f(z) to visualize. */
  func: ComplexFunction;
  /** Real-axis range [min, max]. Default: [-5, 5] */
  reRange?: [number, number];
  /** Imaginary-axis range [min, max]. Default: [-5, 5] */
  imRange?: [number, number];
  /** Pixel grid size per axis, or [width, height]. Default: 256 */
  resolution?: number | [number, number];
  /** Brightness scheme for the modulus. Default: 'banded' */
  scheme?: BrightnessScheme;
  /** Color saturation from 0 to 1. Default: 1 */
  saturation?: number;
  /** Darken thin lines where the modulus crosses a power of two. Default: false */
  contourLines?: boolean;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

const TWO_PI = Math.PI * 2;
/** Brightness floor of a band in the `banded` scheme, so hue stays visible. */
const BAND_MIN = 0.3;
/** Half-width (in octaves) of a modulus contour line. */
const CONTOUR_WIDTH = 0.05;
/** Brightness multiplier at the center of a modulus contour line. */
const CONTOUR_DARKEN = 0.2;

/** Clamp a channel to 0..1 and turn any non-finite value into 0. */
function safe01(channel: number): number {
  if (!Number.isFinite(channel)) return 0;
  if (channel < 0) return 0;
  if (channel > 1) return 1;
  return channel;
}

/**
 * Map an evaluated value w = f(z) to an `[r, g, b]` float color (0..1).
 *
 * The hue encodes arg(w): the positive real axis is hue 0, and a quarter turn
 * toward the positive imaginary axis shifts the hue by 90 degrees. The modulus
 * |w| drives brightness through the chosen scheme. The result is always a valid
 * color: a pole (|w| not finite) reads bright, a zero reads dark, and any
 * non-finite channel becomes 0, so poles and zeros never produce NaN colors.
 */
export function phasePortraitColor(
  w: Complex,
  scheme: BrightnessScheme,
  saturation: number,
  contourLines: boolean,
): [number, number, number] {
  // Hue from the argument; an undefined argument falls back to 0.
  let arg = Math.atan2(w.im, w.re);
  if (!Number.isFinite(arg)) arg = 0;
  let hue = arg / TWO_PI;
  hue -= Math.floor(hue); // wrap into [0, 1)

  const modulus = Math.hypot(w.re, w.im);
  let value: number;
  if (!Number.isFinite(modulus)) {
    value = 1; // pole: brightest
  } else if (modulus === 0) {
    value = scheme === 'banded' ? BAND_MIN : 0; // zero: darkest
  } else if (scheme === 'banded') {
    const octave = Math.log2(modulus);
    const frac = octave - Math.floor(octave); // [0, 1) ramp per octave
    value = BAND_MIN + (1 - BAND_MIN) * frac;
  } else {
    value = modulus / (modulus + 1); // smooth: monotonic 0 -> 1
  }

  if (contourLines && Number.isFinite(modulus) && modulus > 0) {
    const octave = Math.log2(modulus);
    const dist = Math.abs(octave - Math.round(octave));
    if (dist < CONTOUR_WIDTH) {
      const t = dist / CONTOUR_WIDTH;
      value *= CONTOUR_DARKEN + (1 - CONTOUR_DARKEN) * t;
    }
  }

  const sat = safe01(saturation);
  const [r, g, b] = hsvToRgb([hue, sat, safe01(value)]);
  return [safe01(r), safe01(g), safe01(b)];
}

/**
 * DomainColoring - a phase portrait of a complex function f: C -> C.
 *
 * The region of the complex plane is sampled on a regular pixel grid. Each
 * pixel's complex value w = f(z) is turned into a color by {@link
 * phasePortraitColor}: the hue encodes arg(w) and the brightness encodes |w|.
 * The pixels are written to an RGBA buffer that is uploaded as a texture on a
 * flat quad spanning `reRange` x `imRange`, mirroring the way {@link HeatMap}
 * renders a sampled scalar field.
 *
 * The pixel buffer is computed in plain TypeScript, so it is deterministic and
 * readable without a browser. In a browser the buffer becomes a
 * `THREE.CanvasTexture`; without a DOM it becomes an equivalent
 * `THREE.DataTexture`.
 *
 * Pixel layout: row 0 is the top (im = imMax), the last row is the bottom
 * (im = imMin); column 0 is the left (re = reMin), the last column is the
 * right (re = reMax).
 *
 * @example
 * ```typescript
 * // The identity f(z) = z
 * const portrait = new DomainColoring({
 *   func: (z) => z,
 *   reRange: [-2, 2],
 *   imRange: [-2, 2],
 *   resolution: 256,
 * });
 * ```
 */
export class DomainColoring extends Mobject3D {
  private _func: ComplexFunction;
  private _reRange: [number, number];
  private _imRange: [number, number];
  private _width: number;
  private _height: number;
  private _scheme: BrightnessScheme;
  private _saturation: number;
  private _contourLines: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: DomainColoringOptions) {
    super();

    const {
      func,
      reRange = [-5, 5],
      imRange = [-5, 5],
      resolution = 256,
      scheme = 'banded',
      saturation = 1,
      contourLines = false,
      opacity = 1,
      center = [0, 0, 0],
    } = options;

    const [width, height] = Array.isArray(resolution) ? resolution : [resolution, resolution];
    this._func = func;
    this._reRange = [...reRange];
    this._imRange = [...imRange];
    this._width = Math.max(1, Math.floor(width));
    this._height = Math.max(1, Math.floor(height));
    this._scheme = scheme;
    this._saturation = saturation;
    this._contourLines = contourLines;
    this._centerPoint = [...center];

    this._opacity = opacity;
    this.fillOpacity = opacity;
    this.position.set(center[0], center[1], center[2]);
  }

  /** The complex number z sampled at pixel column `col`, row `row`. */
  pixelToComplex(col: number, row: number): Complex {
    const [reMin, reMax] = this._reRange;
    const [imMin, imMax] = this._imRange;
    const u = this._width === 1 ? 0.5 : col / (this._width - 1);
    const v = this._height === 1 ? 0.5 : row / (this._height - 1);
    return {
      re: reMin + u * (reMax - reMin),
      im: imMax - v * (imMax - imMin), // row 0 is the top (imMax)
    };
  }

  /** Sample the function over the grid into an RGBA buffer (row 0 at the top). */
  getPixelData(): Uint8ClampedArray {
    const w = this._width;
    const h = this._height;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const z = this.pixelToComplex(col, row);
        const value = this._func(z);
        const [r, g, b] = phasePortraitColor(
          value,
          this._scheme,
          this._saturation,
          this._contourLines,
        );
        const idx = (row * w + col) * 4;
        data[idx] = Math.round(r * 255);
        data[idx + 1] = Math.round(g * 255);
        data[idx + 2] = Math.round(b * 255);
        data[idx + 3] = 255;
      }
    }
    return data;
  }

  /** The pixel grid size as [width, height]. */
  getResolution(): [number, number] {
    return [this._width, this._height];
  }

  /** The hex color the portrait assigns to the complex number `z`. */
  colorAt(z: Complex): string {
    const value = this._func(z);
    return rgbToHex(phasePortraitColor(value, this._scheme, this._saturation, this._contourLines));
  }

  /** Build a texture from the pixel buffer, preferring a canvas when a DOM exists. */
  private _buildTexture(): THREE.Texture {
    const data = this.getPixelData();
    const w = this._width;
    const h = this._height;

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const image = ctx.createImageData(w, h);
        image.data.set(data);
        ctx.putImageData(image, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = true; // row 0 (imMax) maps to the top of the quad
        texture.needsUpdate = true;
        return texture;
      }
    }

    // Headless fallback: a DataTexture carries the same pixels.
    const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true; // match the canvas path's orientation
    texture.needsUpdate = true;
    return texture;
  }

  /** Build the textured quad spanning reRange x imRange. */
  private _buildGeometry(): THREE.BufferGeometry {
    const [reMin, reMax] = this._reRange;
    const [imMin, imMax] = this._imRange;
    const positions = new Float32Array([
      reMin,
      imMin,
      0,
      reMax,
      imMin,
      0,
      reMax,
      imMax,
      0,
      reMin,
      imMax,
      0,
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    return geometry;
  }

  protected _createThreeObject(): THREE.Object3D {
    const material = new THREE.MeshBasicMaterial({
      map: this._buildTexture(),
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(this._buildGeometry(), material);
  }

  protected override _syncMaterialToThree(): void {
    const material = this.getMeshMaterial<THREE.MeshBasicMaterial>();
    if (material) {
      material.opacity = this._opacity;
      material.transparent = this._opacity < 1;
      material.needsUpdate = true;
    }
  }

  /** Rebuild the geometry and texture after the function or options change. */
  private _update(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const mesh = this._threeObject;
      const oldGeometry = mesh.geometry;
      mesh.geometry = this._buildGeometry();
      oldGeometry.dispose();
      const material = meshMaterial<THREE.MeshBasicMaterial>(mesh);
      const oldMap = material.map;
      material.map = this._buildTexture();
      material.needsUpdate = true;
      if (oldMap) oldMap.dispose();
    }
    this._markDirty();
  }

  /** Get the complex function. */
  getFunc(): ComplexFunction {
    return this._func;
  }

  /** Set the complex function and rebuild. */
  setFunc(func: ComplexFunction): this {
    this._func = func;
    this._update();
    return this;
  }

  /** The brightness scheme in use. */
  getScheme(): BrightnessScheme {
    return this._scheme;
  }

  /** Set the brightness scheme and rebuild. */
  setScheme(scheme: BrightnessScheme): this {
    this._scheme = scheme;
    this._update();
    return this;
  }

  override copy(): DomainColoring {
    const copy = new DomainColoring({
      func: this._func,
      reRange: this._reRange,
      imRange: this._imRange,
      resolution: [this._width, this._height],
      scheme: this._scheme,
      saturation: this._saturation,
      contourLines: this._contourLines,
      opacity: this._opacity,
      center: [...this._centerPoint],
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
