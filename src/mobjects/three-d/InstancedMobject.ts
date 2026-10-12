import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from './Mobject3D';

/**
 * A single instance of the shared template geometry.
 *
 * `position` is required. `rotation` is a Euler tuple in radians (`XYZ` order).
 * `scale` is a uniform factor or a per-axis tuple. `color` is a CSS color string
 * applied to this instance only; omit it to keep the material color.
 */
export interface InstanceTransform {
  /** Instance position [x, y, z]. */
  position: Vector3Tuple;
  /** Euler rotation [x, y, z] in radians (XYZ order). Default: no rotation. */
  rotation?: Vector3Tuple;
  /** Uniform scale, or per-axis [x, y, z] scale. Default: 1. */
  scale?: number | Vector3Tuple;
  /** Per-instance CSS color. Default: inherit the material color. */
  color?: string;
}

/**
 * Options for creating an {@link InstancedMobject}.
 *
 * Provide a template as either an explicit `geometry` + `material`, or a
 * `template` mobject to derive both from. If none is given, a unit box with a
 * standard material is used.
 */
export interface InstancedMobjectOptions {
  /** Geometry shared by every instance. Cloned on {@link InstancedMobject.copy}. */
  geometry?: THREE.BufferGeometry;
  /** Material shared by every instance. Cloned on {@link InstancedMobject.copy}. */
  material?: THREE.Material;
  /** Template mobject to derive geometry and material from (cloned, not kept). */
  template?: Mobject;
  /** Per-instance transforms. Default: empty (no instances). */
  instances?: InstanceTransform[];
  /** Base material color as a CSS color string. Default: '#ffffff'. */
  color?: string;
  /** Material opacity from 0 to 1. Default: 1. */
  opacity?: number;
}

const SCRATCH_POS = new THREE.Vector3();
const SCRATCH_SCALE = new THREE.Vector3(1, 1, 1);
const SCRATCH_EULER = new THREE.Euler();
const SCRATCH_QUAT = new THREE.Quaternion();
const SCRATCH_COLOR = new THREE.Color();

/**
 * InstancedMobject - renders many copies of one template via `THREE.InstancedMesh`.
 *
 * This is a safe, opt-in mobject for large scenes. It draws `count` copies of a
 * single geometry + material in ONE draw call, instead of one mesh per copy.
 * It does not change the default render path: scenes that do not use it are
 * unaffected.
 *
 * Each instance has its own transform (position, optional rotation and scale)
 * and an optional per-instance color. Use {@link setInstances} to replace the
 * whole set, or {@link setInstanceTransform} / {@link setInstanceColor} to
 * update one instance in place.
 *
 * @example
 * ```typescript
 * const dots = new InstancedMobject({
 *   geometry: new THREE.SphereGeometry(0.1, 16, 16),
 *   material: new THREE.MeshStandardMaterial(),
 *   instances: [
 *     { position: [0, 0, 0], color: '#ff0000' },
 *     { position: [1, 0, 0], scale: 2 },
 *   ],
 * });
 * scene.add(dots);
 * ```
 */
export class InstancedMobject extends Mobject3D {
  private _geometry: THREE.BufferGeometry;
  private _material: THREE.Material;
  private _instances: InstanceTransform[];
  /** The single InstancedMesh; null until the Three.js object is built. */
  private _mesh: THREE.InstancedMesh | null = null;

  constructor(options: InstancedMobjectOptions = {}) {
    super();

    const {
      geometry,
      material,
      template,
      instances = [],
      color = '#ffffff',
      opacity = 1,
    } = options;

    const derived = InstancedMobject._resolveTemplate(geometry, material, template, color, opacity);
    this._geometry = derived.geometry;
    this._material = derived.material;
    this._instances = instances.map(InstancedMobject._cloneTransform);

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  /**
   * Resolve the shared geometry and material from the options.
   * Order: explicit geometry/material, then a template mobject, then a default
   * unit box. A geometry or material derived from a template is cloned so the
   * template is never mutated or disposed by this mobject.
   */
  private static _resolveTemplate(
    geometry: THREE.BufferGeometry | undefined,
    material: THREE.Material | undefined,
    template: Mobject | undefined,
    color: string,
    opacity: number,
  ): { geometry: THREE.BufferGeometry; material: THREE.Material } {
    if (geometry && material) {
      return { geometry, material };
    }
    if (template) {
      const mesh = InstancedMobject._findMesh(template.getThreeObject());
      if (mesh) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        return {
          geometry: geometry ?? mesh.geometry.clone(),
          material: material ?? mat.clone(),
        };
      }
    }
    return {
      geometry: geometry ?? new THREE.BoxGeometry(1, 1, 1),
      material:
        material ??
        new THREE.MeshStandardMaterial({
          color,
          opacity,
          transparent: opacity < 1,
          side: THREE.DoubleSide,
        }),
    };
  }

  /** Find the first Mesh in a Three.js subtree, or null if there is none. */
  private static _findMesh(root: THREE.Object3D): THREE.Mesh | null {
    let found: THREE.Mesh | null = null;
    root.traverse((object) => {
      if (!found && object instanceof THREE.Mesh) found = object;
    });
    return found;
  }

  /** Deep-copy one instance transform so callers cannot alias our state. */
  private static _cloneTransform(t: InstanceTransform): InstanceTransform {
    const clone: InstanceTransform = { position: [...t.position] };
    if (t.rotation) clone.rotation = [...t.rotation];
    if (t.scale !== undefined) clone.scale = Array.isArray(t.scale) ? [...t.scale] : t.scale;
    if (t.color !== undefined) clone.color = t.color;
    return clone;
  }

