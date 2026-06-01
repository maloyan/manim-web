import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface AnnularSectorOptions {
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  angle?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  center?: Vector3Tuple;
  numComponents?: number;
}

export class AnnularSector extends VMobject {
  private _innerRadius: number;
  private _outerRadius: number;
  private _startAngle: number;
  private _angle: number;
  private _numComponents: number;

  constructor(options: AnnularSectorOptions = {}) {
    super();
    const {
      innerRadius = 0.5,
      outerRadius = 1,
      startAngle = 0,
      angle = Math.PI / 2,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;
    this._innerRadius = innerRadius;
    this._outerRadius = outerRadius;
    this._startAngle = startAngle;
    this._angle = angle;
    this._numComponents = numComponents;
    this.position.set(center[0], center[1], center[2]);
    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;
    this._generatePoints();
  }

  private _generatePoints(): void {
    const points: number[][] = [];
    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(this._angle) / (Math.PI / 2)) * (this._numComponents / 4)),
    );
    const segmentAngle = this._angle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    const addArcSegment = (radius: number, theta1: number, theta2: number, isFirst: boolean) => {
      const x0 = radius * Math.cos(theta1);
      const y0 = radius * Math.sin(theta1);
      const x3 = radius * Math.cos(theta2);
      const y3 = radius * Math.sin(theta2);
      const x1 = x0 + kappa * radius * -Math.sin(theta1);
      const y1 = y0 + kappa * radius * Math.cos(theta1);
      const x2 = x3 - kappa * radius * -Math.sin(theta2);
      const y2 = y3 - kappa * radius * Math.cos(theta2);
      if (isFirst) points.push([x0, y0, 0]);
      points.push([x1, y1, 0]);
      points.push([x2, y2, 0]);
      points.push([x3, y3, 0]);
    };

    const addLineSegment = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, 0]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, 0]);
      points.push([...p1]);
    };

    for (let i = 0; i < numSegments; i++) {
      addArcSegment(
        this._outerRadius,
        this._startAngle + i * segmentAngle,
        this._startAngle + (i + 1) * segmentAngle,
        i === 0,
      );
    }

    const endAngle = this._startAngle + this._angle;
    addLineSegment(
      [this._outerRadius * Math.cos(endAngle), this._outerRadius * Math.sin(endAngle), 0],
      [this._innerRadius * Math.cos(endAngle), this._innerRadius * Math.sin(endAngle), 0],
    );

    for (let i = numSegments - 1; i >= 0; i--) {
      addArcSegment(
        this._innerRadius,
        this._startAngle + (i + 1) * segmentAngle,
        this._startAngle + i * segmentAngle,
        false,
      );
    }

    addLineSegment(
      [
        this._innerRadius * Math.cos(this._startAngle),
        this._innerRadius * Math.sin(this._startAngle),
        0,
      ],
      [
        this._outerRadius * Math.cos(this._startAngle),
        this._outerRadius * Math.sin(this._startAngle),
        0,
      ],
    );

    this.setPoints3D(points);
  }

  override getCenter(): Vector3Tuple {
    return this._parentLocalToWorld([this.position.x, this.position.y, this.position.z]);
  }

  getInnerRadius(): number {
    return this._innerRadius;
  }
  setInnerRadius(value: number): this {
    this._innerRadius = value;
    this._generatePoints();
    return this;
  }
  getOuterRadius(): number {
    return this._outerRadius;
  }
  setOuterRadius(value: number): this {
    this._outerRadius = value;
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
    return this.getCenter();
  }
  getArea(): number {
    return (Math.abs(this._angle) / 2) * (this._outerRadius ** 2 - this._innerRadius ** 2);
  }

  override copy(): AnnularSector {
    const clone = new AnnularSector({
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
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
