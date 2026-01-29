/**
 * Create animation - draws the mobject stroke progressively.
 * For VMobjects, this uses dashed lines to progressively reveal the stroke path,
 * similar to how Manim's Create animation works.
 */

import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

export class Create extends Animation {
  /** Total path length for dash-based reveal */
  private _totalLength: number = 0;
  /** Whether to use dash-based reveal (needs Line2 children) */
  private _useDashReveal: boolean = false;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    // Manim default for Create is 2 seconds
    super(mobject, { duration: options.duration ?? 2, ...options });
  }

  /**
   * Check if the mobject has Line2 children for dash-based reveal
   */
  private _hasLine2Children(): boolean {
    let found = false;
    this.mobject.getThreeObject().traverse((child) => {
      if (child instanceof Line2) found = true;
    });
    return found;
  }

  /**
   * Set up the animation - configure dashed lines for progressive reveal
   */
  override begin(): void {
    super.begin();

    this._useDashReveal = (this.mobject instanceof VMobject) && this._hasLine2Children();

    if (this._useDashReveal) {
      // Set up dashed line for progressive reveal
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;

          // Calculate total line length from line distances
          child.computeLineDistances();
          const geom = child.geometry as any;
          // Line2 uses instanceDistanceEnd attribute for cumulative distances
          const distEnd = geom.attributes.instanceDistanceEnd;
          if (distEnd && distEnd.count > 0) {
            const arr = distEnd.data ? distEnd.data.array : distEnd.array;
            this._totalLength = arr[arr.length - 1] || 1;
          } else {
            this._totalLength = 1;
          }

          // Start with nothing visible
          material.dashSize = 0;
          material.gapSize = this._totalLength;
          material.needsUpdate = true;
        }
      });
    } else {
      // Non-line mobject (Text, etc.): use opacity
      this.mobject.setOpacity(0);
    }
  }

  /**
   * Interpolate the dash size to progressively reveal the stroke
   */
  interpolate(alpha: number): void {
    if (this._useDashReveal) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          const visibleLength = alpha * this._totalLength;
          material.dashSize = visibleLength;
          // Small epsilon to avoid visual artifacts
          material.gapSize = this._totalLength - visibleLength + 0.0001;
          material.needsUpdate = true;
        }
      });
    } else {
      this.mobject.setOpacity(alpha);
    }
  }

  /**
   * Ensure stroke is fully visible at the end
   */
  override finish(): void {
    if (this._useDashReveal) {
      // Disable dashing, show full stroke
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = false;
          material.needsUpdate = true;
        }
      });
    } else {
      this.mobject.setOpacity(1);
    }
    super.finish();
  }
}

/**
 * Create a Create animation for a mobject.
 * Progressively draws the mobject's stroke.
 * @param mobject The mobject to create (should be a VMobject)
 * @param options Animation options (duration, rateFunc)
 */
export function create(mobject: Mobject, options?: AnimationOptions): Create {
  return new Create(mobject, options);
}

/**
 * DrawBorderThenFill - draws the border progressively, then fills.
 * A variant of Create that traces the stroke first, then fades in the fill.
 */