  /**
   * Build the InstancedMesh with `count = instances.length` and fill its matrix
   * and color buffers. Wrapped in a Group so a later count change can swap the
   * mesh without touching the scene-graph parent.
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    this._mesh = this._buildMesh();
    group.add(this._mesh);
    return group;
  }

  /** Create a fresh InstancedMesh for the current instances and populate it. */
  private _buildMesh(): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(this._geometry, this._material, this._instances.length);
    this._writeAllInstances(mesh);
    return mesh;
  }

  /** Write every instance matrix (and color, when present) into `mesh`. */
  private _writeAllInstances(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    let hasColor = false;
    for (let i = 0; i < this._instances.length; i++) {
      const t = this._instances[i];
      mesh.setMatrixAt(i, InstancedMobject._composeMatrix(t, matrix));
      if (t.color !== undefined) {
        mesh.setColorAt(i, SCRATCH_COLOR.set(t.color));
        hasColor = true;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (hasColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  /** Compose a transform matrix for one instance into `out`. */
  private static _composeMatrix(t: InstanceTransform, out: THREE.Matrix4): THREE.Matrix4 {
    SCRATCH_POS.set(t.position[0], t.position[1], t.position[2]);
    const rot = t.rotation ?? [0, 0, 0];
    SCRATCH_EULER.set(rot[0], rot[1], rot[2], 'XYZ');
    SCRATCH_QUAT.setFromEuler(SCRATCH_EULER);
    const s = t.scale ?? 1;
    if (typeof s === 'number') SCRATCH_SCALE.set(s, s, s);
    else SCRATCH_SCALE.set(s[0], s[1], s[2]);
    return out.compose(SCRATCH_POS, SCRATCH_QUAT, SCRATCH_SCALE);
  }

  /** Sync base material color and opacity onto the shared material. */
  protected override _syncMaterialToThree(): void {
    const material = this._material as THREE.MeshStandardMaterial;
    if (material.color) material.color.set(this.color);
    material.opacity = this._opacity;
    material.transparent = this._opacity < 1;
    material.needsUpdate = true;
  }

  /**
   * Replace all instances. Reuses the existing mesh when the count is unchanged;
   * otherwise rebuilds the InstancedMesh (its count is fixed at construction).
   */
  setInstances(instances: InstanceTransform[]): this {
    const sameCount = instances.length === this._instances.length;
    this._instances = instances.map(InstancedMobject._cloneTransform);
    if (this._mesh && sameCount) {
      this._writeAllInstances(this._mesh);
    } else if (this._mesh && this._threeObject) {
      const group = this._threeObject;
      group.remove(this._mesh);
      this._mesh.dispose();
      this._mesh = this._buildMesh();
      group.add(this._mesh);
    }
    this._markDirty();
    return this;
  }

  /** Update one instance transform in place and flag the matrix buffer. */
  setInstanceTransform(index: number, transform: Partial<InstanceTransform>): this {
    this._assertIndex(index);
    const current = this._instances[index];
    if (transform.position) current.position = [...transform.position];
    if (transform.rotation) current.rotation = [...transform.rotation];
    if (transform.scale !== undefined) {
      current.scale = Array.isArray(transform.scale) ? [...transform.scale] : transform.scale;
    }
    if (this._mesh) {
      const matrix = new THREE.Matrix4();
      this._mesh.setMatrixAt(index, InstancedMobject._composeMatrix(current, matrix));
      this._mesh.instanceMatrix.needsUpdate = true;
    }
    this._markDirty();
    return this;
  }

  /** Update one instance color in place and flag the color buffer. */
  setInstanceColor(index: number, color: string): this {
    this._assertIndex(index);
    this._instances[index].color = color;
    if (this._mesh) {
      this._mesh.setColorAt(index, SCRATCH_COLOR.set(color));
      if (this._mesh.instanceColor) this._mesh.instanceColor.needsUpdate = true;
    }
    this._markDirty();
    return this;
  }

  private _assertIndex(index: number): void {
    if (index < 0 || index >= this._instances.length) {
      throw new RangeError(
        `InstancedMobject: instance index ${index} out of range [0, ${this._instances.length}).`,
      );
    }
  }

  /** Number of instances this mobject draws. */
  getInstanceCount(): number {
    return this._instances.length;
  }

  /** The single backing InstancedMesh, building the Three.js object if needed. */
  getInstancedMesh(): THREE.InstancedMesh {
    this.getThreeObject();
    if (!this._mesh) {
      throw new Error('InstancedMobject: InstancedMesh was not built.');
    }
    return this._mesh;
  }

  /** The transform of instance `index` as a Matrix4 (reads back from the mesh). */
  getInstanceMatrix(index: number, out: THREE.Matrix4 = new THREE.Matrix4()): THREE.Matrix4 {
    this._assertIndex(index);
    this.getInstancedMesh().getMatrixAt(index, out);
    return out;
  }

  /** The shared geometry used by every instance. */
  getGeometry(): THREE.BufferGeometry {
    return this._geometry;
  }

  /** The shared material used by every instance. */
  getMaterial(): THREE.Material {
    return this._material;
  }

  /**
   * An instance cloud is empty only when it has no instances. The base
   * {@link Mobject.getCenter} / {@link Mobject.getBounds} then skip the bounding
   * box, which would be empty and throw.
   */
  override isEmpty(): boolean {
    return this._instances.length === 0;
  }

  /** Dispose the InstancedMesh buffers, geometry, and material. No leaks. */
  override dispose(): void {
    if (this._mesh) this._mesh.dispose();
    super.dispose();
    this._geometry.dispose();
    this._material.dispose();
  }

  override copy(): InstancedMobject {
    const copy = new InstancedMobject({
      geometry: this._geometry.clone(),
      material: this._material.clone(),
      instances: this._instances,
      color: this.color,
      opacity: this._opacity,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
