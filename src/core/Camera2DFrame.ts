/**
 * Camera2DFrame — a VMobject that represents the Camera2D viewport.
 *
 * In Python Manim, `self.camera.frame` is a VGroup whose position and
 * scale control what the viewer sees.  ManimWeb mirrors that API:
 *
 *   scene.camera.frame.saveState();
 *   scene.camera.frame.generateTarget();
 *   scene.camera.frame.targetCopy!.scale(0.5);
 *   (scene.camera.frame.targetCopy as Camera2DFrame).moveTo(dot.getCenter());
 *   await scene.play(new MoveToTarget(scene.camera.frame));
 *   // later...
 *   await scene.play(new Restore(scene.camera.frame));
 *
 * Internally the frame stores the camera state in its Mobject transform
 * (position → camera center, scaleVector → zoom level) and syncs it back
 * to the underlying Camera2D whenever it changes.
 */

import { Camera2D } from './Camera';
import { VMobject } from './VMobject';
import { Mobject, Vector3Tuple } from './Mobject';

export class Camera2DFrame extends VMobject {
  private _camera: Camera2D;
  private _baseFrameWidth: number;
  private _baseFrameHeight: number;
  private _isPrimary: boolean;

  /**
   * @param camera     The Camera2D this frame controls
   * @param isPrimary  If true, changes to this frame sync to the camera.
   *                   Copies created by copy() / generateTarget() are
   *                   non-primary so they don't affect the camera directly.
   */
  constructor(camera: Camera2D, isPrimary = true) {
    super();
    this._camera = camera;
    this._isPrimary = isPrimary;
    this._baseFrameWidth = camera.frameWidth;
    this._baseFrameHeight = camera.frameHeight;

    // Invisible — the frame never renders on screen
    this.opacity = 0;
    this.fillOpacity = 0;
    this.strokeWidth = 0;

    // Give it a small set of dummy Bezier points so that
    // VMobject operations (alignPoints, copy, Transform) work.
    this.setPoints3D([
      [0, 0, 0], [0.33, 0, 0], [0.66, 0, 0], [1, 0, 0],
      [1, 0.33, 0], [1, 0.66, 0], [1, 1, 0],
      [0.66, 1, 0], [0.33, 1, 0], [0, 1, 0],
      [0, 0.66, 0], [0, 0.33, 0], [0, 0, 0],
    ]);

    if (isPrimary) {
      // Initialize position from the current camera center
      const pos = camera.position;
      this.position.set(pos.x, pos.y, 0);
    }
  }

  // ── Sync helpers ──────────────────────────────────────────────

  /** Push the current Mobject transform (position + scale) to Camera2D. */
  private _syncToCamera(): void {
    this._camera.frameWidth = this._baseFrameWidth * this.scaleVector.x;
    this._camera.frameHeight = this._baseFrameHeight * this.scaleVector.y;
    this._camera.moveTo([
      this.position.x,
      this.position.y,
      this._camera.position.z,
    ]);
  }

  /**
   * Override _markDirty so every transform change propagates to the camera.
   * This is called by moveTo, scale, shift, and by Transform.interpolate().
   */
  override _markDirty(): void {
    super._markDirty();
    if (this._isPrimary) {
      this._syncToCamera();
    }
  }

  // ── Mobject overrides ─────────────────────────────────────────

  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Move the camera viewport so it is centered on `target`.
   * Accepts a [x,y,z] point or a Mobject.
   */
  override moveTo(target: Vector3Tuple | Mobject, _alignedEdge?: Vector3Tuple): this {
    if (Array.isArray(target)) {
      this.position.set(target[0], target[1], target[2] ?? 0);
      this._markDirty();
      return this;
    }
    // Mobject target — center on its getCenter()
    const pt = (target as Mobject).getCenter();
    this.position.set(pt[0], pt[1], 0);
    this._markDirty();
    return this;
  }

  // ── Copy / clone ──────────────────────────────────────────────

  protected override _createCopy(): Camera2DFrame {
    const copy = new Camera2DFrame(this._camera, false);
    copy._baseFrameWidth = this._baseFrameWidth;
    copy._baseFrameHeight = this._baseFrameHeight;
    copy.position.copy(this.position);
    copy.scaleVector.copy(this.scaleVector);
    copy.rotation.copy(this.rotation);
    copy.opacity = this.opacity;
    copy.fillOpacity = this.fillOpacity;
    copy.strokeWidth = this.strokeWidth;
    const pts = this.getPoints();
    if (pts.length > 0) copy.setPoints3D(pts);
    return copy;
  }
}
