import { Mobject } from '../core/Mobject';
import { Animation, AnimationOptions } from './Animation';

/**
 * Type for animation override functions
 */
export type AnimationOverrideFunc = (mobject: Mobject, animArgs?: AnimationOptions) => Animation;

/**
 * Registry of animation overrides for methods
 */
const animationOverrides = new Map<string, Map<string, AnimationOverrideFunc>>();

/**
 * overrideAnimation - Register a custom animation for a mobject method
 *
 * When using the `.animate` pattern, if a method has a registered override,
 * the override animation will be used instead of the default interpolation.
 *
 * @param methodName The name of the method to override
 * @param className The class name to scope the override to
 * @param animFunc The function that creates the override animation
 *
 * @example
 * ```typescript
 * // Register a custom animation for clearContent
 * overrideAnimation('clearContent', 'MyMobject', (mobject, args) => {
 *   return new Uncreate(mobject, args);
 * });
 * ```
 */
export function overrideAnimation(
  methodName: string,
  className: string,
  animFunc: AnimationOverrideFunc,
): void {
  if (!animationOverrides.has(className)) {
    animationOverrides.set(className, new Map());
  }
  animationOverrides.get(className)!.set(methodName, animFunc);
}

/**
 * overrideAnimate - Register a custom `.animate` behavior for a method, by class.
 *
 * TS-idiomatic form of CE's `@override_animate(method)` decorator. CE decorates
 * a method so that `mob.animate.method()` plays a custom animation instead of
 * interpolating the method's effect. A decorator needs a target, and this repo
 * does not use TypeScript decorators, so the override is registered against the
 * mobject class and method name. `AnimateProxy.begin` consults this registry
 * (via `getAnimationOverride`) and uses the factory when exactly that method is
 * recorded, so wiring the hook is not needed.
 *
 * The class key matches the lookup in `AnimateProxy`: the static `className`
 * (survives minification) when present, otherwise `mobjectClass.name`.
 *
 * @param mobjectClass - The mobject class the override applies to.
 * @param methodName - The method whose `.animate` behavior is overridden.
 * @param animationFactory - Builds the animation played for `mob.animate[methodName]()`.
 *
 * @example
 * ```typescript
 * overrideAnimate(MyMobject, 'clearContent', (mob, args) => new Uncreate(mob, args));
 * myMobject.animate.clearContent(); // plays Uncreate instead of a Transform
 * ```
 */
export function overrideAnimate<M extends Mobject>(
  mobjectClass: abstract new (...args: never[]) => M,
  methodName: string,
  animationFactory: AnimationOverrideFunc,
): void {
  const className = (mobjectClass as { className?: string }).className ?? mobjectClass.name;
  overrideAnimation(methodName, className, animationFactory);
}

/**
 * getAnimationOverride - Get registered animation override for a method
 *
 * @param methodName The method name to check
 * @param className The class name to check
 * @returns The override function if registered, undefined otherwise
 */
export function getAnimationOverride(
  methodName: string,
  className: string,
): AnimationOverrideFunc | undefined {
  return animationOverrides.get(className)?.get(methodName);
}

/**
 * hasAnimationOverride - Check if a method has an animation override
 */
export function hasAnimationOverride(methodName: string, className: string): boolean {
  return animationOverrides.get(className)?.has(methodName) ?? false;
}

/**
 * clearAnimationOverrides - Remove all overrides for a class
 */
export function clearAnimationOverrides(className: string): void {
  animationOverrides.delete(className);
}

/**
 * prepareAnimation - Normalize animation input to a consistent Animation instance
 *
 * Accepts an Animation object, a callable that returns an Animation, or
 * other animation-like inputs and converts them to a proper Animation instance.
 *
 * @param animInput An Animation instance, a function returning an Animation, or a Mobject
 * @returns A normalized Animation instance
 *
 * @example
 * ```typescript
 * // Direct animation
 * const anim1 = prepareAnimation(new FadeIn(circle));
 *
 * // Function that returns animation
 * const anim2 = prepareAnimation(() => new FadeIn(circle));
 *
 * // With animation args
 * const anim3 = prepareAnimation(new Create(square, { duration: 2 }));
 * ```
 */
export function prepareAnimation(animInput: Animation | (() => Animation)): Animation {
  if (animInput instanceof Animation) {
    return animInput;
  }

  if (typeof animInput === 'function') {
    const result = animInput();
    if (result instanceof Animation) {
      return result;
    }
    throw new Error('prepareAnimation: function did not return an Animation instance');
  }

  throw new Error(
    `prepareAnimation: expected Animation or function returning Animation, got ${typeof animInput}`,
  );
}
