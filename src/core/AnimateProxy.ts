/**
 * AnimateProxy - Fluent builder for animating Mobject property changes.
 *
 * Returned by `mobject.animate`. Records method calls and, when played,
 * creates a Transform from the original mobject to a copy with those
 * calls applied.
 *
 * Supports animation overrides via `overrideAnimation` / `getAnimationOverride`.
 */

import { Mobject, type Vector3Tuple, type MobjectStyle, registerAnimateProxy } from './Mobject';
import { Animation, type AnimationOptions } from '../animation/Animation';
import { type RateFunction, smooth } from '../rate-functions';
import { Transform } from '../animation/transform/Transform';
import { getAnimationOverride, hasAnimationOverride } from '../animation/AnimationUtilities';

type RecordedCall = [string, unknown[]];

export class AnimateProxy extends Animation {
  private _source: Mobject;
  private _calls: RecordedCall[] = [];
  private _innerTransform: Transform | null = null;
  private _overrideAnimation: Animation | null = null;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? smooth,
    });
    this._source = mobject;
  }

  // ── Builder methods (chainable, return this) ─────────────────────

  /** Override duration for this animation (builder-style). */
  withDuration(seconds: number): this {
    Object.defineProperty(this, 'duration', { value: seconds, writable: true, configurable: true });
    return this;
  }

  /** Override rate function (builder-style). */
  withRateFunc(fn: RateFunction): this {
    Object.defineProperty(this, 'rateFunc', { value: fn, writable: true, configurable: true });
    return this;
  }

  // ── Proxy methods that record calls ──────────────────────────────

  shift(delta: Vector3Tuple): this {
    this._calls.push(['shift', [delta]]);
    return this;
  }

  moveTo(target: Vector3Tuple | Mobject, alignedEdge?: Vector3Tuple): this {
    this._calls.push(['moveTo', alignedEdge ? [target, alignedEdge] : [target]]);
    return this;
  }

  rotate(
    angle: number,
    axisOrOptions?: Vector3Tuple | { axis?: Vector3Tuple; aboutPoint?: Vector3Tuple },
  ): this {
    this._calls.push(['rotate', axisOrOptions ? [angle, axisOrOptions] : [angle]]);
    return this;
  }

  scale(factor: number | Vector3Tuple): this {
    this._calls.push(['scale', [factor]]);
    return this;
  }

  setColor(color: string): this {
    this._calls.push(['setColor', [color]]);
    return this;
  }

  setOpacity(opacity: number): this {
    this._calls.push(['setOpacity', [opacity]]);
    return this;
  }

  setStrokeWidth(width: number): this {
    this._calls.push(['setStrokeWidth', [width]]);
    return this;
  }

  setFillOpacity(opacity: number): this {
    this._calls.push(['setFillOpacity', [opacity]]);
    return this;
  }

  setFill(color?: string, opacity?: number): this {
    this._calls.push(['setFill', [color, opacity]]);
    return this;
  }

  setStyle(style: Partial<MobjectStyle>): this {
    this._calls.push(['setStyle', [style]]);
    return this;
  }

  flip(axis?: Vector3Tuple): this {
    this._calls.push(['flip', axis ? [axis] : []]);
    return this;
  }

  center(): this {
    this._calls.push(['center', []]);
    return this;
  }

  nextTo(target: Mobject | Vector3Tuple, direction?: Vector3Tuple, buff?: number): this {
    const args: unknown[] = [target];
    if (direction !== undefined) args.push(direction);
    if (buff !== undefined) args.push(buff);
    this._calls.push(['nextTo', args]);
    return this;
  }

  alignTo(target: Mobject | Vector3Tuple, direction: Vector3Tuple): this {
    this._calls.push(['alignTo', [target, direction]]);
    return this;
  }

  toEdge(direction: Vector3Tuple, buff?: number): this {
    this._calls.push(['toEdge', buff !== undefined ? [direction, buff] : [direction]]);
    return this;
  }

  setX(x: number): this {
    this._calls.push(['setX', [x]]);
    return this;
  }

  setY(y: number): this {
    this._calls.push(['setY', [y]]);
    return this;
  }

  setZ(z: number): this {
    this._calls.push(['setZ', [z]]);
    return this;
  }

  // ── Animation lifecycle ──────────────────────────────────────────

  override begin(): void {
    super.begin();

    // Check for animation override (only if there's exactly one call)
    if (this._calls.length === 1) {
      const [methodName] = this._calls[0];
      // Use static className property if available (survives minification),
      // fall back to constructor.name for development builds.
      const className =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._source.constructor as any).className ?? this._source.constructor.name;
      if (hasAnimationOverride(methodName, className)) {
        const overrideFactory = getAnimationOverride(methodName, className)!;
        this._overrideAnimation = overrideFactory(this._source, {
          duration: this.duration,
          rateFunc: this.rateFunc,
        });
        this._overrideAnimation.begin();
        return;
      }
    }

    // Standard path: copy mobject, apply all recorded calls, use as Transform target
    const target = this._source.copy();
    for (const [methodName, args] of this._calls) {
      const method = (target as unknown as Record<string, (...a: unknown[]) => unknown>)[
        methodName
      ];
      if (typeof method !== 'function') {
        throw new Error(
          `AnimateProxy: method "${methodName}" not found on ${target.constructor.name}`,
        );
      }
      method.apply(target, args);
    }

    this._innerTransform = new Transform(this._source, target, {
      duration: this.duration,
      rateFunc: this.rateFunc,
    });
    this._innerTransform.begin();
  }

  interpolate(alpha: number): void {
    if (this._overrideAnimation) {
      this._overrideAnimation.interpolate(alpha);
      return;
    }
    if (this._innerTransform) {
      this._innerTransform.interpolate(alpha);
    }
  }

  override finish(): void {
    this.interpolate(1);
    if (this._overrideAnimation) {
      this._overrideAnimation.finish();
    } else if (this._innerTransform) {
      this._innerTransform.finish();
    }
    super.finish();
  }
}

// Register with Mobject to break circular dependency
registerAnimateProxy((mobject: Mobject) => new AnimateProxy(mobject));