export class DrawBorderThenFill extends Animation {
  /** Whether to use dash-based reveal */
  private _useDashReveal: boolean = false;
  /** Total path length for dash-based reveal */
  private _totalLength: number = 1;
  /** Original fill opacity to restore */
  private _originalFillOpacity: number = 0;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    // Manim default for DrawBorderThenFill is 2 seconds
    super(mobject, { duration: options.duration ?? 2, ...options });
  }

  private _hasLine2Children(): boolean {
    let found = false;
    this.mobject.getThreeObject().traverse((child) => {
      if (child instanceof Line2) found = true;
    });
    return found;
  }

  override begin(): void {
    super.begin();
    this._useDashReveal = (this.mobject instanceof VMobject) && this._hasLine2Children();

    if (this._useDashReveal) {
      const vmob = this.mobject as VMobject;
      this._originalFillOpacity = vmob.fillOpacity;
      vmob.setFillOpacity(0); // Hide fill initially

      // Set up stroke tracing with dashes
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;
          child.computeLineDistances();
          const geom = child.geometry as any;
          const distEnd = geom.attributes.instanceDistanceEnd;
          if (distEnd && distEnd.count > 0) {
            const arr = distEnd.data ? distEnd.data.array : distEnd.array;
            this._totalLength = arr[arr.length - 1] || 1;
          } else {
            this._totalLength = 1;
          }
          material.dashSize = 0;
          material.gapSize = this._totalLength;
          material.needsUpdate = true;
        }
      });
    }
  }

  interpolate(alpha: number): void {
    if (this._useDashReveal) {
      const vmob = this.mobject as VMobject;

      if (alpha < 0.5) {
        // First half: draw border with dash reveal
        const strokeAlpha = alpha * 2;
        const threeObj = this.mobject.getThreeObject();
        threeObj.traverse((child) => {
          if (child instanceof Line2) {
            const material = child.material as LineMaterial;
            const visibleLength = strokeAlpha * this._totalLength;
            material.dashSize = visibleLength;
            material.gapSize = this._totalLength - visibleLength + 0.0001;
            material.needsUpdate = true;
          }
        });
      } else {
        // Second half: fill in
        const fillAlpha = (alpha - 0.5) * 2;
        vmob.setFillOpacity(this._originalFillOpacity * fillAlpha);

        // Ensure stroke is fully visible (disable dashing)
        const threeObj = this.mobject.getThreeObject();
        threeObj.traverse((child) => {
          if (child instanceof Line2) {
            const material = child.material as LineMaterial;
            if (material.dashed) {
              material.dashed = false;
              material.needsUpdate = true;
            }
          }
        });
      }
    }
  }

  override finish(): void {
    if (this._useDashReveal) {
      const vmob = this.mobject as VMobject;
      vmob.setFillOpacity(this._originalFillOpacity);

      // Ensure dashing is disabled
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = false;
          material.needsUpdate = true;
        }
      });
    }
    super.finish();
  }
}

/**
 * Create a DrawBorderThenFill animation.
 */
export function drawBorderThenFill(
  mobject: Mobject,
  options?: AnimationOptions
): DrawBorderThenFill {
  return new DrawBorderThenFill(mobject, options);
}

/**
 * Uncreate animation - reverse of Create, erases the stroke progressively.
 * Uses dashed lines to progressively hide the stroke from end to start.
 */
export class Uncreate extends Animation {
  /** Total path length for dash-based reveal */
  private _totalLength: number = 0;
  /** Whether to use dash-based reveal */
  private _useDashReveal: boolean = false;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    // Manim default for Uncreate is 2 seconds
    super(mobject, { duration: options.duration ?? 2, ...options });
  }

  private _hasLine2Children(): boolean {
    let found = false;
    this.mobject.getThreeObject().traverse((child) => {
      if (child instanceof Line2) found = true;
    });
    return found;
  }

  override begin(): void {
    super.begin();
    this._useDashReveal = (this.mobject instanceof VMobject) && this._hasLine2Children();

    if (this._useDashReveal) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;

          child.computeLineDistances();
          const geom = child.geometry as any;
          const distEnd = geom.attributes.instanceDistanceEnd;
          if (distEnd && distEnd.count > 0) {
            const arr = distEnd.data ? distEnd.data.array : distEnd.array;
            this._totalLength = arr[arr.length - 1] || 1;
          } else {
            this._totalLength = 1;
          }

          material.dashSize = this._totalLength;
          material.gapSize = 0;
          material.needsUpdate = true;
        }
      });
    }
  }

  interpolate(alpha: number): void {
    if (this._useDashReveal) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          const visibleLength = (1 - alpha) * this._totalLength;
          material.dashSize = visibleLength;
          material.gapSize = this._totalLength - visibleLength + 0.0001;
          material.needsUpdate = true;
        }
      });
    } else {
      this.mobject.setOpacity(1 - alpha);
    }
  }

  override finish(): void {
    if (this._useDashReveal) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashSize = 0;
          material.gapSize = this._totalLength;
          material.needsUpdate = true;
        }
      });
    } else {
      this.mobject.setOpacity(0);
    }
    super.finish();
  }
}

/**
 * Create an Uncreate animation for a mobject.
 */
export function uncreate(mobject: Mobject, options?: AnimationOptions): Uncreate {
  return new Uncreate(mobject, options);
}

// =============================================================================
// Write Animations - specifically for Text mobjects
// =============================================================================

export interface WriteOptions extends AnimationOptions {
  /** Stagger between characters, default 0.05 */
  lagRatio?: number;
  /** Write in reverse (right to left), default false */
  reverse?: boolean;
  /** Remove after animation, default false */
  remover?: boolean;
}

