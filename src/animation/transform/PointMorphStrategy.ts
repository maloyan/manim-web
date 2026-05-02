import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';
import { lerpPoint } from '../../utils/math';
import { worldToParentLocalPosition } from '../../core/MobjectTraversal';
import {
  alignVmobjectPair,
  canMorphByPoints,
  pairLeafSnapshotsByIndex,
  type LeafPairByIndex,
} from './TransformPairing';

interface ChildStyle {
  opacity: number;
  fillOpacity: number;
  strokeWidth: number;
  color: string;
  fillColor: string;
}
interface VGroupLeafState {
  child: VMobject;
  startPoints: number[][];
  targetPoints: number[][];
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  finalTargetPoints: number[][];
  finalTargetSubpathLengths?: number[];
  startStyle: ChildStyle;
  targetStyle: ChildStyle;
  strokeColorPair: { start: THREE.Color; target: THREE.Color; interpolate: boolean };
  fillColorPair: { start: THREE.Color; target: THREE.Color; interpolate: boolean };
}
const scratchColor = new THREE.Color();

function captureStyle(m: VMobject): ChildStyle {
  return {
    opacity: m.opacity,
    fillOpacity: m.fillOpacity,
    strokeWidth: m.strokeWidth,
    color: m.color,
    fillColor: m.fillColor || m.color,
  };
}
function captureStyleFaded(m: VMobject): ChildStyle {
  return {
    opacity: 0,
    fillOpacity: 0,
    strokeWidth: m.strokeWidth,
    color: m.color,
    fillColor: m.fillColor || m.color,
  };
}

