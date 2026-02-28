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
 * Manim Python's smooth function using sigmoid curve.
 * Matches: smooth(t, inflection=10) from manim.utils.rate_functions
 * Steeper in the middle, flatter at endpoints than simple smoothstep.
 */
export const smooth: RateFunction = (t: number): number => {
  const inflection = 10.0;
  const error = 1 / (1 + Math.exp(inflection / 2));
  const sigmoid = 1 / (1 + Math.exp(-inflection * (t - 0.5)));
  return Math.max(0, Math.min(1, (sigmoid - error) / (1 - 2 * error)));
};

/**
 * Cubic ease in-out - slower at both ends
 */
export const easeInOut: RateFunction = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  return t < 0.5 ? smooth(2 * t) : smooth(2 * (1 - t));
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
 * Double smooth - extra smooth transitions.
 * Matches Python Manim: applies smooth to each half independently.
 */
export const doubleSmooth: RateFunction = (t: number): number => {
  if (t < 0.5) {
    return 0.5 * smooth(2 * t);
  }
  return 0.5 * (1 + smooth(2 * t - 1));
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
export const compose = (outer: RateFunction, inner: RateFunction): RateFunction => {
  return (t: number): number => outer(inner(t));
};

// --- Helper functions (not exported) ---

/**
 * Binomial coefficient C(n, k)
 */
const binomial = (n: number, k: number): number => {
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
};

/**
 * Evaluate a Bernstein polynomial defined by control points at parameter t.
 * Returns a function that evaluates the polynomial at t.
 * Matches Python Manim's bezier(*points) which returns a callable.
 */
const bernstein =
  (...points: number[]) =>
  (t: number): number => {
    const n = points.length - 1;
    let result = 0;
    for (let i = 0; i <= n; i++) {
      const coeff = binomial(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
      result += coeff * points[i];
    }
    return result;
  };

// --- New rate functions matching Python Manim ---

/**
 * Slow into - decelerates into the end.
 * Matches Python Manim: sqrt(1 - (1-t)^2)
 */
export const slowInto: RateFunction = (t: number): number => {
  return Math.sqrt(1 - (1 - t) * (1 - t));
};

/**
 * Squish a rate function to only operate within [a, b].
 * Outside that range, returns func(0) or func(1).
 * Matches Python Manim's squish_rate_func.
 */
export const squishRateFunc = (func: RateFunction, a: number = 0, b: number = 1): RateFunction => {
  return (t: number): number => {
    if (t < a) return func(0);
    if (t > b) return func(1);
    return func((t - a) / (b - a));
  };
};

/**
 * There and back with a pause in the middle.
 * Based on Python Manim's there_and_back_with_pause, with corrected
 * scaling factor (2/(1-pauseRatio) instead of 1/(1-pauseRatio)) to
 * ensure continuity at the pause boundaries.
 */
export const thereAndBackWithPause = (pauseRatio: number = 1 / 3): RateFunction => {
  return (t: number): number => {
    const a = 2.0 / (1.0 - pauseRatio);
    if (t < 0.5 - pauseRatio / 2) {
      return smooth(t * a);
    } else if (t < 0.5 + pauseRatio / 2) {
      return 1;
    } else {
      return smooth((1 - t) * a);
    }
  };
};

/**
 * Running start - pulls back before going forward.
 * Matches Python Manim's running_start using a degree-5 Bernstein polynomial.
 */
export const runningStart = (pullFactor: number = -0.5): RateFunction => {
  return (t: number): number => {
    return bernstein(0, 0, pullFactor, pullFactor, 1, 1)(t);
  };
};

/**
 * Wiggle - oscillates with given number of wiggles.
 * Matches Python Manim's wiggle rate function.
 */
export const wiggle = (wiggles: number = 2): RateFunction => {
  return (t: number): number => {
    return thereAndBack(t) * Math.sin(wiggles * Math.PI * t);
  };
};

/**
 * Not quite there - applies func but only reaches a proportion of the target.
 * Matches Python Manim's not_quite_there.
 */
export const notQuiteThere = (
  func: RateFunction = smooth,
  proportion: number = 0.7,
): RateFunction => {
  return (t: number): number => {
    return proportion * func(t);
  };
};

/**
 * Lingering - smooth squished to [0, 0.8], stays at 1 after.
 * Matches Python Manim's lingering.
 */
export const lingering: RateFunction = squishRateFunc(smooth, 0, 0.8);

/**
 * Exponential decay - rapid initial change that slows exponentially.
 * Matches Python Manim's exponential_decay.
 */
export const exponentialDecay = (halfLife: number = 0.1): RateFunction => {
  return (t: number): number => {
    return 1 - Math.exp(-t / halfLife);
  };
};