/**
 * Write animation specifically for Text and MathTex mobjects.
 * Reveals text character by character with a pen-stroke effect.
 * Uses dash-based path tracing for VMobjects.
 */
export class Write extends Animation {
  /** Stagger ratio for future character-by-character implementation */
  protected readonly lagRatio: number;
  private _reverse: boolean;
  private _remover: boolean;
  private _originalOpacity: number = 1;
  private _useDashReveal: boolean = false;
  private _useRevealProgress: boolean = false;
  private _totalLength: number = 0;

  constructor(mobject: Mobject, options: WriteOptions = {}) {
    super(mobject, { duration: options.duration ?? 1, ...options });
    this.lagRatio = options.lagRatio ?? 0.05;
    this._reverse = options.reverse ?? false;
    this._remover = options.remover ?? false;
  }

  private _hasLine2Children(): boolean {
    let found = false;
    this.mobject.getThreeObject().traverse((child) => {
      if (child instanceof Line2) found = true;
    });
    return found;
  }

  override begin(): void {
    super.begin();
    this._originalOpacity = this.mobject.opacity;
    this._useDashReveal = (this.mobject instanceof VMobject) && this._hasLine2Children();
    this._useRevealProgress =
      'setRevealProgress' in this.mobject &&
      typeof (this.mobject as any).setRevealProgress === 'function';

    if (this._useDashReveal) {
      // Set up dash-based reveal for VMobjects with Line2 geometry
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;

          child.computeLineDistances();
          const geom = child.geometry as any;
          const distEnd = geom.attributes.instanceDistanceEnd;
          if (distEnd && distEnd.count > 0) {
            const arr = distEnd.data ? distEnd.data.array : distEnd.array;
            this._totalLength = arr[arr.length - 1] || 1;
          } else {
            this._totalLength = 1;
          }

          // Start based on direction
          if (this._reverse) {
            material.dashSize = this._totalLength;
            material.gapSize = 0;
          } else {
            material.dashSize = 0;
            material.gapSize = this._totalLength;
          }
          material.needsUpdate = true;
        }
      });
    } else if (this._useRevealProgress) {
      // Use progressive left-to-right reveal for Text/MathTex
      (this.mobject as any).setRevealProgress(this._reverse ? 1 : 0);
    } else {
      // Fallback: opacity
      this.mobject.setOpacity(this._reverse ? this._originalOpacity : 0);
    }
  }

  interpolate(alpha: number): void {
    let effectiveAlpha = this._reverse ? 1 - alpha : alpha;

    if (this._useDashReveal) {
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          const visibleLength = effectiveAlpha * this._totalLength;
          material.dashSize = visibleLength;
          material.gapSize = this._totalLength - visibleLength + 0.0001;
          material.needsUpdate = true;
        }
      });
    } else if (this._useRevealProgress) {
      // Progressive left-to-right reveal
      (this.mobject as any).setRevealProgress(effectiveAlpha);
    } else {
      // Fallback: opacity
      this.mobject.setOpacity(this._originalOpacity * effectiveAlpha);
    }
  }

  override finish(): void {
    if (this._remover) {
      if (this._useDashReveal) {
        const threeObj = this.mobject.getThreeObject();
        threeObj.traverse((child) => {
          if (child instanceof Line2) {
            const material = child.material as LineMaterial;
            material.dashSize = 0;
            material.gapSize = this._totalLength;
            material.needsUpdate = true;
          }
        });
      }
      if (this._useRevealProgress) {
        (this.mobject as any).setRevealProgress(0);
      }
      this.mobject.setOpacity(0);
    } else {
      if (this._useDashReveal) {
        const threeObj = this.mobject.getThreeObject();
        threeObj.traverse((child) => {
          if (child instanceof Line2) {
            const material = child.material as LineMaterial;
            material.dashed = false;
            material.needsUpdate = true;
          }
        });
      }
      if (this._useRevealProgress) {
        (this.mobject as any).setRevealProgress(1);
      }
      this.mobject.setOpacity(this._originalOpacity);
    }
    super.finish();
  }
}

/**
 * Create a Write animation for a mobject.
 * Progressively reveals text with a pen-stroke effect.
 * @param mobject The mobject to write (typically Text or MathTex)
 * @param options Write animation options
 */
export function write(mobject: Mobject, options?: WriteOptions): Write {
  return new Write(mobject, options);
}

