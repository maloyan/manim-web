import * as THREE from 'three';
import { Scene, SceneOptions } from './Scene';
import { Mobject } from './Mobject';
import { Rectangle } from '../mobjects/geometry/Rectangle';
import { Animation, AnimationOptions } from '../animation/Animation';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * Options for configuring a ZoomedScene.
 */
export interface ZoomedSceneOptions extends SceneOptions {
  /** Width of the zoom camera frame in world units. Defaults to 3. */
  cameraFrameWidth?: number;
  /** Height of the zoom camera frame in world units. Defaults to 3. */
  cameraFrameHeight?: number;
  /** Default zoom factor (frame.width / display.width). Defaults to 0.3. */
  zoomFactor?: number;
  /** Width of the zoomed display in world units. Defaults to 3. */
  displayWidth?: number;
  /** Height of the zoomed display in world units. Defaults to 3. */
  displayHeight?: number;
  /** Color of the camera frame border. Defaults to '#FFFF00'. */
  cameraFrameColor?: string;
  /** Color of the display frame border. Defaults to '#FFFF00'. */
  displayFrameColor?: string;
  /** Stroke width of camera frame. Defaults to 3. */
  cameraFrameStrokeWidth?: number;
  /** Stroke width of display frame. Defaults to 3. */
  displayFrameStrokeWidth?: number;
  /** Size of render target in pixels. Defaults to 512. */
  renderTargetSize?: number;
  /** Corner direction for zoomed display [x, y, z]. Defaults to UP+RIGHT [1,1,0]. */
  displayCorner?: [number, number, number];
  /** Buffer from corner edges. Defaults to 0.5. */
  displayCornerBuff?: number;
}

/**
 * Helper: the zoomed camera with its visible frame rectangle.
 */
class ZoomedCamera {
  /** The visible frame rectangle showing the zoom region */
  readonly frame: Rectangle;

  constructor(width: number, height: number, color: string, strokeWidth: number) {
    this.frame = new Rectangle({
      width,
      height,
      color,
      strokeWidth,
    });
    this.frame.fillOpacity = 0;
  }
}

/**
 * Helper: a Mobject that contains both the render-target texture mesh
 * and a visible display frame border.
 */
class ZoomedDisplay extends Mobject {
  /** The visible border of the display window */
  readonly displayFrame: Rectangle;

  /** The THREE.Mesh showing the zoomed texture */
  private _imageMesh: THREE.Mesh;

  /** Width/height in world units */
  private _width: number;
  private _height: number;

  constructor(
    width: number,
    height: number,
    renderTarget: THREE.WebGLRenderTarget,
    color: string,
    strokeWidth: number,
  ) {
    super();
    this._width = width;
    this._height = height;

    // Create the display frame (visible border)
    this.displayFrame = new Rectangle({
      width,
      height,
      color,
      strokeWidth,
    });
    this.displayFrame.fillOpacity = 0;
    this.displayFrame.useStrokeMesh = true;

    // Make displayFrame a Mobject child so parent->child dirty propagation
    // works (needed for world-space miter recomputation after Scale animations)
    this.add(this.displayFrame);

    // Create the image mesh (shows the render target texture)
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: renderTarget.texture,
      side: THREE.FrontSide,
      depthTest: false,
    });
    this._imageMesh = new THREE.Mesh(geometry, material);
    this._imageMesh.position.z = -0.01; // Behind frame
  }

  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    // Add image mesh
    group.add(this._imageMesh);
    // Add display frame's THREE object, rendered after image so it paints on top
    // (both have depthTest=false, so render order determines visibility)
    const frameObj = this.displayFrame.getThreeObject();
    frameObj.traverse((child: THREE.Object3D) => {
      child.renderOrder = 1;
    });
    group.add(frameObj);
    return group;
  }

  override _syncToThree(): void {
    if (this._dirty) {
      this.displayFrame._dirty = true;
      // Note: we intentionally do NOT force _geometryDirty here.
      // The displayFrame stroke mesh scales naturally with the parent
      // transform. Forcing _geometryDirty on every frame during Scale/pop-out
      // animations causes expensive per-frame stroke mesh rebuilds that crash
      // the browser in ZoomedScene dual-pass rendering.
    }
    super._syncToThree();
  }

  protected _createCopy(): Mobject {
    // ZoomedDisplay holds a render-target-backed mesh and cannot be
    // meaningfully deep-cloned.  Return a lightweight Mobject stand-in
    // so Animation.begin() can snapshot pre-animation state.
    // CRITICAL: never return `this` -- Mobject.copy() iterates children
    // and adds copies back to clone, causing an infinite loop when
    // clone === this.
    return new (class extends Mobject {
      protected _createThreeObject() {
        return new THREE.Group();
      }
      protected _createCopy() {
        return new (this.constructor as new () => Mobject)();
      }
    })();
  }

  getWidth(): number {
    return this._width * this.scaleVector.x;
  }

  getHeight(): number {
    return this._height * this.scaleVector.y;
  }
}

