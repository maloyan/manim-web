/**
 * Transform animation - morphs one mobject into another.
 */

import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Animation, AnimationOptions } from '../Animation';
import { ImageMobject } from '../../mobjects/image';
import { MathTexImage } from '../../mobjects/text/MathTexImage';
import { Text } from '../../mobjects/text/Text';
import { FadeMorphStrategy } from './FadeMorphStrategy';
import { MorphStrategy } from './MorphStrategy';
import { PointMorphStrategy } from './PointMorphStrategy';
import { ShapeMorphStrategy } from './ShapeMorphStrategy';
import { canMorphByPoints } from './TransformPairing';

export class Transform extends Animation {
  readonly target: Mobject;
  private _strategy: MorphStrategy | null = null;

  constructor(mobject: Mobject, target: Mobject, options: AnimationOptions = {}) {
    super(mobject, options);
    this.target = target;
  }

  private _selectStrategy(): MorphStrategy {
    const shapeEligible =
      (this.mobject instanceof Text && this.target instanceof Text) ||
      (this.mobject instanceof ImageMobject && this.target instanceof ImageMobject) ||
      (this.mobject instanceof MathTexImage && this.target instanceof MathTexImage);
    if (
      shapeEligible &&
      this.mobject.getDisplayMeshLength() === 1 &&
      this.target.getDisplayMeshLength() === 1
    ) {
      return new ShapeMorphStrategy();
    }
    if (this.mobject instanceof VMobject && this.target instanceof VMobject) {
      if (
        (this.mobject instanceof VGroup && this.target instanceof VGroup) ||
        canMorphByPoints(this.mobject, this.target)
      ) {
        return new PointMorphStrategy();
      }
    }
    return new FadeMorphStrategy();
  }

  override begin(): void {
    super.begin();
    this._strategy = this._selectStrategy();
    this._strategy.begin(this, this.mobject, this.target);
  }

  override interpolate(alpha: number): void {
    if (!this._strategy) throw new Error('Transform.interpolate requires strategy');
    this._strategy.interpolate(this, this.mobject, this.target, alpha);
  }

  override finish(): void {
    if (!this._strategy) throw new Error('Transform.finish requires strategy');
    this._strategy.finish(this, this.mobject, this.target);
    super.finish();
  }
}

export function transform(
  mobject: Mobject,
  target: Mobject,
  options?: AnimationOptions,
): Transform {
  return new Transform(mobject, target, options);
}

export class ReplacementTransform extends Transform {}
export function replacementTransform(
  mobject: Mobject,
  target: Mobject,
  options?: AnimationOptions,
): ReplacementTransform {
  return new ReplacementTransform(mobject, target, options);
}
export interface MobjectWithTarget extends VMobject {
  targetCopy: VMobject | null;
}
export class MoveToTarget extends Transform {
  constructor(mobject: MobjectWithTarget, options: AnimationOptions = {}) {
    if (!mobject.targetCopy)
      throw new Error(
        'MoveToTarget requires mobject.targetCopy to be set. Use mobject.generateTarget() first.',
      );
    super(mobject, mobject.targetCopy, options);
  }
}
export function moveToTarget(mobject: MobjectWithTarget, options?: AnimationOptions): MoveToTarget {
  return new MoveToTarget(mobject, options);
}
