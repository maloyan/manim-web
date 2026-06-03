import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';
import * as THREE from 'three';

export interface SectorOptions {
  radius?: number;
  startAngle?: number;
  angle?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  center?: Vector3Tuple;
  numComponents?: number;
}

export class Sector extends VMobject {
  private _radius: number;
  private _startAngle: number;
  private _angle: number;
  private _numComponents: number;
  private _constructionCenter: Vector3Tuple;

  constructor(options: SectorOptions = {}) {
    super();
    const {
      radius = 1,
      startAngle = 0,
      angle = Math.PI / 2,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;
    this._radius = radius;
    this._startAngle = startAngle;
    this._angle = angle;
    this._numComponents = numComponents;
    this.position.set(center[0], center[1], center[2]);
    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;
    this._generatePoints();
    // The sector's center is its apex, a construction point at the local origin.
    // Tracked separately so getSectorCenter() survives normalizeTransform().
    this._constructionCenter = [0, 0, 0];
  }

  private _generatePoints(): void {
    const points: number[][] = [];
    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(this._angle) / (Math.PI / 2)) * (this._numComponents / 4)),
    );
    const segmentAngle = this._angle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    const arcStart = [
      this._radius * Math.cos(this._startAngle),
      this._radius * Math.sin(this._startAngle),
      0,
    ];
    points.push([0, 0, 0]);
    points.push([arcStart[0] / 3, arcStart[1] / 3, 0]);
    points.push([(2 * arcStart[0]) / 3, (2 * arcStart[1]) / 3, 0]);
    points.push([...arcStart]);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = this._startAngle + i * segmentAngle;
      const theta2 = this._startAngle + (i + 1) * segmentAngle;
      const x0 = this._radius * Math.cos(theta1);
      const y0 = this._radius * Math.sin(theta1);
      const x3 = this._radius * Math.cos(theta2);
      const y3 = this._radius * Math.sin(theta2);
      points.push([
        x0 + kappa * this._radius * -Math.sin(theta1),
        y0 + kappa * this._radius * Math.cos(theta1),
        0,
      ]);
      points.push([
        x3 - kappa * this._radius * -Math.sin(theta2),
        y3 - kappa * this._radius * Math.cos(theta2),
        0,
      ]);
      points.push([x3, y3, 0]);
    }

    const endAngle = this._startAngle + this._angle;
    const arcEnd = [this._radius * Math.cos(endAngle), this._radius * Math.sin(endAngle), 0];
    points.push([arcEnd[0] + -arcEnd[0] / 3, arcEnd[1] + -arcEnd[1] / 3, 0]);
    points.push([arcEnd[0] + (2 * -arcEnd[0]) / 3, arcEnd[1] + (2 * -arcEnd[1]) / 3, 0]);
    points.push([0, 0, 0]);

    this.setPoints3D(points);
  }

  getRadius(): number {
    return this._radius;
  }
  setRadius(value: number): this {
    this._radius = value;
    this._generatePoints();
    return this;
  }
  getStartAngle(): number {
    return this._startAngle;
  }
  setStartAngle(value: number): this {
    this._startAngle = value;
    this._generatePoints();
    return this;
  }
  getAngle(): number {
    return this._angle;
  }
  setAngle(value: number): this {
    this._angle = value;
    this._generatePoints();
    return this;
  }
  getSectorCenter(): Vector3Tuple {
    return this._parentLocalToWorld(this._constructionCenter);
  }
  getArea(): number {
    return (Math.abs(this._angle) / 2) * this._radius ** 2;
  }
  getArcLength(): number {
    return Math.abs(this._radius * this._angle);
  }

  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    this._constructionCenter = new THREE.Vector3(...this._constructionCenter)
      .applyMatrix4(worldMatrix)
      .toArray();
    super.normalizeTransform(worldMatrix);
    return this;
  }

  override copy(): Sector {
    const clone = new Sector({
      radius: this._radius,
      startAngle: this._startAngle,
      angle: this._angle,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
