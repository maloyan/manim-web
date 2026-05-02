import { Mobject } from '../../core/Mobject';
import { Animation } from '../Animation';
import { MorphStrategy } from './MorphStrategy';

interface FadeStateSnapshot {
  positionX: number;
  positionY: number;
  positionZ: number;
  opacity: number;
}

export class FadeMorphStrategy implements MorphStrategy {
  private _sourceSnapshot: FadeStateSnapshot | null = null;
  private _targetSnapshot: FadeStateSnapshot | null = null;
  private _startPositionX = 0;
  private _startPositionY = 0;
  private _startPositionZ = 0;
  private _targetPositionX = 0;
  private _targetPositionY = 0;
  private _targetPositionZ = 0;

  private _snapshotState(mobject: Mobject): FadeStateSnapshot {
    return {
      positionX: mobject.position.x,
      positionY: mobject.position.y,
      positionZ: mobject.position.z,
      opacity: mobject.opacity,
    };
  }

  begin(_animation: Animation, source: Mobject, target: Mobject): void {
    this._sourceSnapshot = this._snapshotState(source);
    this._targetSnapshot = this._snapshotState(target);
    this._startPositionX = this._sourceSnapshot.positionX;
    this._startPositionY = this._sourceSnapshot.positionY;
    this._startPositionZ = this._sourceSnapshot.positionZ;
    this._targetPositionX = this._targetSnapshot.positionX;
    this._targetPositionY = this._targetSnapshot.positionY;
    this._targetPositionZ = this._targetSnapshot.positionZ;
    const sourceObj = source.getThreeObject();
    const targetObj = target.getThreeObject();
    if (sourceObj.parent && !targetObj.parent) sourceObj.parent.add(targetObj);
    target.setStrokeOpacity(0);
    target._syncToThree();
  }

  interpolate(_animation: Animation, source: Mobject, target: Mobject, alpha: number): void {
    if (!this._sourceSnapshot) {
      throw new Error('FadeMorphStrategy.interpolate requires source snapshot');
    }
    if (!this._targetSnapshot) {
      throw new Error('FadeMorphStrategy.interpolate requires target snapshot');
    }

    source.position.set(
      this._startPositionX + (this._targetPositionX - this._startPositionX) * alpha,
      this._startPositionY + (this._targetPositionY - this._startPositionY) * alpha,
      this._startPositionZ + (this._targetPositionZ - this._startPositionZ) * alpha,
    );
    target.position.copy(source.position);
    source.setStrokeOpacity(this._sourceSnapshot.opacity * (1 - alpha));
    target.opacity = this._targetSnapshot.opacity * alpha;
    target.setStrokeOpacity(target.opacity);
    target._syncToThree();
    source._markDirty();
  }

  finish(_animation: Animation, source: Mobject, target: Mobject): void {
    if (!this._targetSnapshot) {
      throw new Error('FadeMorphStrategy.finish requires target snapshot');
    }
    source.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    source.opacity = 0;
    target.position.set(this._targetPositionX, this._targetPositionY, this._targetPositionZ);
    target.opacity = this._targetSnapshot.opacity;
    target._syncToThree();
    const targetObj = target.getThreeObject();
    if (targetObj.parent) targetObj.parent.remove(targetObj);
    source._markDirty();
  }
}
