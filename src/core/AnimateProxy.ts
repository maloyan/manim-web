/**
 * AnimateProxy - Fluent builder for animating Mobject property changes.
 *
 * Returned by `mobject.animate`. Records method calls and, when played,
 * creates a Transform from the original mobject to a copy with those
 * calls applied.
 *
 * Like ManimCE's `_AnimationBuilder`, any method of the source mobject can be
 * chained (`tracker.animate.setValue(5)`, `sq.animate.stretch(2, 0)`): the
 * builder is wrapped in a JS Proxy that records calls to methods it does not
 * define itself. The explicit methods below remain for documentation.
 *
 * Supports animation overrides via `overrideAnimation` / `getAnimationOverride`.
 */

import {
  Mobject,
  type Vector3Tuple,
  type MobjectStyle,
  type AxisOrOptions,
  registerAnimateProxy,
} from './Mobject';
import { VGroup } from './VGroup';
import { Animation, type AnimationOptions } from '../animation/Animation';
import { type RateFunction, smooth } from '../rate-functions';
import { Transform } from '../animation/transform/Transform';
import { getAnimationOverride, hasAnimationOverride } from '../animation/AnimationUtilities';

type RecordedCall = [string, unknown[]];

// `animate` itself is excluded: its type is AnimateBuilder<this>, so reading
// it here would make the type refer to itself.
type BuilderKeys<T> = Exclude<keyof T, 'animate' | keyof AnimateProxy>;
type MethodKeys<T> = {
  [K in BuilderKeys<T>]: T[K] extends (...args: never[]) => unknown ? K : never;
}[BuilderKeys<T>];

/**
 * The type of `mobject.animate`: an AnimateProxy on which every method of the
 * mobject can also be chained, returning the builder.
 */
export type AnimateBuilder<T> = AnimateProxy & {
  [K in MethodKeys<T>]: T[K] extends (...args: infer A) => unknown
    ? (...args: A) => AnimateBuilder<T>
    : never;
};

/**
 * Optional hook for mobjects whose animatable state is not geometry, such as
 * ValueTracker's number. ManimCE stores that state in points, so Transform
 * interpolates it; here the mobject interpolates it itself.
 */
interface CustomStateInterpolatable {
  interpolateCustomState(start: Mobject, end: Mobject, alpha: number): void;
}

function hasCustomState(m: Mobject): m is Mobject & CustomStateInterpolatable {
  return typeof (m as Partial<CustomStateInterpolatable>).interpolateCustomState === 'function';
}

export class AnimateProxy extends Animation {
  private _source: Mobject;
  private _calls: RecordedCall[] = [];
  private _innerTransform: Transform | null = null;
  private _overrideAnimation: Animation | null = null;
  private _originalState: Mobject | null = null;
  private _target: Mobject | null = null;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? smooth,
    });
    this._source = mobject;

    // Record any other method of the source, like ManimCE's
    // _AnimationBuilder.__getattr__. Members of the builder itself (its
    // explicit methods and the Animation API) are never intercepted.
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && !(prop in target)) {
          const member = (mobject as unknown as Record<string, unknown>)[prop];
          if (typeof member === 'function') {
            return (...args: unknown[]) => {
              target._calls.push([prop, args]);
              return receiver;
            };
          }
        }
        return Reflect.get(target, prop, receiver);
      },
    });
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

  rotate(angle: number, axisOrOptions?: Vector3Tuple | AxisOrOptions): this {
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
        (this._source.constructor as { className?: string }).className ??
        this._source.constructor.name;
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

    // Snapshot source so finish() can replay calls on it (see finish()).
    this._originalState = this._source.copy();

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
    this._target = target;

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
    if (this._originalState && this._target && hasCustomState(this._source)) {
      this._source.interpolateCustomState(this._originalState, this._target, alpha);
    }
  }

  override finish(): void {
    this.interpolate(1);
    if (this._overrideAnimation) {
      this._overrideAnimation.finish();
    } else if (this._innerTransform) {
      this._innerTransform.finish();
      // Transform writes target points/position back to source, but a leaf
      // VMobject's geometry-specific logical state (e.g. Circle._centerPoint,
      // _radius) is never synced — chained animate.shift/scale would then
      // operate on stale state (issue #252). Revert and replay calls so the
      // source's full state stays self-consistent.
      //
      // Skipped for VGroups: state lives in children, which Transform's VGroup
      // branch already updates in place — replay would double-shift. This
      // assumes no current VGroup subclass overrides shift/scale to mutate
      // parent-level numeric state; one that did would need its own re-sync.
      if (this._originalState && !(this._source instanceof VGroup)) {
        this._source.become(this._originalState);
        for (const [methodName, args] of this._calls) {
          const method = (this._source as unknown as Record<string, (...a: unknown[]) => unknown>)[
            methodName
          ];
          if (typeof method !== 'function') {
            throw new Error(
              `AnimateProxy: method "${methodName}" not found on ${this._source.constructor.name}`,
            );
          }
          method.apply(this._source, args);
        }
      }
    }
    super.finish();
  }
}

// Register with Mobject to break the Mobject -> AnimateProxy -> Transform ->
// VGroup -> Mobject cycle.
let registered = false;
export function ensureAnimateProxyRegistered(): void {
  if (registered) return;
  registerAnimateProxy((mobject: Mobject) => new AnimateProxy(mobject));
  registered = true;
}

// Eager registration for callers that import AnimateProxy directly.
ensureAnimateProxyRegistered();
