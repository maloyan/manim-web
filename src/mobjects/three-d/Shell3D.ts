import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { MeshBuilder, OrganicMesh3D, requireNumber, type OrganicMeshOptions } from './organicMesh';

/**
 * How a Shell3D is cut open.
 *
 * - `'plane'`: cut by a plane with normal `cutDirection` at `cutOffset` (a
 *   fraction of the outer radius along that normal). The part below the plane
 *   stays: a bowl, or a sphere with a round opening.
 * - `'wedge'`: an orange-slice wedge is removed, from azimuth `wedgeStart`
 *   over `wedgeAngle` radians around `cutDirection`.
 */
export type Shell3DCut = 'plane' | 'wedge';

/**
 * Options for creating a Shell3D.
 */
export interface Shell3DOptions extends OrganicMeshOptions {
  /** Outer radius of the wall. Default: 1 */
  outerRadius?: number;
  /** Inner radius of the wall. Default: outerRadius - thickness */
  innerRadius?: number;
  /** Wall thickness, used when innerRadius is not given. Default: 0.1 * outerRadius */
  thickness?: number;
  /** Per-axis scale [x, y, z] that turns the sphere into an ellipsoid. Default: [1, 1, 1] */
  scale?: Vector3Tuple;
  /** Cut mode. Default: 'plane' */
  cut?: Shell3DCut;
  /** Normal of the cut plane, or the axis of the wedge (Manim's up, +Z, by default). Default: [0, 0, 1] */
  cutDirection?: Vector3Tuple;
  /**
   * Plane cut only: plane position along cutDirection, as a fraction of the
   * outer radius. Must satisfy |cutOffset * outerRadius| < innerRadius. Default: 0.3
   */
  cutOffset?: number;
  /**
   * Wedge cut only: start azimuth of the removed wedge in radians, measured
   * right-handed about cutDirection. Azimuth 0 is the image of +X under the
   * rotation that takes +Y onto cutDirection (for the default +Z axis: +X,
   * and PI / 2 is +Y). Default: -PI / 4
   */
  wedgeStart?: number;
  /** Wedge cut only: angle of the removed wedge in radians. Default: PI / 2 */
  wedgeAngle?: number;
  /** Color of the inner face. Default: the main color */
  innerColor?: string;
  /** Color of the flat cut rim (the visible wall band). Default: the main color */
  rimColor?: string;
  /** Segments around the full circle. Default: 64 */
  segments?: number;
}

/** Throw when the wall radii or the plane cut cannot form a closed shell. */
function validateShell(outer: number, inner: number, cut: Shell3DCut, cutOffset: number): void {
  if (!(inner > 0 && inner < outer)) {
    throw new Error(
      `Shell3D requires 0 < innerRadius < outerRadius, received inner ${inner}, outer ${outer}.`,
    );
  }
  if (cut === 'plane' && Math.abs(cutOffset * outer) >= inner) {
    throw new Error(
      `Shell3D plane cut must cross the inner wall: |cutOffset * outerRadius| < innerRadius (received ${cutOffset}).`,
    );
  }
}

/** Point on the unit sphere at polar angle theta (from +Y) and azimuth phi. */
function dir(theta: number, phi: number): Vector3Tuple {
  const s = Math.sin(theta);
  return [s * Math.cos(phi), Math.cos(theta), s * Math.sin(phi)];
}

/**
 * Shell3D - a sphere or ellipsoid wall with real thickness, cut open.
 *
 * The cut face is flat and closed, so the wall thickness reads as a band, like
 * the membrane rim of a cutaway cell. The mesh is watertight: outer surface,
 * inner surface and cut faces share their boundary positions. Normals are
 * smooth on the curved surfaces and hard at the rim. Material slots: 0 outer
 * (`color`), 1 inner (`innerColor`), 2 rim (`rimColor`). Principal axis for the
 * build-up reveal: `cutDirection` (the bottom grows first, the rim last); the
 * reveal order is sorted inside each material slot.
 *
 * A translucent Shell3D (opacity < 1) gets the depth prepass of the organic
 * base class, so opaque mobjects inside it stay visible and the inner wall
 * does not blend over the outer wall.
 *
 * @example
 * ```typescript
 * // A cell membrane bowl, flattened, with a lighter rim band.
 * const membrane = new Shell3D({
 *   outerRadius: 3, thickness: 0.15, scale: [1, 1, 0.6], cutOffset: 0.2,
 *   color: '#e9a27a', innerColor: '#f6ead8', rimColor: '#f3c79f',
 * });
 * // A nucleus with a round window facing the camera.
 * const nucleus = new Shell3D({ outerRadius: 1, thickness: 0.12, cutDirection: [0, -1, 0.4], cutOffset: 0.55 });
 * ```
 */
