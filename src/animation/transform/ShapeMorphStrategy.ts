import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';
import { MorphStrategy } from './MorphStrategy';
import { TexturedMobject } from '../../core/TexturedMobject';

/**
 * Morph strategy for textured single-mesh mobjects (Text/Image/MathTexImage).
 *
 * Size interpolation uses visual dimensions only:
 * - geometry is normalized to PlaneGeometry(1, 1) once in begin()
 * - per-frame width/height are applied via mesh.scale
 */
export class ShapeMorphStrategy implements MorphStrategy {
  private _shapeSourceMesh: THREE.Mesh | null = null;
  private _shapeTargetMesh: THREE.Mesh | null = null;
  private _startWidth = 0;
  private _startHeight = 0;
  private _targetWidth = 0;
  private _targetHeight = 0;

  private _getVisualDims(mesh: THREE.Mesh, label: string): { width: number; height: number } {
    const geometry = mesh.geometry;
    if (!(geometry instanceof THREE.PlaneGeometry)) {
      throw new Error(`ShapeMorphStrategy requires ${label} geometry to be THREE.PlaneGeometry`);
    }
    const params = geometry.parameters;
    if (typeof params.width !== 'number' || typeof params.height !== 'number') {
      throw new Error(`ShapeMorphStrategy requires ${label} plane geometry width/height`);
    }
    return {
      width: params.width * mesh.scale.x,
      height: params.height * mesh.scale.y,
    };
  }
  private _crossFadeTargetOpacity = 1;
  private _startPosition = new THREE.Vector3();
  private _targetPosition = new THREE.Vector3();
  private _startRotation = new THREE.Euler();
  private _targetRotation = new THREE.Euler();
  private _startScale = new THREE.Vector3(1, 1, 1);
  private _targetScale = new THREE.Vector3(1, 1, 1);
  private _sourceCopy: Mobject | null = null;
  private _targetCopy: Mobject | null = null;
  private _sourceTextureMobject: TexturedMobject | null = null;
  private _targetTextureMobject: TexturedMobject | null = null;

  /**
   * Validate textured inputs, force lazy Three object construction, then cache display meshes.
   */
  private _initTexturedMeshes(source: Mobject, target: Mobject): void {
    if (!(source instanceof TexturedMobject)) {
      throw new Error('ShapeMorphStrategy.begin requires source TexturedMobject');
    }
    if (!(target instanceof TexturedMobject)) {
      throw new Error('ShapeMorphStrategy.begin requires target TexturedMobject');
    }
    this._sourceTextureMobject = source;
    this._targetTextureMobject = target;

    // Lifecycle requirement: getThreeObject() must run before getDisplayMeshes().
    source.getThreeObject();
    target.getThreeObject();

    const sourceMesh = source.getDisplayMeshes()[0];
    const targetMesh = target.getDisplayMeshes()[0];
    if (!(sourceMesh instanceof THREE.Mesh)) {
      throw new Error('ShapeMorphStrategy.begin requires source display mesh');
    }
    if (!(targetMesh instanceof THREE.Mesh)) {
      throw new Error('ShapeMorphStrategy.begin requires target display mesh');
    }
    this._shapeSourceMesh = sourceMesh;
    this._shapeTargetMesh = targetMesh;
  }

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    this._initTexturedMeshes(source, target);
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    const sourceMesh = this._shapeSourceMesh;
    const targetMesh = this._shapeTargetMesh;

    this._sourceCopy = source.copy();
    this._targetCopy = target.copy();
    this._crossFadeTargetOpacity = this._targetCopy.opacity;
    this._startPosition.copy(this._sourceCopy.position);
    this._targetPosition.copy(this._targetCopy.position);
    this._startRotation.copy(this._sourceCopy.rotation);
    this._targetRotation.copy(this._targetCopy.rotation);
    this._startScale.copy(this._sourceCopy.scaleVector);
    this._targetScale.copy(this._targetCopy.scaleVector);
    const sourceDims = this._getVisualDims(sourceMesh, 'source mesh');
    const targetDims = this._getVisualDims(targetMesh, 'target mesh');
    this._startWidth = sourceDims.width;
    this._startHeight = sourceDims.height;
    this._targetWidth = targetDims.width;
    this._targetHeight = targetDims.height;

    // Use unit geometry + mesh.scale for per-frame size interpolation.
    sourceMesh.geometry.dispose();
    sourceMesh.geometry = new THREE.PlaneGeometry(1, 1);
    targetMesh.geometry.dispose();
    targetMesh.geometry = new THREE.PlaneGeometry(1, 1);

    sourceMesh.scale.set(this._startWidth, this._startHeight, 1);
    targetMesh.scale.set(this._startWidth, this._startHeight, 1);
    const sourceObj = source.getThreeObject();
    const targetObj = target.getThreeObject();
    if (sourceObj.parent && !targetObj.parent) sourceObj.parent.add(targetObj);
    target.opacity = 0;
    target._syncToThree();
  }

  interpolate(_animation: Animation, source: Mobject, target: Mobject, alpha: number): void {
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    const w = this._startWidth + (this._targetWidth - this._startWidth) * alpha;
    const h = this._startHeight + (this._targetHeight - this._startHeight) * alpha;
    this._shapeSourceMesh.scale.set(w, h, 1);
    this._shapeTargetMesh.scale.set(w, h, 1);
    source.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
    target.position.copy(source.position);
    source.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    target.rotation.copy(source.rotation);
    source.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);
    target.scaleVector.copy(source.scaleVector);
    source.opacity = this._crossFadeTargetOpacity * (1 - alpha);
    target.opacity = this._crossFadeTargetOpacity * alpha;
    source.setStrokeOpacity(source.opacity);
    target.setStrokeOpacity(target.opacity);
    target._syncToThree();
    source._markDirty();
  }

  finish(_animation: Animation, source: Mobject, _target: Mobject): void {
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    if (!this._sourceTextureMobject)
      throw new Error('ShapeMorphStrategy requires source TexturedMobject');
    if (!this._targetTextureMobject)
      throw new Error('ShapeMorphStrategy requires target TexturedMobject');

    this._sourceTextureMobject.applyVisualSize(this._targetWidth, this._targetHeight);
    this._sourceTextureMobject.applyTextureFrom(this._targetTextureMobject);
    source.opacity = this._crossFadeTargetOpacity;
    source.setStrokeOpacity(this._crossFadeTargetOpacity);
    const targetObj = this._targetTextureMobject.getThreeObject();
    if (targetObj.parent) targetObj.parent.remove(targetObj);
    source._markDirty();
  }
}
