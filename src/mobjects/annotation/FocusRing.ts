/**
 * FocusRing: a manim-style emphasis ring drawn in the frame around the
 * projected outline of a 3D mobject.
 *
 * The repo's Circumscribe and Flash build their shapes in world space, which
 * does not read under a perspective camera (checked: nothing useful shows
 * around a Sphere in a ThreeDScene). Indicate does work on 3D meshes. This
 * ring lives in the HUD instead and re-centres on the projected target on
 * every frame, so it stays on the object while the camera moves.
 *
 * @example
 * ```ts
 * const ring = new FocusRing({ scene, target: sphere });
 * await scene.play(ring.flash()); // draw, then un-draw
 * ```
 */

import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation } from '../../animation/Animation';
import { Create } from '../../animation/creation/Create';
import { FadeOut } from '../../animation/fading/FadeOut';
import { ShowCreationThenDestruction } from '../../animation/indication/ShowCreationThenDestruction';
import { Circle } from '../geometry/Circle';
import {
  AnnotationScene,
  backgroundOf,
  frameSizeOf,
  pinToFrame,
  projectPoint,
  resolvePalette,
} from './annotationStyle';

export interface FocusRingOptions {
  /** Host scene (ThreeDScene). */
  scene: AnnotationScene;
  /** The mobject to ring. */
  target: Mobject;
  /** Ring colour. Default: manim yellow (#FFFF00) on dark, the text colour on light */
  color?: string;
  /** Gap between the outline and the ring (frame units). Default: 2% of the frame height */
  buff?: number;
  /** Stroke width. Default: 4 */
  strokeWidth?: number;
}

/** Projected centre and radius of a mobject's bounds, in frame units. */
export function projectedCircle(
  scene: AnnotationScene,
  mob: Mobject,
): { center: Vector3Tuple; radius: number } {
  const { min, max } = mob.getBounds();
  const c: Vector3Tuple = [(min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2];
  const pc = projectPoint(scene, c);
  let far = 0;
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z]) {
        const p = projectPoint(scene, [x, y, z]);
        far = Math.max(far, Math.hypot(p[0] - pc[0], p[1] - pc[1]));
      }
  // Box corners overshoot a round outline; 0.62 sits between a sphere's
  // silhouette (1/sqrt 3 of the corner) and a cube's corners.
  return { center: pc, radius: 0.62 * far };
}

export class FocusRing {
  readonly ring: Circle;
  private readonly _o: FocusRingOptions;
  private readonly _buff: number;
  private _unhook: (() => void) | null = null;

  constructor(options: FocusRingOptions) {
    this._o = options;
    const fr = frameSizeOf(options.scene);
    this._buff = options.buff ?? 0.02 * fr.height;
    const bg = backgroundOf(options.scene);
    const pal = resolvePalette(bg);
    const dark = pal.text.toUpperCase() === '#FFFFFF';
    this.ring = new Circle({
      radius: 1,
      color: options.color ?? (dark ? '#FFFF00' : pal.text),
      strokeWidth: options.strokeWidth ?? 4,
    });
    pinToFrame(options.scene, this.ring);
    this.layout();
    if (options.scene.addBeforeRenderHook) {
      this._unhook = options.scene.addBeforeRenderHook(() => this.layout());
    }
  }

  /** Re-fit the ring to the projected target. */
  layout(): void {
    const { center, radius } = projectedCircle(this._o.scene, this._o.target);
    const r = Math.max(radius + this._buff, 1e-3);
    // No change cache: a seek resets these mobjects to an animation's
    // snapshot, so the layout must be rewritten on every frame.
    // Write the transform directly: the ring is a unit circle at its local
    // origin. setWidth()/moveTo() would measure the current points, which a
    // partial draw (ShowCreationThenDestruction) has cut to an arc.
    this.ring.position.set(center[0], center[1], 0.03);
    this.ring.scaleVector.set(r, r, 1);
    this.ring._markDirty();
  }

  /** Draw the ring, then un-draw it (ShowCreationThenDestruction). */
  flash(options: { duration?: number } = {}): Animation {
    return new ShowCreationThenDestruction(this.ring, { duration: options.duration ?? 1.4 });
  }

  /** Draw the ring and keep it. */
  create(options: { duration?: number } = {}): Animation {
    return new Create(this.ring, { duration: options.duration ?? 0.8 });
  }

  /** Fade a kept ring out. */
  uncreate(options: { duration?: number } = {}): Animation {
    return new FadeOut(this.ring, { duration: options.duration ?? 0.4 });
  }

  /** Stop following the target. */
  dispose(): void {
    this._unhook?.();
    this._unhook = null;
  }
}