export class Shell3D extends OrganicMesh3D {
  private _outerRadius: number;
  private _innerRadius: number;
  private _scale: Vector3Tuple;
  private _cut: Shell3DCut;
  private _cutDirection: Vector3Tuple;
  private _cutOffset: number;
  private _wedgeStart: number;
  private _wedgeAngle: number;
  private _innerColor: string | undefined;
  private _rimColor: string | undefined;
  private _segments: number;

  constructor(options: Shell3DOptions = {}) {
    super(options, '#F0AC5F');
    const {
      outerRadius = 1,
      thickness = 0.1 * outerRadius,
      innerRadius = outerRadius - thickness,
      scale = [1, 1, 1],
      cut = 'plane',
      cutDirection = [0, 0, 1],
      cutOffset = 0.3,
      wedgeStart = -Math.PI / 4,
      wedgeAngle = Math.PI / 2,
      innerColor,
      rimColor,
      segments = 64,
    } = options;
    requireNumber('Shell3D', 'outerRadius', outerRadius, 0, true);
    requireNumber('Shell3D', 'cutOffset', cutOffset);
    scale.forEach((v, i) => requireNumber('Shell3D', `scale[${i}]`, v, 0, true));
    validateShell(outerRadius, innerRadius, cut, cutOffset);
    this._outerRadius = outerRadius;
    this._innerRadius = innerRadius;
    this._scale = [...scale];
    this._cut = cut;
    this._cutDirection = [...cutDirection];
    this._cutOffset = cutOffset;
    this._wedgeStart = wedgeStart;
    this._wedgeAngle = Math.min(Math.max(wedgeAngle, 1e-3), 2 * Math.PI - 1e-3);
    this._innerColor = innerColor;
    this._rimColor = rimColor;
    this._segments = Math.max(8, Math.floor(segments));
  }

  protected override _slotColors(): (string | undefined)[] {
    return this._innerColor === undefined && this._rimColor === undefined
      ? []
      : [this._innerColor, this._rimColor];
  }