/**
 * Animation that pops the zoomed display out from the camera frame to its
 * target position, mimicking Manim's get_zoomed_display_pop_out_animation().
 *
 * In begin(), the display's current position/scale are saved, then the display
 * is snapped onto the camera frame via replace(frame, stretch=true).
 * interpolate(alpha) lerps from frame-matched state (alpha=0) to the saved
 * original state (alpha=1). Works with reversed rate functions for reverse
 * pop-out.
 */
export class ZoomDisplayPopOut extends Animation {
  private _savedPosition: THREE.Vector3 | null = null;
  private _savedScale: THREE.Vector3 | null = null;
  private _startPosition: THREE.Vector3 | null = null;
  private _startScale: THREE.Vector3 | null = null;
  private _frame: Mobject;

  constructor(display: Mobject, frame: Mobject, options?: AnimationOptions) {
    super(display, options);
    this._frame = frame;
  }

  begin(): void {
    super.begin();
    const display = this.mobject;

    // Save the display's current (target) position and scale
    this._savedPosition = display.position.clone();
    this._savedScale = display.scaleVector.clone();

    // Snap display onto the frame (stretch to match frame dimensions)
    display.replace(this._frame, true);

    // Save the frame-matched (start) position and scale
    this._startPosition = display.position.clone();
    this._startScale = display.scaleVector.clone();
  }

  interpolate(alpha: number): void {
    if (!this._startPosition || !this._startScale || !this._savedPosition || !this._savedScale) {
      return;
    }
    const display = this.mobject;

    // Lerp position from frame-matched to saved target
    display.position.lerpVectors(this._startPosition, this._savedPosition, alpha);

    // Lerp scale from frame-matched to saved target
    display.scaleVector.x = this._startScale.x + (this._savedScale.x - this._startScale.x) * alpha;
    display.scaleVector.y = this._startScale.y + (this._savedScale.y - this._startScale.y) * alpha;
    display.scaleVector.z = this._startScale.z + (this._savedScale.z - this._startScale.z) * alpha;

    display._markDirty();
  }

  finish(): void {
    // Apply final state via the last interpolation (respects rateFunc).
    // For forward pop-out, rateFunc(1) = 1, so display ends at saved position.
    // For reverse pop-out, rateFunc(1) = 0, so display ends at frame-matched position.
    const finalAlpha = this.rateFunc(1.0);
    this.interpolate(finalAlpha);
    super.finish();
  }
}

/**
 * Scene with zoom/magnification capability.
 * Displays a zoomed view of a region in a separate window, using Mobject-based
 * camera frame and display objects compatible with Manim animations.
 */
export class ZoomedScene extends Scene {
  /** The zoomed camera with its frame */
  readonly zoomedCamera: ZoomedCamera;

  /** The zoomed display (texture + border) */
  readonly zoomedDisplay: ZoomedDisplay;

  /** Whether zooming is currently active */
  private _zoomActive: boolean = false;

  /** Render target for zoomed view */
  private _zoomRenderTarget: THREE.WebGLRenderTarget;

  /** Default display position (for reset in clear()) */
  private _displayDefaultPos: [number, number, number];

  /** Dedicated orthographic camera for zoom render pass (avoids mutating scene camera) */
  private _zoomCamera: THREE.OrthographicCamera;

  /** Cached THREE objects reused every frame to avoid per-frame allocations */
  private _frameBounds = new THREE.Box3();
  private _frameSize = new THREE.Vector3();
  private _viewportSize = new THREE.Vector2();

