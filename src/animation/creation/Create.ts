/**
 * Create animation - draws the mobject stroke progressively.
 * For VMobjects, this uses dashed lines to progressively reveal the stroke path,
 * similar to how Manim's Create animation works.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { TextGlyphGroup } from '../../mobjects/text/TextGlyphGroup';
import type { GlyphVMobject } from '../../mobjects/text/GlyphVMobject';

export interface CreateOptions extends AnimationOptions {
  /** Stagger ratio between submobjects (0 = simultaneous, higher = more stagger). Default: 0 */
  lagRatio?: number;
}

export class Create extends Animation {
  /** Whether to use dash-based reveal (needs Line2 children) */
  private _useDashReveal: boolean = false;
  /** Whether the mobject has fill that needs to be animated */
  private _hasFill: boolean = false;
  /** Original fill opacity to restore */
  private _originalFillOpacity: number = 0;
  /** Lag ratio for staggered submobject animation */
  private _lagRatio: number = 0;
  /** Individual Line2 children for per-child stagger */
  private _line2Children: Line2[] = [];
  /** Per-Line2 total lengths */
  private _line2TotalLengths: number[] = [];

  constructor(mobject: Mobject, options: CreateOptions = {}) {
    // Manim default for Create is 2 seconds
    super(mobject, { duration: options.duration ?? 2, ...options });
    this._lagRatio = options.lagRatio ?? 0;
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
   * Set up the animation - configure dashed lines for progressive reveal.
   * For filled VMobjects (like Polygon with fillOpacity > 0), this behaves
   * like Manim's DrawBorderThenFill: first half draws the border, second
   * half fades in the fill.
   */
  override begin(): void {
    super.begin();

    this._useDashReveal = (this.mobject instanceof VMobject) && this._hasLine2Children();

    if (this._useDashReveal) {
      const vmob = this.mobject as VMobject;

      // Check if this VMobject has fill
      this._originalFillOpacity = vmob.fillOpacity;
      this._hasFill = this._originalFillOpacity > 0;

      // Hide fill initially so it can fade in during second half
      if (this._hasFill) {
        vmob.setFillOpacity(0);
      }

      // Collect all Line2 children for per-child stagger support
      this._line2Children = [];
      this._line2TotalLengths = [];
      const threeObj = this.mobject.getThreeObject();
      threeObj.traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = true;
          material.dashScale = 1;

          child.computeLineDistances();
          const geom = child.geometry as any;
          const distEnd = geom.attributes.instanceDistanceEnd;
          let totalLen = 1;
          if (distEnd && distEnd.count > 0) {
            const arr = distEnd.data ? distEnd.data.array : distEnd.array;
            totalLen = arr[arr.length - 1] || 1;
          }
          this._line2Children.push(child);
          this._line2TotalLengths.push(totalLen);

          // Start with nothing visible
          material.dashSize = 0;
          material.gapSize = totalLen;
          material.needsUpdate = true;
        }
      });
    } else {
      // Non-line mobject (Text, etc.): use opacity
      this.mobject.setOpacity(0);
    }
  }

  /**
   * Interpolate the dash size to progressively reveal the stroke.
   * For filled VMobjects: first half draws border, second half fades in fill.
   */
  /**
   * Compute per-child alpha with lag stagger.
   * With lagRatio=0, all children animate together.
   * With lagRatio>0, each child starts slightly after the previous.
   */
  private _childAlpha(alpha: number, childIndex: number, totalChildren: number): number {
    if (this._lagRatio <= 0 || totalChildren <= 1) return alpha;
    const maxStagger = Math.min(this._lagRatio, 0.99);
    const childStart = (childIndex / Math.max(1, totalChildren - 1)) * maxStagger;
    const childWindow = 1 - maxStagger;
    return Math.max(0, Math.min(1, (alpha - childStart) / childWindow));
  }

  interpolate(alpha: number): void {
    if (this._useDashReveal) {
      const n = this._line2Children.length;

      if (this._hasFill) {
        // Two-phase animation: border then fill (like Manim's DrawBorderThenFill)
        const vmob = this.mobject as VMobject;
        if (alpha < 0.5) {
          vmob.setFillOpacity(0);
          const strokeAlpha = alpha * 2;
          for (let i = 0; i < n; i++) {
            const cAlpha = this._childAlpha(strokeAlpha, i, n);
            const totalLen = this._line2TotalLengths[i];
            const material = this._line2Children[i].material as LineMaterial;
            const visibleLength = cAlpha * totalLen;
            material.dashSize = visibleLength;
            material.gapSize = totalLen - visibleLength + 0.0001;
            material.needsUpdate = true;
          }
        } else {
          const fillAlpha = (alpha - 0.5) * 2;
          vmob.setFillOpacity(this._originalFillOpacity * fillAlpha);
          for (let i = 0; i < n; i++) {
            const totalLen = this._line2TotalLengths[i];
            const material = this._line2Children[i].material as LineMaterial;
            if (material.dashed) {
              material.dashSize = totalLen;
              material.gapSize = 0.0001;
              material.needsUpdate = true;
            }
          }
        }
      } else {
        // No fill: stroke reveal with per-child stagger
        for (let i = 0; i < n; i++) {
          const cAlpha = this._childAlpha(alpha, i, n);
          const totalLen = this._line2TotalLengths[i];
          const material = this._line2Children[i].material as LineMaterial;
          const visibleLength = cAlpha * totalLen;
          material.dashSize = visibleLength;
          material.gapSize = totalLen - visibleLength + 0.0001;
          material.needsUpdate = true;
        }
      }
    } else {
      this.mobject.setOpacity(alpha);
    }
  }

  /**
   * Ensure stroke is fully visible at the end
   */
  override finish(): void {
    if (this._useDashReveal) {
      // Restore fill opacity
      if (this._hasFill) {
        (this.mobject as VMobject).setFillOpacity(this._originalFillOpacity);
      }

      // Disable dashing, show full stroke
      for (const child of this._line2Children) {
        const material = child.material as LineMaterial;
        material.dashed = false;
        material.needsUpdate = true;
      }
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
export function create(mobject: Mobject, options?: CreateOptions): Create {
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
  /** Ratio of animation time spent on stroke drawing vs cross-fade (default 0.7 = 70% stroke, 30% crossfade) */
  strokeRatio?: number;
  /**
   * When true, the Write animation uses the glyph's skeleton (medial axis)
   * for stroke drawing, producing natural center-line pen strokes instead
   * of perimeter outlines. Requires glyphs to be loaded with
   * `useSkeletonStroke: true`. Default: false (uses outline strokes).
   */
  useSkeletonStroke?: boolean;
}

/**
 * Write animation specifically for Text and MathTex mobjects.
 * Reveals text character by character with a pen-stroke effect.
 *
 * Rendering paths:
 * 1. Glyph stroke mode — Text with loaded glyph group (via loadGlyphs()) gets stroke-draw
 *    of each character's outline, then cross-fades to the Canvas 2D texture.
 * 2. Dash-based reveal — for VMobjects that already have Line2 children.
 * 3. Opacity fallback.
 */
export class Write extends Animation {
  protected readonly lagRatio: number;
  private _reverse: boolean;
  private _remover: boolean;
  private _strokeRatio: number;
  private _originalOpacity: number = 1;

  // Rendering mode flags (mutually exclusive)
  private _useGlyphStroke: boolean = false;
  private _useDashReveal: boolean = false;
  private _useRevealProgress: boolean = false;

  // Dash reveal state
  private _totalLength: number = 0;

  // Glyph stroke state
  private _glyphGroup: TextGlyphGroup | null = null;
  private _textMesh: THREE.Mesh | null = null;
  private _glyphTotalLengths: number[] = [];
  private _parentThreeObj: THREE.Object3D | null = null;

  // Skeleton stroke state: when a glyph has a skeleton, we create
  // a temporary VMobject with skeleton points and animate that instead.
  // _skeletonVMobs[i] is non-null if glyph child i has a skeleton path.
  private _skeletonVMobs: (VMobject | null)[] = [];
  private _skeletonTotalLengths: number[] = [];

  constructor(mobject: Mobject, options: WriteOptions = {}) {
    super(mobject, { duration: options.duration ?? 1, ...options });
    this.lagRatio = options.lagRatio ?? 0.05;
    this._reverse = options.reverse ?? false;
    this._remover = options.remover ?? false;
    this._strokeRatio = options.strokeRatio ?? 0.7;
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

    // Priority 1: Check for glyph stroke mode
    if (
      'getGlyphGroup' in this.mobject &&
      typeof (this.mobject as any).getGlyphGroup === 'function'
    ) {
      const glyphGroup = (this.mobject as any).getGlyphGroup() as TextGlyphGroup | null;
      if (glyphGroup && glyphGroup.length > 0) {
        this._useGlyphStroke = true;
        this._glyphGroup = glyphGroup;
        this._beginGlyphStroke();
        return;
      }
    }

    // Priority 2: Left-to-right reveal for mobjects with setRevealProgress (MathTex)
    if (
      'setRevealProgress' in this.mobject &&
      typeof (this.mobject as any).setRevealProgress === 'function'
    ) {
      this._useRevealProgress = true;
      (this.mobject as any).setRevealProgress(this._reverse ? 1 : 0);
      return;
    }

    // Priority 3: Dash reveal for VMobjects with Line2
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
    } else {
      this.mobject.setOpacity(this._reverse ? this._originalOpacity : 0);
    }
  }

  /**
   * Set up glyph-stroke mode: hide the texture mesh, attach the glyph group
   * to the Text's Three.js parent, and prepare dash reveal for each glyph child.
   *
   * When a glyph has a skeleton path (medial axis), a temporary VMobject is
   * created with the skeleton points and used for the dash-reveal animation
   * instead of the outline. The outline glyph is hidden in that case.
   */
  private _beginGlyphStroke(): void {
    const glyphGroup = this._glyphGroup!;

    // Hide the Text's texture mesh
    if (
      'getTextureMesh' in this.mobject &&
      typeof (this.mobject as any).getTextureMesh === 'function'
    ) {
      this._textMesh = (this.mobject as any).getTextureMesh() as THREE.Mesh | null;
    }
    if (this._textMesh) {
      this._textMesh.visible = false;
    }

    // Attach glyph group's Three.js object to the Text's Three.js parent
    const textThreeObj = this.mobject.getThreeObject();
    this._parentThreeObj = textThreeObj;
    const glyphThreeObj = glyphGroup.getThreeObject();

    // Position glyph group to align with Text — copy world transform
    // The glyphs are built in pixel-world space matching the Text's coordinate system
    this._parentThreeObj.add(glyphThreeObj);

    // Set up dash reveal for each glyph child's Line2 children
    this._glyphTotalLengths = [];
    this._skeletonVMobs = [];
    this._skeletonTotalLengths = [];
    const children = glyphGroup.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childThreeObj = child.getThreeObject();

      // Check if this glyph has a skeleton path
      const glyphChild = child as unknown as GlyphVMobject;
      let skeletonPath: number[][] | null = null;
      if (
        'getSkeletonPath' in glyphChild &&
        typeof (glyphChild as any).getSkeletonPath === 'function'
      ) {
        skeletonPath = (glyphChild as any).getSkeletonPath() as number[][] | null;
      }

      if (skeletonPath && skeletonPath.length >= 4) {
        // --- Skeleton mode for this glyph ---
        // Hide the outline glyph
        childThreeObj.visible = false;

        // Create a temporary VMobject with skeleton points
        const skelVMob = new VMobject();
        skelVMob.setColor(child.color || '#ffffff');
        skelVMob.strokeWidth = (child as any).strokeWidth ?? 2;
        skelVMob.fillOpacity = 0;
        skelVMob.setPoints3D(skeletonPath);

        // Attach skeleton VMobject's Three.js object into the glyph group
        const skelThreeObj = skelVMob.getThreeObject();
        glyphThreeObj.add(skelThreeObj);

        // Set up dash reveal on the skeleton's Line2
        let skelTotalLen = 1;
        skelThreeObj.traverse((obj) => {
          if (obj instanceof Line2) {
            const material = obj.material as LineMaterial;
            material.dashed = true;
            material.dashScale = 1;

            obj.computeLineDistances();
            const geom = obj.geometry as any;
            const distEnd = geom.attributes.instanceDistanceEnd;
            if (distEnd && distEnd.count > 0) {
              const arr = distEnd.data ? distEnd.data.array : distEnd.array;
              skelTotalLen = arr[arr.length - 1] || 1;
            }

            material.dashSize = 0;
            material.gapSize = skelTotalLen;
            material.needsUpdate = true;
          }
        });

        this._skeletonVMobs.push(skelVMob);
        this._skeletonTotalLengths.push(skelTotalLen);
        this._glyphTotalLengths.push(1); // placeholder (unused when skeleton active)
      } else {
        // --- Standard outline mode for this glyph ---
        this._skeletonVMobs.push(null);
        this._skeletonTotalLengths.push(0);

        let totalLen = 1;
        childThreeObj.traverse((obj) => {
          if (obj instanceof Line2) {
            const material = obj.material as LineMaterial;
            material.dashed = true;
            material.dashScale = 1;

            obj.computeLineDistances();
            const geom = obj.geometry as any;
            const distEnd = geom.attributes.instanceDistanceEnd;
            if (distEnd && distEnd.count > 0) {
              const arr = distEnd.data ? distEnd.data.array : distEnd.array;
              totalLen = arr[arr.length - 1] || 1;
            }

            // Start fully hidden
            material.dashSize = 0;
            material.gapSize = totalLen;
            material.needsUpdate = true;
          }
        });

        this._glyphTotalLengths.push(totalLen);
      }
    }
  }

  interpolate(alpha: number): void {
    const effectiveAlpha = this._reverse ? 1 - alpha : alpha;

    if (this._useGlyphStroke) {
      this._interpolateGlyphStroke(effectiveAlpha);
    } else if (this._useRevealProgress) {
      (this.mobject as any).setRevealProgress(effectiveAlpha);
    } else if (this._useDashReveal) {
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
      this.mobject.setOpacity(this._originalOpacity * effectiveAlpha);
    }
  }

  /**
   * Glyph stroke interpolation:
   * Phase 1 (0 -> strokeRatio): Dash-reveal glyph outlines (or skeletons) with lag stagger
   * Phase 2 (strokeRatio -> 1): Cross-fade from glyph strokes to texture mesh
   *
   * When a glyph has a skeleton VMobject, the skeleton is used for the
   * dash-reveal animation instead of the outline, producing a natural
   * center-line pen-stroke effect.
   */
  private _interpolateGlyphStroke(alpha: number): void {
    const glyphGroup = this._glyphGroup!;
    const children = glyphGroup.children;
    const numChildren = children.length;
    const strokeRatio = this._strokeRatio;

    if (alpha <= strokeRatio) {
      // Phase 1: Progressive dash-reveal across all glyph children
      const strokeAlpha = alpha / strokeRatio; // normalize to 0-1

      for (let i = 0; i < numChildren; i++) {
        // Compute per-character alpha with stagger
        const charStart = (i / numChildren) * (1 - this.lagRatio);
        const charEnd = charStart + this.lagRatio + (1 - this.lagRatio) / numChildren;
        const charAlpha = Math.max(0, Math.min(1, (strokeAlpha - charStart) / (charEnd - charStart)));

        const skelVMob = this._skeletonVMobs[i];

        if (skelVMob) {
          // Skeleton mode: animate the skeleton VMobject
          const totalLen = this._skeletonTotalLengths[i] || 1;
          const skelThreeObj = skelVMob.getThreeObject();

          skelThreeObj.traverse((obj) => {
            if (obj instanceof Line2) {
              const material = obj.material as LineMaterial;
              const visibleLength = charAlpha * totalLen;
              material.dashSize = visibleLength;
              material.gapSize = totalLen - visibleLength + 0.0001;
              material.needsUpdate = true;
            }
          });
        } else {
          // Standard outline mode
          const totalLen = this._glyphTotalLengths[i] || 1;
          const child = children[i];
          const childThreeObj = child.getThreeObject();

          childThreeObj.traverse((obj) => {
            if (obj instanceof Line2) {
              const material = obj.material as LineMaterial;
              const visibleLength = charAlpha * totalLen;
              material.dashSize = visibleLength;
              material.gapSize = totalLen - visibleLength + 0.0001;
              material.needsUpdate = true;
            }
          });
        }
      }

      // Ensure texture mesh stays hidden during stroke phase
      if (this._textMesh) {
        this._textMesh.visible = false;
      }
    } else {
      // Phase 2: Cross-fade — strokes fully visible, fade in texture, fade out strokes
      const fadeAlpha = (alpha - strokeRatio) / (1 - strokeRatio); // normalize to 0-1

      // Ensure all glyph strokes are fully revealed, then fade out
      for (let i = 0; i < numChildren; i++) {
        const skelVMob = this._skeletonVMobs[i];

        if (skelVMob) {
          // Fade out skeleton stroke
          const totalLen = this._skeletonTotalLengths[i] || 1;
          const skelThreeObj = skelVMob.getThreeObject();

          skelThreeObj.traverse((obj) => {
            if (obj instanceof Line2) {
              const material = obj.material as LineMaterial;
              material.dashSize = totalLen;
              material.gapSize = 0.0001;
              material.opacity = 1 - fadeAlpha;
              material.needsUpdate = true;
            }
          });
        } else {
          // Fade out outline stroke
          const totalLen = this._glyphTotalLengths[i] || 1;
          const child = children[i];
          const childThreeObj = child.getThreeObject();

          childThreeObj.traverse((obj) => {
            if (obj instanceof Line2) {
              const material = obj.material as LineMaterial;
              material.dashSize = totalLen;
              material.gapSize = 0.0001;
              material.opacity = 1 - fadeAlpha;
              material.needsUpdate = true;
            }
          });
        }
      }

      // Fade in the texture mesh
      if (this._textMesh) {
        this._textMesh.visible = true;
        const material = this._textMesh.material as THREE.MeshBasicMaterial;
        if (material) {
          material.opacity = this._originalOpacity * fadeAlpha;
        }
      }
    }
  }

  override finish(): void {
    if (this._useGlyphStroke) {
      this._finishGlyphStroke();
      super.finish();
      return;
    }

    if (this._useRevealProgress) {
      if (this._remover) {
        (this.mobject as any).setRevealProgress(0);
      } else {
        (this.mobject as any).setRevealProgress(1);
      }
      super.finish();
      return;
    }

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
      this.mobject.setOpacity(this._originalOpacity);
    }
    super.finish();
  }

  /**
   * Clean up glyph stroke mode: remove glyph group and skeleton VMobjects
   * from scene, restore texture mesh to full opacity.
   */
  private _finishGlyphStroke(): void {
    const glyphGroup = this._glyphGroup!;
    const glyphThreeObj = glyphGroup.getThreeObject();

    if (this._remover) {
      // Unwrite: hide everything
      if (this._textMesh) {
        this._textMesh.visible = false;
      }
      this.mobject.setOpacity(0);
    } else {
      // Write complete: show texture, hide glyphs
      if (this._textMesh) {
        this._textMesh.visible = true;
        const material = this._textMesh.material as THREE.MeshBasicMaterial;
        if (material) {
          material.opacity = this._originalOpacity;
        }
      }
      this.mobject.setOpacity(this._originalOpacity);
    }

    // Clean up skeleton VMobjects
    for (let i = 0; i < this._skeletonVMobs.length; i++) {
      const skelVMob = this._skeletonVMobs[i];
      if (skelVMob) {
        const skelThreeObj = skelVMob.getThreeObject();
        // Remove skeleton Three.js object from glyph group
        glyphThreeObj.remove(skelThreeObj);
        // Restore outline glyph visibility
        if (i < glyphGroup.children.length) {
          glyphGroup.children[i].getThreeObject().visible = true;
        }
        // Dispose skeleton VMobject resources
        skelVMob.dispose();
      }
    }
    this._skeletonVMobs = [];
    this._skeletonTotalLengths = [];

    // Remove glyph group from the Three.js scene
    if (this._parentThreeObj) {
      this._parentThreeObj.remove(glyphThreeObj);
    }

    // Disable dashing on glyph strokes
    for (const child of glyphGroup.children) {
      child.getThreeObject().traverse((obj) => {
        if (obj instanceof Line2) {
          const material = obj.material as LineMaterial;
          material.dashed = false;
          material.needsUpdate = true;
        }
      });
    }

    this._glyphGroup = null;
    this._textMesh = null;
    this._parentThreeObj = null;
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
