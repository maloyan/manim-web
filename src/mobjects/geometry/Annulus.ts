import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

export interface AnnulusOptions {
  innerRadius?: number;
  outerRadius?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  center?: Vector3Tuple;
  numComponents?: number;
}

export class Annulus extends VMobject {
  private _innerRadius: number;
  private _outerRadius: number;
  private _numComponents: number;

  constructor(options: AnnulusOptions = {}) {
    super();
    const {
      innerRadius = 0.5,
      outerRadius = 1,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;
    this._innerRadius = innerRadius;
    this._outerRadius = outerRadius;
    this._numComponents = numComponents;
    this.position.set(center[0], center[1], center[2]);
    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;
    this._generatePoints();
  }

  private _generatePoints(): void {
    const kappa = (4 / 3) * (Math.SQRT2 - 1);
    const points: number[][] = [];
    const outerR = this._outerRadius;
    const innerR = this._innerRadius;

    points.push([outerR, 0, 0]);
    points.push([outerR, outerR * kappa, 0]);
    points.push([outerR * kappa, outerR, 0]);
    points.push([0, outerR, 0]);
    points.push([-outerR * kappa, outerR, 0]);
    points.push([-outerR, outerR * kappa, 0]);
    points.push([-outerR, 0, 0]);
    points.push([-outerR, -outerR * kappa, 0]);
    points.push([-outerR * kappa, -outerR, 0]);
    points.push([0, -outerR, 0]);
    points.push([outerR * kappa, -outerR, 0]);
    points.push([outerR, -outerR * kappa, 0]);
    points.push([outerR, 0, 0]);

    const dx = innerR - outerR;
    points.push([outerR + dx / 3, 0, 0]);
    points.push([outerR + (2 * dx) / 3, 0, 0]);
    points.push([innerR, 0, 0]);

    points.push([innerR, -innerR * kappa, 0]);
    points.push([innerR * kappa, -innerR, 0]);
    points.push([0, -innerR, 0]);
    points.push([-innerR * kappa, -innerR, 0]);
    points.push([-innerR, -innerR * kappa, 0]);
    points.push([-innerR, 0, 0]);
    points.push([-innerR, innerR * kappa, 0]);
    points.push([-innerR * kappa, innerR, 0]);
    points.push([0, innerR, 0]);
    points.push([innerR * kappa, innerR, 0]);
    points.push([innerR, innerR * kappa, 0]);
    points.push([innerR, 0, 0]);

    points.push([innerR - dx / 3, 0, 0]);
    points.push([innerR - (2 * dx) / 3, 0, 0]);
    points.push([outerR, 0, 0]);

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
  getAnnulusCenter(): Vector3Tuple {
    return this.getCenter();
  }
  setAnnulusCenter(value: Vector3Tuple): this {
    this.position.set(value[0], value[1], value[2]);
    this._markDirty();
    return this;
  }
  getArea(): number {
    return Math.PI * (this._outerRadius ** 2 - this._innerRadius ** 2);
  }
  getThickness(): number {
    return this._outerRadius - this._innerRadius;
  }

  override copy(): Annulus {
    const clone = new Annulus({
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