export class PointMorphStrategy {
  private _startPoints: number[][] = [];
  private _targetPoints: number[][] = [];
  private _finalTargetPoints: number[][] = [];
  private _finalTargetSubpathLengths?: number[];
  private _alignedSubpathLengths?: number[];
  private _startOpacity = 1;
  private _targetOpacity = 1;
  private _startFillOpacity = 0;
  private _targetFillOpacity = 0;
  private _startStrokeWidth = 2;
  private _targetStrokeWidth = 2;
  private _startColor = new THREE.Color();
  private _targetColor = new THREE.Color();
  private _interpolateColor = false;
  private _startFillColor = new THREE.Color();
  private _targetFillColor = new THREE.Color();
  private _interpolateFillColor = false;
  private _startPosition = new THREE.Vector3();
  private _targetPosition = new THREE.Vector3();
  private _startRotation = new THREE.Euler();
  private _targetRotation = new THREE.Euler();
  private _startScale = new THREE.Vector3(1, 1, 1);
  private _targetScale = new THREE.Vector3(1, 1, 1);
  private _isVGroupTransform = false;
  private _vgroupLeafStates: VGroupLeafState[] = [];

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    if (!(source instanceof VMobject) || !(target instanceof VMobject))
      throw new Error('PointMorphStrategy requires VMobject inputs');
    if (source instanceof VGroup && target instanceof VGroup) {
      this._beginVGroup(source, target);
      return;
    }
    const aligned = alignVmobjectPair(source, target);
    this._startPoints = aligned.startPoints;
    this._targetPoints = aligned.targetPoints;
    this._alignedSubpathLengths = aligned.alignedSubpathLengths;
    this._finalTargetPoints = aligned.finalTargetPoints;
    this._finalTargetSubpathLengths = aligned.finalTargetSubpathLengths;
    this._startOpacity = source.opacity;
    this._targetOpacity = target.opacity;
    this._startFillOpacity = source.fillOpacity;
    this._targetFillOpacity = target.fillOpacity;
    this._startStrokeWidth = source.strokeWidth;
    this._targetStrokeWidth = target.strokeWidth;
    this._startColor.set(source.color);
    this._targetColor.set(target.color);
    this._interpolateColor = source.color !== target.color;
    const sc = source.fillColor || source.color;
    const tc = target.fillColor || target.color;
    this._startFillColor.set(sc);
    this._targetFillColor.set(tc);
    this._interpolateFillColor = sc !== tc;
    this._startPosition.copy(source.position);
    this._targetPosition.copy(target.position);
    this._startRotation.copy(source.rotation);
    this._targetRotation.copy(target.rotation);
    this._startScale.copy(source.scaleVector);
    this._targetScale.copy(target.scaleVector);
    source.setPoints(this._startPoints);
    source.setTransformSubpathLengths(this._alignedSubpathLengths);
  }
  private _beginVGroup(source: VGroup, target: VGroup): void {
    this._isVGroupTransform = true;
    for (const pair of pairLeafSnapshotsByIndex(source, target))
      this._vgroupLeafStates.push(this._build(source, pair));
    this._startPosition.copy(source.position);
    this._targetPosition.copy(target.position);
    this._startRotation.copy(source.rotation);
    this._targetRotation.copy(target.rotation);
    this._startScale.copy(source.scaleVector);
    this._targetScale.copy(target.scaleVector);
  }
  private _build(group: VGroup, pair: LeafPairByIndex): VGroupLeafState {
    const { source: src, target: tgt, sourceIsPlaceholder, targetIsPlaceholder } = pair;
    const sc = src.leaf;
    const tc = tgt.leaf;
    let child: VMobject = sc;
    if (sourceIsPlaceholder) {
      child = tc.copy() as VMobject;
      child.opacity = 0;
      child.fillOpacity = 0;
      group.add(child);
    }
    const canMorph = canMorphByPoints(sc, tc) && !sourceIsPlaceholder && !targetIsPlaceholder;
    const aligned = canMorph ? alignVmobjectPair(sc, tc) : undefined;
    const startPoints = aligned?.startPoints ?? child.getPoints();
    const targetPoints = aligned?.targetPoints ?? child.getPoints();
    const finalTargetPoints = aligned?.finalTargetPoints ?? child.getPoints();
    const finalTargetSubpathLengths = aligned?.finalTargetSubpathLengths;
    if (aligned) {
      child.setPoints(aligned.startPoints);
      child.setTransformSubpathLengths(aligned.alignedSubpathLengths);
    } else child.setTransformSubpathLengths(undefined);
    const startStyle = sourceIsPlaceholder ? captureStyleFaded(tc) : captureStyle(child);
    const targetStyle = targetIsPlaceholder ? captureStyleFaded(sc) : captureStyle(tc);
    return {
      child,
      startPoints,
      targetPoints,
      startPosition: worldToParentLocalPosition(src.worldPosition, src.parentWorldMatrix),
      targetPosition: worldToParentLocalPosition(tgt.worldPosition, src.parentWorldMatrix),
      finalTargetPoints,
      finalTargetSubpathLengths,
      startStyle,
      targetStyle,
      strokeColorPair: {
        start: new THREE.Color(startStyle.color),
        target: new THREE.Color(targetStyle.color),
        interpolate: startStyle.color !== targetStyle.color,
      },
      fillColorPair: {
        start: new THREE.Color(startStyle.fillColor),
        target: new THREE.Color(targetStyle.fillColor),
        interpolate: startStyle.fillColor !== targetStyle.fillColor,
      },
    };
  }
  interpolate(_animation: Animation, source: Mobject, _target: Mobject, alpha: number): void {
    if (this._isVGroupTransform) {
      for (const leaf of this._vgroupLeafStates) {
        const interpolated: number[][] = [];
        for (let i = 0; i < leaf.startPoints.length; i++)
          interpolated.push(lerpPoint(leaf.startPoints[i], leaf.targetPoints[i], alpha));
        leaf.child.setPoints(interpolated);
        leaf.child.position.lerpVectors(leaf.startPosition, leaf.targetPosition, alpha);
        const ss = leaf.startStyle,
          ts = leaf.targetStyle;
        leaf.child.opacity = ss.opacity + (ts.opacity - ss.opacity) * alpha;
        leaf.child.fillOpacity = ss.fillOpacity + (ts.fillOpacity - ss.fillOpacity) * alpha;
        leaf.child.strokeWidth = ss.strokeWidth + (ts.strokeWidth - ss.strokeWidth) * alpha;
        if (leaf.strokeColorPair.interpolate)
          leaf.child.color =
            '#' +
            scratchColor
              .lerpColors(leaf.strokeColorPair.start, leaf.strokeColorPair.target, alpha)
              .getHexString();
        if (leaf.fillColorPair.interpolate)
          leaf.child.fillColor =
            '#' +
            scratchColor
              .lerpColors(leaf.fillColorPair.start, leaf.fillColorPair.target, alpha)
              .getHexString();
        leaf.child._markDirty();
      }
      return;
    }
    const vmobject = source as VMobject;
    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++)
      interpolatedPoints.push(lerpPoint(this._startPoints[i], this._targetPoints[i], alpha));
    vmobject.setPoints(interpolatedPoints);
    vmobject.setTransformSubpathLengths(this._alignedSubpathLengths);
    vmobject.opacity = this._startOpacity + (this._targetOpacity - this._startOpacity) * alpha;
    vmobject.fillOpacity =
      this._startFillOpacity + (this._targetFillOpacity - this._startFillOpacity) * alpha;
    vmobject.strokeWidth =
      this._startStrokeWidth + (this._targetStrokeWidth - this._startStrokeWidth) * alpha;
    if (this._interpolateColor)
      vmobject.color =
        '#' +
        new THREE.Color().lerpColors(this._startColor, this._targetColor, alpha).getHexString();
    if (this._interpolateFillColor)
      vmobject.fillColor =
        '#' +
        new THREE.Color()
          .lerpColors(this._startFillColor, this._targetFillColor, alpha)
          .getHexString();
    vmobject.position.lerpVectors(this._startPosition, this._targetPosition, alpha);
    vmobject.rotation.set(
      this._startRotation.x + (this._targetRotation.x - this._startRotation.x) * alpha,
      this._startRotation.y + (this._targetRotation.y - this._startRotation.y) * alpha,
      this._startRotation.z + (this._targetRotation.z - this._startRotation.z) * alpha,
    );
    vmobject.scaleVector.lerpVectors(this._startScale, this._targetScale, alpha);
    vmobject._markDirty();
  }
  finish(_animation: Animation, source: Mobject, target: Mobject): void {
    if (this._isVGroupTransform) {
      const group = source as VGroup;
      for (const leaf of this._vgroupLeafStates) {
        leaf.child.setPoints(leaf.finalTargetPoints);
        leaf.child.position.copy(leaf.targetPosition);
        const ts = leaf.targetStyle;
        leaf.child.opacity = ts.opacity;
        leaf.child.fillOpacity = ts.fillOpacity;
        leaf.child.strokeWidth = ts.strokeWidth;
        leaf.child.color = ts.color;
        leaf.child.fillColor = ts.fillColor;
        leaf.child.setTransformSubpathLengths(leaf.finalTargetSubpathLengths);
        leaf.child._markDirty();
      }
      group._markDirty();
      return;
    }
    const vmobject = source as VMobject;
    const vtarget = target as VMobject;
    vmobject.setPoints(
      this._finalTargetPoints.length > 0 ? this._finalTargetPoints : this._targetPoints,
    );
    vmobject.setTransformSubpathLengths(this._finalTargetSubpathLengths);
    vmobject.opacity = this._targetOpacity;
    vmobject.fillOpacity = this._targetFillOpacity;
    vmobject.strokeWidth = this._targetStrokeWidth;
    vmobject.color = vtarget.color;
    if (this._interpolateFillColor) vmobject.fillColor = vtarget.fillColor || vtarget.color;
    vmobject.position.copy(this._targetPosition);
    vmobject.rotation.copy(this._targetRotation);
    vmobject.scaleVector.copy(this._targetScale);
    vmobject._markDirty();
  }
}