/**
 * Unwrite animation - reverse of Write, erases text character by character.
 */
export class Unwrite extends Write {
  constructor(mobject: Mobject, options: WriteOptions = {}) {
    super(mobject, { ...options, reverse: true, remover: true });
  }
}

/**
 * Create an Unwrite animation for a mobject.
 * Progressively erases text with a pen-stroke effect.
 * @param mobject The mobject to unwrite (typically Text or MathTex)
 * @param options Write animation options
 */
export function unwrite(mobject: Mobject, options?: WriteOptions): Unwrite {
  return new Unwrite(mobject, options);
}

// =============================================================================
// Letter-by-Letter Animations
// =============================================================================

export interface AddTextLetterByLetterOptions extends AnimationOptions {
  /** Time per character in seconds, default 0.1 */
  timePerChar?: number;
}

/**
 * Types out text letter by letter (typewriter effect).
 * Works with Text mobjects that support partial text display.
 */
export class AddTextLetterByLetter extends Animation {
  /** Time per character for duration calculation */
  protected readonly timePerChar: number;
  private _fullText: string = '';

  constructor(mobject: Mobject, options: AddTextLetterByLetterOptions = {}) {
    const timePerChar = options.timePerChar ?? 0.1;
    // Duration depends on text length - will be set in begin()
    // For now, use a default or the provided duration
    super(mobject, { ...options, duration: options.duration ?? 1 });
    this.timePerChar = timePerChar;
  }

  override begin(): void {
    super.begin();
    if ('getText' in this.mobject && typeof (this.mobject as any).getText === 'function') {
      this._fullText = (this.mobject as any).getText();
      if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
        (this.mobject as any).setText('');
      }
    }
  }

  interpolate(alpha: number): void {
    if (
      'setText' in this.mobject &&
      typeof (this.mobject as any).setText === 'function' &&
      this._fullText
    ) {
      const numChars = Math.floor(alpha * this._fullText.length);
      (this.mobject as any).setText(this._fullText.substring(0, numChars));
    }
  }

  override finish(): void {
    if (
      'setText' in this.mobject &&
      typeof (this.mobject as any).setText === 'function' &&
      this._fullText
    ) {
      (this.mobject as any).setText(this._fullText);
    }
    super.finish();
  }
}

/**
 * Create an AddTextLetterByLetter animation.
 * Types out text letter by letter (typewriter effect).
 * @param mobject The mobject to animate (must support getText/setText)
 * @param options Animation options including timePerChar
 */
export function addTextLetterByLetter(
  mobject: Mobject,
  options?: AddTextLetterByLetterOptions
): AddTextLetterByLetter {
  return new AddTextLetterByLetter(mobject, options);
}

/**
 * Removes text letter by letter (reverse typewriter effect).
 * Works with Text mobjects that support partial text display.
 */
export class RemoveTextLetterByLetter extends Animation {
  /** Time per character for duration calculation */
  protected readonly timePerChar: number;
  private _fullText: string = '';

  constructor(mobject: Mobject, options: AddTextLetterByLetterOptions = {}) {
    const timePerChar = options.timePerChar ?? 0.1;
    super(mobject, { ...options, duration: options.duration ?? 1 });
    this.timePerChar = timePerChar;
  }

  override begin(): void {
    super.begin();
    if ('getText' in this.mobject && typeof (this.mobject as any).getText === 'function') {
      this._fullText = (this.mobject as any).getText();
    }
  }

  interpolate(alpha: number): void {
    if (
      'setText' in this.mobject &&
      typeof (this.mobject as any).setText === 'function' &&
      this._fullText
    ) {
      const numCharsToRemove = Math.floor(alpha * this._fullText.length);
      const remainingChars = this._fullText.length - numCharsToRemove;
      (this.mobject as any).setText(this._fullText.substring(0, remainingChars));
    }
  }

  override finish(): void {
    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      (this.mobject as any).setText('');
    }
    super.finish();
  }
}

/**
 * Create a RemoveTextLetterByLetter animation.
 * Removes text letter by letter (reverse typewriter effect).
 * @param mobject The mobject to animate (must support getText/setText)
 * @param options Animation options including timePerChar
 */
export function removeTextLetterByLetter(
  mobject: Mobject,
  options?: AddTextLetterByLetterOptions
): RemoveTextLetterByLetter {
  return new RemoveTextLetterByLetter(mobject, options);
}
