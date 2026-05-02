import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';

export class FadeMorphStrategy {
  private _startOpacity = 1;
  private _targetOpacity = 1;
  private _startPositionX = 0;
  private _startPositionY = 0;
  private _startPositionZ = 0;
  private _targetPositionX = 0;
  private _targetPositionY = 0;
  private _targetPositionZ = 0;

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    this._startOpacity = source.opacity;
    this._targetOpacity = target.opacity;
    this._startPositionX = source.position.x;
    this._startPositionY = source.position.y;
    this._startPositionZ = source.position.z;
    this._targetPositionX = target.position.x;
    this._targetPositionY = target.position.y;
    this._targetPositionZ = target.position.z;
    const sourceObj = source.getThreeObject();
    const targetObj = target.getThreeObject();
    if (sourceObj.parent && !targetObj.parent) sourceObj.parent.add(targetObj);
    target.setStrokeOpacity(0);
    target._syncToThree();
  }

  interpolate(_animation: Animation, source: Mobject, target: Mobject, alpha: number): void {
    source.position.set(
      this._startPositionX + (this._targetPositionX - this._startPositionX) * alpha,
      this._startPositionY + (this._targetPositionY - this._startPositionY) * alpha,
      this._startPositionZ + (this._targetPositionZ - this._startPositionZ) * alpha,
    );
    target.position.copy(source.position);
    source.setStrokeOpacity(this._startOpacity * (1 - alpha));
    target.opacity = this._targetOpacity * alpha;
    target.setStrokeOpacity(target.opacity);
    target._syncToThree();
    source._markDirty();
  }

  finish(_animation: Animation, source: Mobject, target: Mobject): void {
    source.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    source.opacity = 0;
    target.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    target.opacity = this._targetOpacity;
    target._syncToThree();
    const targetObj = target.getThreeObject();
    if (targetObj.parent) targetObj.parent.remove(targetObj);
    source._markDirty();
  }
}
