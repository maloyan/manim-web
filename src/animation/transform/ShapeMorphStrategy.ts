import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';
import { TexturedMobject } from '../../core/TexturedMobject';

export class ShapeMorphStrategy {
  private _shapeSourceMesh: THREE.Mesh | null = null;
  private _shapeTargetMesh: THREE.Mesh | null = null;
  private _startWidth = 0;
  private _startHeight = 0;
  private _targetWidth = 0;
  private _targetHeight = 0;
  private _crossFadeTargetOpacity = 1;

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    this._shapeSourceMesh = source.getDisplayMeshes()[0] ?? null;
    this._shapeTargetMesh = target.getDisplayMeshes()[0] ?? null;
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    this._crossFadeTargetOpacity = target.opacity;
    const srcGeo = this._shapeSourceMesh.geometry as THREE.PlaneGeometry;
    const tgtGeo = this._shapeTargetMesh.geometry as THREE.PlaneGeometry;
    this._startWidth = srcGeo.parameters.width;
    this._startHeight = srcGeo.parameters.height;
    this._targetWidth = tgtGeo.parameters.width;
    this._targetHeight = tgtGeo.parameters.height;
    const sourceObj = source.getThreeObject();
    const targetObj = target.getThreeObject();
    if (sourceObj.parent && !targetObj.parent) sourceObj.parent.add(targetObj);
    target.setStrokeOpacity(0);
    target._syncToThree();
  }

  interpolate(_animation: Animation, _source: Mobject, _target: Mobject, alpha: number): void {
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    const w = this._startWidth + (this._targetWidth - this._startWidth) * alpha;
    const h = this._startHeight + (this._targetHeight - this._startHeight) * alpha;
    this._shapeSourceMesh.geometry.dispose();
    this._shapeSourceMesh.geometry = new THREE.PlaneGeometry(w, h);
    this._shapeTargetMesh.geometry.dispose();
    this._shapeTargetMesh.geometry = new THREE.PlaneGeometry(w, h);
    _animation.mobject._markDirty();
  }

  finish(_animation: Animation, source: Mobject, target: Mobject): void {
    if (!this._shapeSourceMesh) throw new Error('ShapeMorphStrategy requires _shapeSourceMesh');
    if (!this._shapeTargetMesh) throw new Error('ShapeMorphStrategy requires _shapeTargetMesh');
    this._shapeSourceMesh.geometry.dispose();
    this._shapeSourceMesh.geometry = new THREE.PlaneGeometry(this._targetWidth, this._targetHeight);
    const src = source as TexturedMobject;
    const tgt = target as TexturedMobject;
    src.applyTextureFrom(tgt);
    source.opacity = this._crossFadeTargetOpacity;
    if (this._shapeTargetMesh.parent) this._shapeTargetMesh.parent.remove(this._shapeTargetMesh);
    source._markDirty();
  }
}
