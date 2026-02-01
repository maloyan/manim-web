/**
 * ShowCreationThenDestruction animation - progressively draws a mobject's
 * stroke in the first half, then progressively erases it in the second half.
 *
 * This mimics Manim's ShowCreationThenDestruction, which is a variant of
 * ShowCreation (Create) that reverses the drawing process after reaching
 * full visibility.
 *
 * For VMobjects with Line2 children, uses dash-based reveal/hide.
 * For other mobjects, falls back to opacity fade in/out.
 */

import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { linear } from '../../rate-functions';

export interface ShowCreationThenDestructionOptions extends AnimationOptions {
  // No additional options beyond standard AnimationOptions
}

export class ShowCreationThenDestruction extends Animation {
  /** Total path length for dash-based reveal */
  private _totalLength: number = 0;
  /** Whether to use dash-based reveal (needs Line2 children) */
  private _useDashReveal: boolean = false;

  constructor(mobject: Mobject, options: ShowCreationThenDestructionOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 2,
      rateFunc: options.rateFunc ?? linear,
    });
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
      // Non-line mobject: start invisible
      this.mobject.setOpacity(0);
    }
  }

  interpolate(alpha: number): void {
    // First half (alpha 0..0.5): create/draw progressively
    // Second half (alpha 0.5..1): un-create/erase progressively
    let effectiveAlpha: number;
    if (alpha <= 0.5) {
      effectiveAlpha = 2 * alpha;
    } else {
      effectiveAlpha = 2 * (1 - alpha);
    }

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
    } else {
      this.mobject.setOpacity(effectiveAlpha);
    }
  }

  override finish(): void {
    // End state: mobject should be invisible (fully erased)
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
 * Create a ShowCreationThenDestruction animation for a mobject.
 * First half draws the stroke progressively; second half erases it.
 * @param mobject The mobject to animate (should be a VMobject for best effect)
 * @param options Animation options (duration, rateFunc)
 */
export function showCreationThenDestruction(
  mobject: Mobject,
  options?: ShowCreationThenDestructionOptions
): ShowCreationThenDestruction {
  return new ShowCreationThenDestruction(mobject, options);
}
