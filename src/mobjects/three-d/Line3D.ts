import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';

/**
 * Options for creating a Line3D
 */
export interface Line3DOptions {
  /** Start point [x, y, z]. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point [x, y, z]. Required */
  end: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Line width in CSS pixels. Default: 2 */
  lineWidth?: number;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
}

/**
 * Line3D - A 3D line segment with configurable pixel width.
 *
 * Rendered via Three.js `Line2` + `LineMaterial`, so `lineWidth` is
 * honored on every WebGL platform (unlike `THREE.LineBasicMaterial`).
 *
 * @example
 * ```typescript
 * const line = new Line3D({ end: [1, 1, 1], lineWidth: 8 });
 * ```
 */
export class Line3D extends Mobject {
  protected _start: Vector3Tuple;
  protected _end: Vector3Tuple;
  // Default resolution comes from the VMobject class statics, which Scene
  // keeps in sync with the active renderer size. This avoids a hardcoded
  // 800x450 fallback when Scene.add() has not propagated context yet (e.g.
  // when a Line3D is added to a Group already in the scene).
  private _resolutionWidth: number = VMobject._rendererWidth;
  private _resolutionHeight: number = VMobject._rendererHeight;

  constructor(options: Line3DOptions) {
    super();

    const { start = [0, 0, 0], end, color = '#ffffff', lineWidth = 2, opacity = 1 } = options;

    this._start = [...start];
    this._end = [...end];

    this.color = color;
    this._opacity = opacity;
    // strokeWidth on Mobject is the single source of truth for line width so
    // generic styling/animation paths (setStyle, setStrokeWidth) keep working.
    this.strokeWidth = lineWidth;
  }

  protected _createThreeObject(): THREE.Object3D {
    const geometry = new LineGeometry();
    geometry.setPositions(this._buildPositions());

    const material = new LineMaterial({
      color: new THREE.Color(this.color).getHex(),
      opacity: this._opacity,
      transparent: this._opacity < 1,
      linewidth: this.strokeWidth,
      worldUnits: false,
      resolution: new THREE.Vector2(this._resolutionWidth, this._resolutionHeight),
    });

    const line = new Line2(geometry, material);
    line.frustumCulled = false;
    line.computeLineDistances();
    return line;
  }

  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof Line2) {
      const material = this._threeObject.material as LineMaterial;
      if (material) {
        material.color.set(this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.linewidth = this.strokeWidth;
        material.resolution.set(this._resolutionWidth, this._resolutionHeight);
        material.needsUpdate = true;
      }
    }
  }

  protected _updateGeometry(): void {
    if (this._threeObject instanceof Line2) {
      const geometry = this._threeObject.geometry as LineGeometry;
      geometry.setPositions(this._buildPositions());
      this._threeObject.computeLineDistances();
    }
    this._markDirty();
  }

  private _buildPositions(): number[] {
    return [
      this._start[0],
      this._start[1],
      this._start[2],
      this._end[0],
      this._end[1],
      this._end[2],
    ];
  }

  /** @internal */
  override _setSceneContext(
    rendererWidth: number,
    rendererHeight: number,
    _frameWidth: number,
  ): void {
    this._resolutionWidth = rendererWidth;
    this._resolutionHeight = rendererHeight;
    if (this._threeObject instanceof Line2) {
      const material = this._threeObject.material as LineMaterial;
      material?.resolution.set(rendererWidth, rendererHeight);
    }
  }

  getStart(): Vector3Tuple {
    return [...this._start];
  }

  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._updateGeometry();
    return this;
  }

  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._updateGeometry();
    return this;
  }

  getLineWidth(): number {
    return this.strokeWidth;
  }

  setLineWidth(width: number): this {
    this.setStyle({ strokeWidth: width });
    return this;
  }

  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getDirection(): Vector3Tuple {
    const length = this.getLength();
    if (length === 0) {
      return [1, 0, 0];
    }
    return [
      (this._end[0] - this._start[0]) / length,
      (this._end[1] - this._start[1]) / length,
      (this._end[2] - this._start[2]) / length,
    ];
  }

  getMidpoint(): Vector3Tuple {
    return [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
  }

  pointAtParameter(t: number): Vector3Tuple {
    return [
      this._start[0] + t * (this._end[0] - this._start[0]),
      this._start[1] + t * (this._end[1] - this._start[1]),
      this._start[2] + t * (this._end[2] - this._start[2]),
    ];
  }

  override copy(): Line3D {
    this.normalizeTransform();
    const copy = new Line3D({
      start: this._start,
      end: this._end,
      color: this.color,
      lineWidth: this.strokeWidth,
      opacity: this._opacity,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