  constructor(container: HTMLElement, options: ZoomedSceneOptions = {}) {
    super(container, options);

    const displayWidth = options.displayWidth ?? 3;
    const displayHeight = options.displayHeight ?? 3;
    const zoomFactor = options.zoomFactor ?? 0.3;
    const cameraFrameWidth = options.cameraFrameWidth ?? displayWidth * zoomFactor;
    const cameraFrameHeight = options.cameraFrameHeight ?? displayHeight * zoomFactor;
    const cameraFrameColor = options.cameraFrameColor ?? '#FFFF00';
    const displayFrameColor = options.displayFrameColor ?? '#FFFF00';
    const cameraFrameStrokeWidth = options.cameraFrameStrokeWidth ?? 3;
    const displayFrameStrokeWidth = options.displayFrameStrokeWidth ?? 3;
    const renderTargetSize = options.renderTargetSize ?? 512;

    // Create render target
    this._zoomRenderTarget = new THREE.WebGLRenderTarget(renderTargetSize, renderTargetSize, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      generateMipmaps: false,
    });

    // Create dedicated camera for zoom render pass (separate from scene camera)
    this._zoomCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this._zoomCamera.position.set(0, 0, 10);
    this._zoomCamera.lookAt(0, 0, 0);

    // Create zoomed camera
    this.zoomedCamera = new ZoomedCamera(
      cameraFrameWidth,
      cameraFrameHeight,
      cameraFrameColor,
      cameraFrameStrokeWidth,
    );
    this.zoomedDisplay = new ZoomedDisplay(
      displayWidth,
      displayHeight,
      this._zoomRenderTarget,
      displayFrameColor,
      displayFrameStrokeWidth,
    );

