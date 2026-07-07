import * as THREE from "three";
import { Mobject } from "../../core/Mobject";
import { PMobject, PointData } from "../../mobjects/point/PMobject";
import { Animation } from "../Animation";
import { lerpPoint } from "../../utils/math";
import { MorphStrategy } from "./MorphStrategy";

/**
 * Morphs one point cloud (PMobject) into another by interpolating every point's
 * position, color and opacity, plus the mobject's own transform.
 *
 * PMobjects are not VMobjects: they carry a flat list of points (no bezier
 * anchors, no subpaths, no fill/stroke), so {@link PointMorphStrategy} cannot
 * handle them. This is the point-cloud analogue.
 *
 * Point-count mismatch is resolved by padding the shorter cloud with copies of
 * its last point (or the origin when empty), so source and target align index
 * by index for the whole animation.
 */
const scratchStart = new THREE.Color();
const scratchTarget = new THREE.Color();

function clonePoint(p: PointData): PointData {
  return {
    position: [...p.position] as [number, number, number],
    color: p.color,
    opacity: p.opacity,
  };
}

/** Pad both clouds to the same length by repeating each one's last point. */
function alignPointCounts(
  a: PointData[],
  b: PointData[],
): [PointData[], PointData[]] {
  const n = Math.max(a.length, b.length);
  const pad = (pts: PointData[]): PointData[] => {
    if (pts.length === n) return pts.map(clonePoint);
    const filler = pts.length > 0
      ? pts[pts.length - 1]
      : { position: [0, 0, 0] as [number, number, number] };
    const out = pts.map(clonePoint);
    while (out.length < n) out.push(clonePoint(filler));
    return out;
  };
  return [pad(a), pad(b)];
}

function lerpPointData(
  start: PointData,
  target: PointData,
  alpha: number,
): PointData {
  const position = lerpPoint(start.position, target.position, alpha) as [
    number,
    number,
    number,
  ];

  let color = target.color ?? start.color;
  if (start.color && target.color && start.color !== target.color) {
    scratchStart.set(start.color);
    scratchTarget.set(target.color);
    color = "#" +
      scratchStart.clone().lerp(scratchTarget, alpha).getHexString();
  }

  const sa = start.opacity ?? 1;
  const ta = target.opacity ?? 1;
  const opacity = sa + (ta - sa) * alpha;

  return { position, color, opacity };
}

export class PointCloudMorphStrategy implements MorphStrategy {
  private _startPoints: PointData[] = [];
  private _targetPoints: PointData[] = [];
  private _finalTargetPoints: PointData[] = [];
  private _startPosition = new THREE.Vector3();
  private _targetPosition = new THREE.Vector3();
  private _startRotation = new THREE.Euler();
  private _targetRotation = new THREE.Euler();
  private _startScale = new THREE.Vector3(1, 1, 1);
  private _targetScale = new THREE.Vector3(1, 1, 1);

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    if (!(source instanceof PMobject) || !(target instanceof PMobject)) {
      throw new Error("PointCloudMorphStrategy requires PMobject inputs");
    }

    // Target's real final geometry, captured before any padding.
    this._finalTargetPoints = target.getLocalPoints().map(clonePoint);

    const [start, end] = alignPointCounts(
      source.getLocalPoints(),
      target.getLocalPoints(),
    );
    this._startPoints = start;
    this._targetPoints = end;

    this._startPosition.copy(source.position);
    this._targetPosition.copy(target.position);
    this._startRotation.copy(source.rotation);
    this._targetRotation.copy(target.rotation);
    this._startScale.copy(source.scaleVector);
    this._targetScale.copy(target.scaleVector);

    // Start from the padded source cloud so point count stays constant.
    source.clearPoints();
    source.addPoints(this._startPoints);
  }

  interpolate(
    _animation: Animation,
    source: Mobject,
    _target: Mobject,
    alpha: number,
  ): void {
    const pmob = source as PMobject;
    const interpolated = this._startPoints.map((start, i) =>
      lerpPointData(start, this._targetPoints[i], alpha)
    );
    pmob.clearPoints();
    pmob.addPoints(interpolated);
    pmob.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
    pmob.rotation.set(
      this._startRotation.x +
        (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y +
        (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z +
        (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    pmob.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);
    pmob._markDirty();
  }

  finish(_animation: Animation, source: Mobject, _target: Mobject): void {
    const pmob = source as PMobject;
    pmob.clearPoints();
    pmob.addPoints(this._finalTargetPoints);
    pmob.position.copy(this._targetPosition);
    pmob.rotation.copy(this._targetRotation);
    pmob.scaleVector.copy(this._targetScale);
    pmob._markDirty();
  }
}
