import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating an Arrow3D
 */
export interface Arrow3DOptions {
  /** Start point [x, y, z]. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point (where the tip points) [x, y, z]. Required */
  end: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Length of the arrowhead cone. Default: 0.2 */
  tipLength?: number;
  /** Radius of the arrowhead cone. Default: 0.08 */
  tipRadius?: number;
  /** Radius of the shaft. Default: 0.02 */
  shaftRadius?: number;
  /** Number of radial segments. Default: 16 */
  radialSegments?: number;
}

/**
 * Arrow3D - A 3D arrow with cylindrical shaft and conical tip
 *
 * Creates a 3D arrow by combining a cylinder (shaft) with a cone (tip).
 * The arrow automatically orients itself from start to end point.
 *
 * @example
 * ```typescript
 * // Create an arrow from origin to (2, 1, 0)
 * const arrow = new Arrow3D({ end: [2, 1, 0] });
 *
 * // Create a red arrow with larger tip
 * const redArrow = new Arrow3D({
 *   start: [-1, 0, 0],
 *   end: [1, 1, 1],
 *   color: '#ff0000',
 *   tipLength: 0.3,
 *   tipRadius: 0.12
 * });
 * ```
 */
export class Arrow3D extends Mobject {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _tipLength: number;
  private _tipRadius: number;
  private _shaftRadius: number;
  private _radialSegments: number;

  constructor(options: Arrow3DOptions) {
    super();

    const {
      start = [0, 0, 0],
      end,
      color = '#ffffff',
      opacity = 1,
      tipLength = 0.2,
      tipRadius = 0.08,
      shaftRadius = 0.02,
      radialSegments = 16,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._tipLength = tipLength;
    this._tipRadius = tipRadius;
    this._shaftRadius = shaftRadius;
    this._radialSegments = radialSegments;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  /**
   * Create the Three.js arrow object (shaft + tip)
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Calculate direction and length
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    const totalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (totalLength === 0) {
      return group;
    }

    // Direction vector
    const dir = new THREE.Vector3(dx, dy, dz).normalize();

    // Shaft length (total - tip)
    const shaftLength = Math.max(0, totalLength - this._tipLength);

    // Create material (unlit so color renders exactly as specified,
    // matching Python Manim's flat-shaded axes appearance)
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
    });

    // Create shaft (cylinder)
    if (shaftLength > 0) {
      const shaftGeometry = new THREE.CylinderGeometry(
        this._shaftRadius,
        this._shaftRadius,
        shaftLength,
        this._radialSegments,
      );
      const shaft = new THREE.Mesh(shaftGeometry, material.clone());

      // Position shaft: center it at midpoint of shaft segment
      const shaftCenter = new THREE.Vector3(
        this._start[0] + (dir.x * shaftLength) / 2,
        this._start[1] + (dir.y * shaftLength) / 2,
        this._start[2] + (dir.z * shaftLength) / 2,
      );
      shaft.position.copy(shaftCenter);

      // Orient shaft
      this._orientMesh(shaft, dir);

      group.add(shaft);
    }

    // Create tip as two perpendicular flat triangles (cross formation).
    // This matches Python Manim's 2D ArrowTriangleFilledTip appearance:
    // visible from any camera angle, never shows as a circle like a cone.
    const tipBase = new THREE.Vector3(
      this._end[0] - dir.x * this._tipLength,
      this._end[1] - dir.y * this._tipLength,
      this._end[2] - dir.z * this._tipLength,
    );

    // Get two perpendicular vectors for the cross formation
    const worldUp = new THREE.Vector3(0, 1, 0);
    const side1 = new THREE.Vector3().crossVectors(dir, worldUp);
    if (side1.lengthSq() < 0.001) {
      side1.crossVectors(dir, new THREE.Vector3(1, 0, 0));
    }
    side1.normalize();
    const side2 = new THREE.Vector3().crossVectors(dir, side1).normalize();

    const s1 = side1.clone().multiplyScalar(this._tipRadius);
    const s2 = side2.clone().multiplyScalar(this._tipRadius);

    // Two triangles at 90° to each other
    const tipGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Triangle 1 (in dir×worldUp plane)
      this._end[0],
      this._end[1],
      this._end[2],
      tipBase.x - s1.x,
      tipBase.y - s1.y,
      tipBase.z - s1.z,
      tipBase.x + s1.x,
      tipBase.y + s1.y,
      tipBase.z + s1.z,
      // Triangle 2 (perpendicular plane)
      this._end[0],
      this._end[1],
      this._end[2],
      tipBase.x - s2.x,
      tipBase.y - s2.y,
      tipBase.z - s2.z,
      tipBase.x + s2.x,
      tipBase.y + s2.y,
      tipBase.z + s2.z,
    ]);
    tipGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    tipGeometry.computeVertexNormals();

    const tipMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    group.add(tip);

    return group;
  }

  /**
   * Orient a mesh to point in a given direction
   * Cylinders and cones in Three.js are oriented along the Y axis by default
   */
  private _orientMesh(mesh: THREE.Mesh, direction: THREE.Vector3): void {
    // Default up direction for cylinders/cones in Three.js
    const up = new THREE.Vector3(0, 1, 0);

    // Calculate rotation quaternion
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction);

    mesh.quaternion.copy(quaternion);
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Group) {
      this._threeObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshBasicMaterial;
          if (material) {
            material.color.set(this.color);
            material.opacity = this._opacity;
            material.transparent = this._opacity < 1;
            material.needsUpdate = true;
          }
        }
      });
    }
  }

  /**
   * Rebuild the arrow geometry
   */
  private _rebuildGeometry(): void {
    if (this._threeObject) {
      // Dispose old geometry
      this._threeObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }

    // Create new Three object
    this._threeObject = this._createThreeObject();
    this._markDirty();
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Set the start point
   */
  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get the end point (tip of the arrow)
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Set the end point (tip of the arrow)
   */
  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get the tip length
   */
  getTipLength(): number {
    return this._tipLength;
  }

  /**
   * Set the tip length
   */
  setTipLength(value: number): this {
    this._tipLength = value;
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get the tip radius
   */
  getTipRadius(): number {
    return this._tipRadius;
  }

  /**
   * Set the tip radius
   */
  setTipRadius(value: number): this {
    this._tipRadius = value;
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get the shaft radius
   */
  getShaftRadius(): number {
    return this._shaftRadius;
  }

  /**
   * Set the shaft radius
   */
  setShaftRadius(value: number): this {
    this._shaftRadius = value;
    this._rebuildGeometry();
    return this;
  }

  /**
   * Get the length of the arrow
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the direction vector (normalized)
   */
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

  /**
   * Get the midpoint of the arrow
   */
  getMidpoint(): Vector3Tuple {
    return [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
  }

  /**
   * Create a copy of this Arrow3D
   */
  protected override _createCopy(): Arrow3D {
    return new Arrow3D({
      start: this._start,
      end: this._end,
      color: this.color,
      opacity: this._opacity,
      tipLength: this._tipLength,
      tipRadius: this._tipRadius,
      shaftRadius: this._shaftRadius,
      radialSegments: this._radialSegments,
    });
  }
}

/**
 * Vector3D - An Arrow3D starting from the origin by default
 */
export class Vector3D extends Arrow3D {
  constructor(options: Omit<Arrow3DOptions, 'start'> & { direction?: Vector3Tuple }) {
    const { direction, end, ...rest } = options;
    super({
      ...rest,
      start: [0, 0, 0],
      end: direction ?? end,
    });
  }
}

export default Arrow3D;