    // Position zoomed display at corner (default: upper-right, matching Python Manim)
    const corner = options.displayCorner ?? [1, 1, 0];
    const cornerBuff = options.displayCornerBuff ?? 0.5;
    const frameW = this.camera.frameWidth;
    const frameH = this.camera.frameHeight;
    const dx = corner[0] !== 0 ? corner[0] * (frameW / 2 - cornerBuff - displayWidth / 2) : 0;
    const dy = corner[1] !== 0 ? corner[1] * (frameH / 2 - cornerBuff - displayHeight / 2) : 0;
    this._displayDefaultPos = [dx, dy, 0];
    this.zoomedDisplay.moveTo(this._displayDefaultPos);
  }

  /** Check if zooming is active */
  get isZoomActive(): boolean {
    return this._zoomActive;
  }

  /**
   * Activate zooming: adds camera frame and display to the scene.
   */
  activateZooming(): this {
    if (this._zoomActive) return this;
    this._zoomActive = true;

    // Suppress auto-render while adding mobjects so the display doesn't
    // flash at its target position before the pop-out animation begins.
    const wasAutoRender = this._autoRender;
    this._autoRender = false;

    this.add(this.zoomedCamera.frame);
    this.addForegroundMobject(this.zoomedDisplay);

    this._autoRender = wasAutoRender;
    return this;
  }

  /**
   * Deactivate zooming: removes camera frame and display from the scene.
   */
  deactivateZooming(): this {
    if (!this._zoomActive) return this;
    this._zoomActive = false;

    this.remove(this.zoomedCamera.frame);
    this.remove(this.zoomedDisplay);
    this.render();
    return this;
  }

  /**
   * Get a pop-out animation that moves the zoomed display from the camera
   * frame to its current position, mimicking Manim's
   * get_zoomed_display_pop_out_animation().
   *
   * The animation starts by snapping the display onto the frame, then
   * interpolates position and scale to the display's original state.
   * Use { rateFunc: (t) => smooth(1 - t) } for a reverse pop-out.
   */
  getZoomedDisplayPopOutAnimation(options?: AnimationOptions): Animation {
    return new ZoomDisplayPopOut(this.zoomedDisplay, this.zoomedCamera.frame, options);
  }

  /** Guard against reentrant _render() calls */
  private _isRendering = false;

  /**
   * Override _render to include zoom view on every frame (including animation loop).
   * Uses a dedicated orthographic camera for the RT pass so the scene camera is
   * never mutated -- this prevents THREE.js internal state contamination that
   * caused the RT to render empty when the scene camera was temporarily modified.
   */
  protected override _render(): void {
    // Guard against reentrant calls (from _autoRender side-effects) and disposed state
    if (this._isRendering || this._disposed) return;
    this._isRendering = true;

    try {
      if (this._zoomActive) {
        const webglRenderer = this.renderer.getThreeRenderer();

        // Get frame position/size -- use cached _threeObject to avoid
        // triggering redundant _syncToThree() via getThreeObject()
        const frame = this.zoomedCamera.frame;
        const frameCenter = frame.getCenter();
        const frameObj = frame._threeObject ?? frame.getThreeObject();
        this._frameBounds.setFromObject(frameObj);
        this._frameBounds.getSize(this._frameSize);

        // Hide the display and frame so they don't appear in the zoomed render
        const display = this.zoomedDisplay;
        const displayObj = display._threeObject ?? display.getThreeObject();
        const prevDisplayVisible = displayObj.visible;
        displayObj.visible = false;

        const frameThreeObj = frame._threeObject ?? frame.getThreeObject();
        const prevFrameVisible = frameThreeObj.visible;
        frameThreeObj.visible = false;

        // Update dedicated zoom camera to match frame region
        const hw = (this._frameSize.x > 0.001 ? this._frameSize.x : 1) / 2;
        const hh = (this._frameSize.y > 0.001 ? this._frameSize.y : 1) / 2;
        this._zoomCamera.left = -hw;
        this._zoomCamera.right = hw;
        this._zoomCamera.top = hh;
        this._zoomCamera.bottom = -hh;
        this._zoomCamera.updateProjectionMatrix();
        this._zoomCamera.position.set(frameCenter[0], frameCenter[1], 10);
        this._zoomCamera.lookAt(frameCenter[0], frameCenter[1], 0);

        // Render to zoom render target using dedicated camera
        webglRenderer.setRenderTarget(this._zoomRenderTarget);
        webglRenderer.clear();
        webglRenderer.render(this.threeScene, this._zoomCamera);
        webglRenderer.setRenderTarget(null);

        // Restore viewport to full canvas size
        webglRenderer.getSize(this._viewportSize);
        webglRenderer.setViewport(0, 0, this._viewportSize.x, this._viewportSize.y);

        // Restore display and frame visibility
        displayObj.visible = prevDisplayVisible;
        frameThreeObj.visible = prevFrameVisible;
      }

      // Render main view (scene camera is untouched)
      super._render();
    } finally {
      this._isRendering = false;
    }
  }

  /**
   * Override clear to reset zoom state.
   */
  clear(options: { render?: boolean } = {}): this {
    this._zoomActive = false;
    // Reset frame and display transforms for clean re-play
    this.zoomedCamera.frame.position.set(0, 0, 0);
    this.zoomedCamera.frame.scaleVector.set(1, 1, 1);
    this.zoomedCamera.frame.setOpacity(1);
    this.zoomedCamera.frame._markDirty();
    this.zoomedDisplay.position.set(
      this._displayDefaultPos[0],
      this._displayDefaultPos[1],
      this._displayDefaultPos[2],
    );
    this.zoomedDisplay.scaleVector.set(1, 1, 1);
    this.zoomedDisplay.setOpacity(1);
    this.zoomedDisplay.displayFrame.setOpacity(1);
    this.zoomedDisplay._markDirty();

    // Reset Line2 material dashed state left behind by Uncreate
    // (Uncreate.finish() leaves dashed=true + dashSize=0, making strokes invisible)
    for (const mob of [this.zoomedCamera.frame, this.zoomedDisplay.displayFrame]) {
      mob.getThreeObject().traverse((child) => {
        if (child instanceof Line2) {
          const material = child.material as LineMaterial;
          material.dashed = false;
          material.needsUpdate = true;
        }
      });
    }

    return super.clear(options);
  }

  /**
   * Handle window resize.
   */
  resize(width: number, height: number): this {
    super.resize(width, height);
    return this;
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    if (this._zoomRenderTarget) {
      this._zoomRenderTarget.dispose();
    }
    super.dispose();
  }
}
