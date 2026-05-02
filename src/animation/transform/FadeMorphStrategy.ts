import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';

export class FadeMorphStrategy {
  private _sourceCopy: Mobject | null = null;
  private _targetCopy: Mobject | null = null;
  private _startPositionX = 0;
  private _startPositionY = 0;
  private _startPositionZ = 0;
  private _targetPositionX = 0;
  private _targetPositionY = 0;
  private _targetPositionZ = 0;

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    this._sourceCopy = source.copy();
    this._targetCopy = target.copy();
    this._startPositionX = this._sourceCopy.position.x;
    this._startPositionY = this._sourceCopy.position.y;
    this._startPositionZ = this._sourceCopy.position.z;
    this._targetPositionX = this._targetCopy.position.x;
    this._targetPositionY = this._targetCopy.position.y;
    this._targetPositionZ = this._targetCopy.position.z;
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
    source.setStrokeOpacity((this._sourceCopy?.opacity ?? source.opacity) * (1 - alpha));
    target.opacity = (this._targetCopy?.opacity ?? target.opacity) * alpha;
    target.setStrokeOpacity(target.opacity);
    target._syncToThree();
    source._markDirty();
  }

  finish(_animation: Animation, source: Mobject, target: Mobject): void {
    source.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    source.opacity = 0;
    target.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    target.opacity = this._targetCopy?.opacity ?? target.opacity;
    target._syncToThree();
    const targetObj = target.getThreeObject();
    if (targetObj.parent) targetObj.parent.remove(targetObj);
    source._markDirty();
  }
}