  /** Canonical frame: cut normal / wedge axis is +Y, then rotate and scale. */
  private _placer(): (p: Vector3Tuple, n: Vector3Tuple) => [Vector3Tuple, Vector3Tuple] {
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(...this._cutDirection).normalize(),
    );
    const s = this._scale;
    const v = new THREE.Vector3();
    return (p, n) => {
      v.set(p[0], p[1], p[2]).applyQuaternion(q);
      const pos: Vector3Tuple = [v.x * s[0], v.y * s[1], v.z * s[2]];
      // Normals transform by the inverse transpose: S^-1 for a scale.
      v.set(n[0], n[1], n[2]).applyQuaternion(q);
      v.set(v.x / s[0], v.y / s[1], v.z / s[2]).normalize();
      return [pos, [v.x, v.y, v.z]];
    };
  }

  protected _buildGeometry(): THREE.BufferGeometry {
    const builder = new MeshBuilder();
    if (this._cut === 'plane') this._buildPlaneCut(builder);
    else this._buildWedgeCut(builder);
    // Reveal grows from the bottom pole toward the cut, along cutDirection.
    return builder.build(this._cutDirection);
  }

  private _buildPlaneCut(b: MeshBuilder): void {
    const place = this._placer();
    const R = this._outerRadius;
    const r = this._innerRadius;
    const h = this._cutOffset * R;
    const nPhi = this._segments;
    const add = (p: Vector3Tuple, n: Vector3Tuple) => b.vertex(...place(p, n));

    // One spherical cap surface from the cut row down to the bottom pole.
    const surface = (radius: number, sign: 1 | -1): { top: number[] } => {
      const theta0 = Math.acos(h / radius);
      const rows = Math.max(2, Math.round(((Math.PI - theta0) / Math.PI) * (nPhi / 2)));
      const rings: number[][] = [];
      for (let k = 0; k < rows; k++) {
        const theta = theta0 + ((Math.PI - theta0) * k) / rows;
        const ring: number[] = [];
        for (let i = 0; i < nPhi; i++) {
          const d = dir(theta, (2 * Math.PI * i) / nPhi);
          ring.push(
            add(
              [d[0] * radius, d[1] * radius, d[2] * radius],
              [sign * d[0], sign * d[1], sign * d[2]],
            ),
          );
        }
        rings.push(ring);
      }
      const pole = add([0, -radius, 0], [0, -sign, 0]);
      for (let k = 0; k + 1 < rings.length; k++) b.band(rings[k], rings[k + 1], true, sign < 0);
      b.fan(pole, rings[rings.length - 1], sign < 0);
      return { top: rings[0] };
    };

    b.setGroup(0);
    surface(R, 1);
    b.setGroup(1);
    surface(r, -1);

    // Flat annulus rim at y = h, with its own vertices (hard edge).
    b.setGroup(2);
    const up: Vector3Tuple = [0, 1, 0];
    const rhoOuter = Math.sqrt(R * R - h * h);
    const rhoInner = Math.sqrt(r * r - h * h);
    const outerRing: number[] = [];
    const innerRing: number[] = [];
    for (let i = 0; i < nPhi; i++) {
      const phi = (2 * Math.PI * i) / nPhi;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      outerRing.push(add([rhoOuter * c, h, rhoOuter * s], up));
      innerRing.push(add([rhoInner * c, h, rhoInner * s], up));
    }
    const facing = place([0, 0, 0], up)[1];
    for (let i = 0; i < nPhi; i++) {
      const j = (i + 1) % nPhi;
      b.triFacing(outerRing[i], outerRing[j], innerRing[j], facing);
      b.triFacing(outerRing[i], innerRing[j], innerRing[i], facing);
    }
  }

  private _buildWedgeCut(b: MeshBuilder): void {
    const place = this._placer();
    const R = this._outerRadius;
    const r = this._innerRadius;
    const keep = 2 * Math.PI - this._wedgeAngle;
    // The canonical azimuth runs clockwise around the axis after the Y -> axis
    // rotation, so negate it: the user azimuth turns right-handed about
    // cutDirection. Kept range [-start, -start + keep] skips the wedge.
    const phiStart = -this._wedgeStart;
    const cols = Math.max(2, Math.round((keep / (2 * Math.PI)) * this._segments));
    const rows = Math.max(4, Math.round(this._segments / 2));
    const add = (p: Vector3Tuple, n: Vector3Tuple) => b.vertex(...place(p, n));
    const thetaAt = (k: number) => (Math.PI * k) / rows;
    const phiAt = (i: number) => phiStart + (keep * i) / cols;

    const surface = (radius: number, sign: 1 | -1): void => {
      const rings: number[][] = [];
      for (let k = 1; k < rows; k++) {
        const ring: number[] = [];
        for (let i = 0; i <= cols; i++) {
          const d = dir(thetaAt(k), phiAt(i));
          ring.push(
            add(
              [d[0] * radius, d[1] * radius, d[2] * radius],
              [sign * d[0], sign * d[1], sign * d[2]],
            ),
          );
        }
        rings.push(ring);
      }
      const top = add([0, radius, 0], [0, sign, 0]);
      const bottom = add([0, -radius, 0], [0, -sign, 0]);
      const flip = sign < 0;
      const first = rings[0];
      const last = rings[rings.length - 1];
      for (let i = 0; i < cols; i++) {
        // Top pole: the pole sits "before" the first ring in theta.
        if (flip) b.tri(top, first[i], first[i + 1]);
        else b.tri(top, first[i + 1], first[i]);
        if (flip) b.tri(bottom, last[i + 1], last[i]);
        else b.tri(bottom, last[i], last[i + 1]);
      }
      for (let k = 0; k + 1 < rings.length; k++) b.band(rings[k], rings[k + 1], false, flip);
    };

    b.setGroup(0);
    surface(R, 1);
    b.setGroup(1);
    surface(r, -1);

    // Two flat half-annulus cut faces on the meridian planes.
    b.setGroup(2);
    const cutFace = (phi: number, outwardSign: 1 | -1): void => {
      const normal: Vector3Tuple = [-Math.sin(phi) * outwardSign, 0, Math.cos(phi) * outwardSign];
      const outer: number[] = [];
      const inner: number[] = [];
      for (let k = 0; k <= rows; k++) {
        const d = dir(thetaAt(k), phi);
        outer.push(add([d[0] * R, d[1] * R, d[2] * R], normal));
        inner.push(add([d[0] * r, d[1] * r, d[2] * r], normal));
      }
      const facing = place([0, 0, 0], normal)[1];
      for (let k = 0; k < rows; k++) {
        b.triFacing(outer[k], outer[k + 1], inner[k + 1], facing);
        b.triFacing(outer[k], inner[k + 1], inner[k], facing);
      }
    };
    cutFace(phiAt(0), -1);
    cutFace(phiAt(cols), 1);
  }

  /** The outer radius. */
  getOuterRadius(): number {
    return this._outerRadius;
  }

  /** The inner radius. */
  getInnerRadius(): number {
    return this._innerRadius;
  }

  override copy(): Shell3D {
    const copy = new Shell3D({
      outerRadius: this._outerRadius,
      innerRadius: this._innerRadius,
      scale: this._scale,
      cut: this._cut,
      cutDirection: this._cutDirection,
      cutOffset: this._cutOffset,
      wedgeStart: this._wedgeStart,
      wedgeAngle: this._wedgeAngle,
      innerColor: this._innerColor,
      rimColor: this._rimColor,
      segments: this._segments,
      color: this.color,
      opacity: this._opacity,
      center: this._centerPoint,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
