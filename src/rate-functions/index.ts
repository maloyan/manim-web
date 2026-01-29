/**
 * Rate/easing functions for animations.
 * These control how the animation progress (0-1) is mapped to visual progress.
 */

export type RateFunction = (t: number) => number;

/**
 * Linear interpolation - constant speed
 */
export const linear: RateFunction = (t: number): number => t;

/**
 * Manim's smooth function: 3t^2 - 2t^3
 * Also known as smoothstep - starts and ends smoothly
 */
export const smooth: RateFunction = (t: number): number => {
  return t * t * (3 - 2 * t);
};

/**
 * Cubic ease in-out - slower at both ends
 */
export const easeInOut: RateFunction = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Cubic ease in - starts slow, accelerates
 */
export const easeIn: RateFunction = (t: number): number => {
  return t * t * t;
};

/**
 * Cubic ease out - starts fast, decelerates
 */
export const easeOut: RateFunction = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Quadratic ease in
 */
export const easeInQuad: RateFunction = (t: number): number => {
  return t * t;
};

/**
 * Quadratic ease out
 */
export const easeOutQuad: RateFunction = (t: number): number => {
  return 1 - (1 - t) * (1 - t);
};

/**
 * Exponential ease in
 */
export const easeInExpo: RateFunction = (t: number): number => {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
};

/**
 * Exponential ease out
 */
export const easeOutExpo: RateFunction = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Bounce ease out - simulates bouncing
 */
export const easeOutBounce: RateFunction = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

/**
 * Bounce ease in
 */
export const easeInBounce: RateFunction = (t: number): number => {
  return 1 - easeOutBounce(1 - t);
};

/**
 * There and back - goes to 1 at t=0.5, returns to 0 at t=1
 */
export const thereAndBack: RateFunction = (t: number): number => {
  return t < 0.5
    ? smooth(2 * t)
    : smooth(2 * (1 - t));
};

/**
 * Rush into - quickly accelerate then maintain
 */
export const rushInto: RateFunction = (t: number): number => {
  return 2 * smooth(0.5 * t);
};

/**
 * Rush from - maintain then quickly decelerate
 */
export const rushFrom: RateFunction = (t: number): number => {
  return 2 * smooth(0.5 * (t + 1)) - 1;
};

/**
 * Double smooth - extra smooth transitions
 */
export const doubleSmooth: RateFunction = (t: number): number => {
  if (t < 0.5) {
    return 2 * smooth(t);
  }
  return 2 * smooth(t) - 1;
};

/**
 * Create a rate function that stays at 0 until a certain point,
 * then jumps to 1
 */
export const stepFunction = (threshold: number = 0.5): RateFunction => {
  return (t: number): number => (t < threshold ? 0 : 1);
};

/**
 * Reverse a rate function
 */
export const reverse = (func: RateFunction): RateFunction => {
  return (t: number): number => 1 - func(1 - t);
};

/**
 * Compose two rate functions
 */
export const compose = (
  outer: RateFunction,
  inner: RateFunction
): RateFunction => {
  return (t: number): number => outer(inner(t));
};
