import * as THREE from 'three';
import { Scene, SceneOptions } from './Scene';
import { Camera3D, Camera3DOptions } from './Camera';
import { Lighting } from './Lighting';
import { OrbitControls, OrbitControlsOptions } from '../interaction/OrbitControls';
import { Mobject, Vector3Tuple } from './Mobject';
import { Group } from './Group';
import { Line } from '../mobjects/geometry/Line';
import { Arrow } from '../mobjects/geometry/Arrow';
import { Rectangle } from '../mobjects/geometry/Rectangle';
import { smoothstep, coordsToPoint as coordsToPointHelper, pointToCoords as pointToCoordsHelper } from '../utils/math';
import { Animation, AnimationOptions } from '../animation/Animation';

/**
 * Options for configuring a ThreeDScene.
 */
export interface ThreeDSceneOptions extends SceneOptions {
  /** Camera field of view in degrees. Defaults to 45. */
  fov?: number;
  /** Initial camera phi angle (polar, from Y axis). Defaults to PI/4. */
  phi?: number;
  /** Initial camera theta angle (azimuthal, in XZ plane). Defaults to -PI/4. */
  theta?: number;
  /** Initial camera distance from origin. Defaults to 15. */
  distance?: number;
  /** Enable orbit controls for user interaction. Defaults to true. */
  enableOrbitControls?: boolean;
  /** Orbit controls configuration options. */
  orbitControlsOptions?: OrbitControlsOptions;
  /** Whether to set up default lighting. Defaults to true. */
  setupLighting?: boolean;
}

/**
 * Scene configured for 3D content.
 * Provides a 3D camera, orbit controls, and lighting setup by default.
 * Compatible with the Timeline system for animations.
 */
export class ThreeDScene extends Scene {
  private _camera3D: Camera3D;
  private _lighting: Lighting;
  private _orbitControls: OrbitControls | null = null;
  private _orbitControlsEnabled: boolean = true;

  /**
   * Create a new 3D scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: ThreeDSceneOptions = {}) {
    super(container, options);

    const {
      fov = 45,
      phi = Math.PI / 4,
      theta = -Math.PI / 4,
      distance = 15,
      enableOrbitControls = true,
      orbitControlsOptions,
      setupLighting = true,
    } = options;

    // Create 3D camera
    const aspectRatio = this.renderer.width / this.renderer.height;
    const camera3DOptions: Camera3DOptions = {
      fov,
      position: [0, 0, distance],
    };
    this._camera3D = new Camera3D(aspectRatio, camera3DOptions);

    // Set initial camera orientation
    this._camera3D.orbit(phi, theta, distance);

    // Set up lighting
    this._lighting = new Lighting(this.threeScene);
    if (setupLighting) {
      this._lighting.setupDefault();
    }

    // Set up orbit controls
    this._orbitControlsEnabled = enableOrbitControls;
    if (enableOrbitControls) {
      this._orbitControls = new OrbitControls(
        this._camera3D.getCamera(),
        this.getCanvas(),
        {
          enableDamping: true,
          dampingFactor: 0.05,
          ...orbitControlsOptions,
        }
      );

      // Add change listener to trigger re-render
      this._orbitControls.addEventListener('change', () => {
        this.render();
      });
    }

    // Initial render with 3D camera
    this.render();
  }

  /**
   * Get the 3D camera.
   */
  get camera3D(): Camera3D {
    return this._camera3D;
  }

  /**
   * Get the lighting system.
   */
  get lighting(): Lighting {
    return this._lighting;
  }

  /**
   * Get the orbit controls (if enabled).
   */
  get orbitControls(): OrbitControls | null {
    return this._orbitControls;
  }

  /**
   * Set the camera orientation using spherical coordinates.
   * @param phi - Polar angle from Y axis (0 = top, PI = bottom)
   * @param theta - Azimuthal angle in XZ plane
   * @param distance - Optional distance from the look-at point
   * @returns this for chaining
   */
  setCameraOrientation(phi: number, theta: number, distance?: number): this {
    this._camera3D.orbit(phi, theta, distance);
    this.render();
    return this;
  }

  /**
   * Set the camera's look-at target.
   * @param target - Target position [x, y, z]
   * @returns this for chaining
   */
  setLookAt(target: Vector3Tuple): this {
    this._camera3D.setLookAt(target);
    if (this._orbitControls) {
      this._orbitControls.setTarget(target);
    }
    this.render();
    return this;
  }

  /**
   * Get the current camera orientation angles.
   * @returns Object with phi, theta, and distance
   */
  getCameraOrientation(): { phi: number; theta: number; distance: number } {
    return this._camera3D.getOrbitAngles();
  }

  /**
   * Enable or disable orbit controls.
   * @param enabled - Whether orbit controls should be enabled
   * @returns this for chaining
   */
  setOrbitControlsEnabled(enabled: boolean): this {
    this._orbitControlsEnabled = enabled;
    if (this._orbitControls) {
      if (enabled) {
        this._orbitControls.enable();
      } else {
        this._orbitControls.disable();
      }
    }
    return this;
  }

  /**
   * Override render to use the 3D camera.
   */
  render(): void {
    // Update orbit controls if enabled
    if (this._orbitControls && this._orbitControlsEnabled) {
      this._orbitControls.update();
    }

    this.renderer.render(this.threeScene, this._camera3D.getCamera());
  }

  /**
   * Handle window resize.
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: number, height: number): this {
    super.resize(width, height);
    const aspectRatio = width / height;
    this._camera3D.setAspectRatio(aspectRatio);
    this.render();
    return this;
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this._lighting.dispose();
    if (this._orbitControls) {
      this._orbitControls.dispose();
    }
    super.dispose();
  }
}

/**
 * Options for configuring a MovingCameraScene.
 */
export interface MovingCameraSceneOptions extends SceneOptions {
  /** Default duration for camera animations. Defaults to 1 second. */
  defaultCameraDuration?: number;
}

/**
 * Scene with moving camera support.
 * The camera can be animated smoothly between positions.
 * Maintains frame of reference tracking for complex camera movements.
 */
export class MovingCameraScene extends Scene {
  /** Frame of reference - the point the camera tracks */
  private _frameCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  /** Default duration for camera animations */
  private _defaultCameraDuration: number;

  /** Pending camera animation state */
  private _cameraAnimating: boolean = false;
  private _cameraAnimationStart: THREE.Vector3 | null = null;
  private _cameraAnimationTarget: THREE.Vector3 | null = null;
  private _cameraAnimationProgress: number = 0;
  private _cameraAnimationDuration: number = 1;

  /** Zoom animation state */
  private _zoomAnimating: boolean = false;
  private _zoomStart: number = 1;
  private _zoomTarget: number = 1;
  private _zoomProgress: number = 0;
  private _zoomDuration: number = 1;

  /**
   * Create a new moving camera scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: MovingCameraSceneOptions = {}) {
    super(container, options);
    this._defaultCameraDuration = options.defaultCameraDuration ?? 1;
  }

  /**
   * Get the current frame center (what the camera is tracking).
   */
  get frameCenter(): Vector3Tuple {
    return [this._frameCenter.x, this._frameCenter.y, this._frameCenter.z];
  }

  /**
   * Set the frame center directly (no animation).
   * @param point - New frame center [x, y, z]
   * @returns this for chaining
   */
  setFrameCenter(point: Vector3Tuple): this {
    this._frameCenter.set(point[0], point[1], point[2]);
    this.camera.moveTo([point[0], point[1], this.camera.position.z]);
    this.render();
    return this;
  }

  /**
   * Animate the camera to a new position.
   * @param position - Target position [x, y, z]
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  async moveCameraTo(position: Vector3Tuple, duration?: number): Promise<void> {
    const dur = duration ?? this._defaultCameraDuration;

    this._cameraAnimating = true;
    this._cameraAnimationStart = this.camera.position.clone();
    this._cameraAnimationTarget = new THREE.Vector3(position[0], position[1], position[2]);
    this._cameraAnimationProgress = 0;
    this._cameraAnimationDuration = dur;

    // Update frame center to match
    this._frameCenter.set(position[0], position[1], 0);

    return new Promise((resolve) => {
      const animate = () => {
        if (!this._cameraAnimating) {
          resolve();
          return;
        }

        this._cameraAnimationProgress += 1 / 60; // Assume 60fps
        const t = Math.min(1, this._cameraAnimationProgress / this._cameraAnimationDuration);
        const smoothT = smoothstep(t);

        if (this._cameraAnimationStart && this._cameraAnimationTarget) {
          const newPos = new THREE.Vector3().lerpVectors(
            this._cameraAnimationStart,
            this._cameraAnimationTarget,
            smoothT
          );
          this.camera.moveTo([newPos.x, newPos.y, newPos.z]);
        }

        this.render();

        if (t >= 1) {
          this._cameraAnimating = false;
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate zoom to a specific level.
   * @param zoom - Target zoom level (1 = normal, 2 = 2x zoom in)
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  async zoomTo(zoom: number, duration?: number): Promise<void> {
    const dur = duration ?? this._defaultCameraDuration;

    this._zoomAnimating = true;
    this._zoomStart = this.camera.frameWidth / 14; // Assuming 14 is default width
    this._zoomTarget = 1 / zoom;
    this._zoomProgress = 0;
    this._zoomDuration = dur;

    return new Promise((resolve) => {
      const animate = () => {
        if (!this._zoomAnimating) {
          resolve();
          return;
        }

        this._zoomProgress += 1 / 60; // Assume 60fps
        const t = Math.min(1, this._zoomProgress / this._zoomDuration);
        const smoothT = smoothstep(t);

        const currentZoom = this._zoomStart + (this._zoomTarget - this._zoomStart) * smoothT;
        this.camera.frameWidth = 14 * currentZoom;
        this.camera.frameHeight = 8 * currentZoom;

        this.render();

        if (t >= 1) {
          this._zoomAnimating = false;
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Pan the camera to follow a target point.
   * @param target - Target point to pan to [x, y, z]
   * @param duration - Animation duration in seconds (optional)
   * @returns Promise that resolves when the animation completes
   */
  async panTo(target: Vector3Tuple, duration?: number): Promise<void> {
    return this.moveCameraTo([target[0], target[1], this.camera.position.z], duration);
  }

  /**
   * Follow a mobject with the camera (keeps it centered).
   * @param mobject - The mobject to follow
   * @param duration - Duration to follow (0 = instant move)
   * @returns Promise that resolves when initial move completes
   */
  async followMobject(mobject: Mobject, duration: number = 0): Promise<void> {
    const center = mobject.getCenter();
    if (duration > 0) {
      return this.panTo(center, duration);
    } else {
      this.setFrameCenter(center);
      return Promise.resolve();
    }
  }

}

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

    // Make displayFrame a Mobject child so parent→child dirty propagation
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
    // When the display is dirty (e.g. from Scale animation), force
    // displayFrame dirty too so its world-space miter stroke recomputes
    if (this._dirty) {
      this.displayFrame._dirty = true;
      (this.displayFrame as any)._geometryDirty = true;
    }
    super._syncToThree();
  }

  protected _createCopy(): Mobject {
    // ZoomedDisplay is not meaningfully copyable
    return this;
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

  constructor(container: HTMLElement, options: ZoomedSceneOptions = {}) {
    super(container, options);

    const displayWidth = options.displayWidth ?? 3;
    const displayHeight = options.displayHeight ?? 3;
    const zoomFactor = options.zoomFactor ?? 0.3;
    const cameraFrameWidth = options.cameraFrameWidth ?? (displayWidth * zoomFactor);
    const cameraFrameHeight = options.cameraFrameHeight ?? (displayHeight * zoomFactor);
    const cameraFrameColor = options.cameraFrameColor ?? '#FFFF00';
    const displayFrameColor = options.displayFrameColor ?? '#FFFF00';
    const cameraFrameStrokeWidth = options.cameraFrameStrokeWidth ?? 3;
    const displayFrameStrokeWidth = options.displayFrameStrokeWidth ?? 3;
    const renderTargetSize = options.renderTargetSize ?? 512;

    // Create render target
    this._zoomRenderTarget = new THREE.WebGLRenderTarget(renderTargetSize, renderTargetSize, {
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      generateMipmaps: true,
    });

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
    const dx = corner[0] !== 0
      ? corner[0] * (frameW / 2 - cornerBuff - displayWidth / 2)
      : 0;
    const dy = corner[1] !== 0
      ? corner[1] * (frameH / 2 - cornerBuff - displayHeight / 2)
      : 0;
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

  /**
   * Override _render to include zoom view on every frame (including animation loop).
   */
  protected override _render(): void {
    if (this._zoomActive) {
      const webglRenderer = this.renderer.getThreeRenderer();

      // Sync dirty mobjects FIRST so frame bounds are up-to-date
      for (const m of this.mobjects) {
        if (m._dirty) {
          m._syncToThree();
          m._dirty = false;
        }
      }

      // Get frame position/size from the camera frame mobject
      const frameCenter = this.zoomedCamera.frame.getCenter();
      const frameObj = this.zoomedCamera.frame.getThreeObject();
      const frameBounds = new THREE.Box3().setFromObject(frameObj);
      const frameSize = new THREE.Vector3();
      frameBounds.getSize(frameSize);

      // Hide the display and its frame so they don't appear in the zoomed render
      const displayObj = this.zoomedDisplay.getThreeObject();
      const prevDisplayVisible = displayObj.visible;
      displayObj.visible = false;

      // Save camera state
      const cam = this.camera;
      const origWidth = cam.frameWidth;
      const origHeight = cam.frameHeight;
      const origPos = cam.position.clone();

      // Set camera to show the frame region
      cam.frameWidth = frameSize.x > 0.001 ? frameSize.x : origWidth;
      cam.frameHeight = frameSize.y > 0.001 ? frameSize.y : origHeight;
      cam.moveTo([frameCenter[0], frameCenter[1], origPos.z]);

      // Render to zoom target
      webglRenderer.setRenderTarget(this._zoomRenderTarget);
      webglRenderer.render(this.threeScene, cam.getCamera());
      webglRenderer.setRenderTarget(null);

      // Restore viewport to full canvas size (setRenderTarget may leave it at
      // the render target's dimensions, which clips the main scene render)
      const sz = webglRenderer.getSize(new THREE.Vector2());
      webglRenderer.setViewport(0, 0, sz.x, sz.y);

      // Restore camera state
      cam.frameWidth = origWidth;
      cam.frameHeight = origHeight;
      cam.moveTo([origPos.x, origPos.y, origPos.z]);

      // Restore display visibility
      displayObj.visible = prevDisplayVisible;
    }

    // Render main view
    super._render();
  }

  /**
   * Override clear to reset zoom state.
   */
  clear(): this {
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
    return super.clear();
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

/**
 * Options for configuring a VectorScene.
 */
export interface VectorSceneOptions extends SceneOptions {
  /** Whether to show the coordinate plane by default. Defaults to true. */
  showPlane?: boolean;
  /** X-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Defaults to [-3, 3, 1]. */
  yRange?: [number, number, number];
  /** Visual length of the x-axis. Defaults to 10. */
  xLength?: number;
  /** Visual length of the y-axis. Defaults to 6. */
  yLength?: number;
  /** Color for the i basis vector. Defaults to green. */
  iColor?: string;
  /** Color for the j basis vector. Defaults to red. */
  jColor?: string;
  /** Whether to show basis vectors on creation. Defaults to false. */
  showBasisVectors?: boolean;
}

/**
 * Scene optimized for vector visualizations.
 * Provides a coordinate plane by default with easy vector addition.
 */
export class VectorScene extends Scene {
  private _plane: Mobject | null = null;
  private _planeVisible: boolean;
  private _xRange: [number, number, number];
  private _yRange: [number, number, number];
  private _xLength: number;
  private _yLength: number;
  private _iColor: string;
  private _jColor: string;
  private _vectors: Map<string, Mobject> = new Map();
  private _basisVectorsShown: boolean = false;

  /**
   * Create a new vector scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: VectorSceneOptions = {}) {
    super(container, options);

    const {
      showPlane = true,
      xRange = [-5, 5, 1],
      yRange = [-3, 3, 1],
      xLength = 10,
      yLength = 6,
      iColor = '#83C167', // GREEN
      jColor = '#FC6255', // RED
      showBasisVectors = false,
    } = options;

    this._planeVisible = showPlane;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._iColor = iColor;
    this._jColor = jColor;

    if (showPlane) {
      this._setupPlane();
    }

    if (showBasisVectors) {
      this.showBasisVectors();
    }

    this.render();
  }

  /**
   * Set up the coordinate plane.
   */
  private _setupPlane(): void {
    const grid = new Group();
    const gridColor = '#555555';
    const axisColor = '#ffffff';

    // Background grid lines
    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;

    // Helper to convert coords to visual
    const c2p = (x: number, y: number): Vector3Tuple => {
      const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
      const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;
      return [(xNorm - 0.5) * this._xLength, (yNorm - 0.5) * this._yLength, 0];
    };

    // Vertical lines
    for (let x = xMin; x <= xMax; x += xStep) {
      const [vx] = c2p(x, 0);
      const isAxis = Math.abs(x) < 0.001;
      const line = new Line({
        start: [vx, -this._yLength / 2, 0] as Vector3Tuple,
        end: [vx, this._yLength / 2, 0] as Vector3Tuple,
        color: isAxis ? axisColor : gridColor,
        strokeWidth: isAxis ? 2 : 1,
      });
      if (!isAxis) line.setOpacity(0.5);
      grid.add(line);
    }

    // Horizontal lines
    for (let y = yMin; y <= yMax; y += yStep) {
      const [, vy] = c2p(0, y);
      const isAxis = Math.abs(y) < 0.001;
      const line = new Line({
        start: [-this._xLength / 2, vy, 0] as Vector3Tuple,
        end: [this._xLength / 2, vy, 0] as Vector3Tuple,
        color: isAxis ? axisColor : gridColor,
        strokeWidth: isAxis ? 2 : 1,
      });
      if (!isAxis) line.setOpacity(0.5);
      grid.add(line);
    }

    this._plane = grid;
    this.add(grid);
  }

  /**
   * Get the coordinate plane.
   */
  get plane(): Mobject | null {
    return this._plane;
  }

  /**
   * Convert graph coordinates to visual point coordinates.
   * @param x - X coordinate in graph space
   * @param y - Y coordinate in graph space
   * @returns The visual point [x, y, z]
   */
  coordsToPoint(x: number, y: number): Vector3Tuple {
    return coordsToPointHelper(x, y, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Convert visual point to graph coordinates.
   * @param point - Visual point [x, y, z]
   * @returns Graph coordinates [x, y]
   */
  pointToCoords(point: Vector3Tuple): [number, number] {
    return pointToCoordsHelper(point, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Check if the plane is visible.
   */
  get isPlaneVisible(): boolean {
    return this._planeVisible;
  }

  /**
   * Add a vector to the scene.
   * @param vector - Vector coordinates [x, y] or [x, y, z]
   * @param options - Optional configuration
   * @returns The created vector mobject
   */
  addVector(
    vector: [number, number] | Vector3Tuple,
    options: {
      color?: string;
      name?: string;
      startPoint?: Vector3Tuple;
    } = {}
  ): Mobject {
    const { color = '#58C4DD', name, startPoint } = options;

    const vx = vector[0];
    const vy = vector[1];
    const vz = vector.length > 2 ? (vector as Vector3Tuple)[2] : 0;

    // Convert to visual coordinates
    const start = startPoint ?? this.coordsToPoint(0, 0);
    const endCoords = startPoint
      ? [startPoint[0] + this._xLength * vx / (this._xRange[1] - this._xRange[0]),
         startPoint[1] + this._yLength * vy / (this._yRange[1] - this._yRange[0]),
         vz]
      : this.coordsToPoint(vx, vy);

    const arrow = new Arrow({
      start,
      end: endCoords as Vector3Tuple,
      color,
      tipLength: 0.2,
      tipWidth: 0.12,
    });

    if (name) {
      this._vectors.set(name, arrow);
    }

    this.add(arrow);
    return arrow;
  }

  /**
   * Get a named vector.
   * @param name - Name of the vector
   * @returns The vector mobject or undefined
   */
  getVector(name: string): Mobject | undefined {
    return this._vectors.get(name);
  }

  /**
   * Show the standard basis vectors i and j.
   * @returns this for chaining
   */
  showBasisVectors(): this {
    if (this._basisVectorsShown) return this;

    this.addVector([1, 0], { color: this._iColor, name: 'i' });
    this.addVector([0, 1], { color: this._jColor, name: 'j' });

    this._basisVectorsShown = true;
    this.render();
    return this;
  }

  /**
   * Hide the basis vectors.
   * @returns this for chaining
   */
  hideBasisVectors(): this {
    const iVec = this._vectors.get('i');
    const jVec = this._vectors.get('j');

    if (iVec) {
      this.remove(iVec);
      this._vectors.delete('i');
    }
    if (jVec) {
      this.remove(jVec);
      this._vectors.delete('j');
    }

    this._basisVectorsShown = false;
    this.render();
    return this;
  }

  /**
   * Get the origin point in visual coordinates.
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this._vectors.clear();
    super.dispose();
  }
}

/**
 * Options for configuring a LinearTransformationScene.
 */
export interface LinearTransformationSceneOptions extends SceneOptions {
  /** X-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Defaults to [-5, 5, 1]. */
  yRange?: [number, number, number];
  /** Visual length of the x-axis. Defaults to 10. */
  xLength?: number;
  /** Visual length of the y-axis. Defaults to 10. */
  yLength?: number;
  /** Color for the i basis vector. Defaults to green. */
  iColor?: string;
  /** Color for the j basis vector. Defaults to red. */
  jColor?: string;
  /** Whether to show basis vectors by default. Defaults to true. */
  showBasisVectors?: boolean;
  /** Color for background grid lines. Defaults to '#555555'. */
  gridColor?: string;
}

/**
 * Matrix type for 2D linear transformations.
 * Represented as [[a, b], [c, d]] where the matrix is:
 * | a  b |
 * | c  d |
 */
export type Matrix2D = [[number, number], [number, number]];

/**
 * Scene for linear algebra visualizations.
 * Shows basis vectors and a grid that transforms with matrices.
 */
export class LinearTransformationScene extends Scene {
  private _xRange: [number, number, number];
  private _yRange: [number, number, number];
  private _xLength: number;
  private _yLength: number;
  private _iColor: string;
  private _jColor: string;
  private _gridColor: string;

  private _grid: Mobject | null = null;
  private _iVector: Mobject | null = null;
  private _jVector: Mobject | null = null;
  private _transformableObjects: Mobject[] = [];
  private _currentMatrix: Matrix2D = [[1, 0], [0, 1]];
  private _showBasisVectors: boolean;

  /**
   * Create a new linear transformation scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: LinearTransformationSceneOptions = {}) {
    super(container, options);

    const {
      xRange = [-5, 5, 1],
      yRange = [-5, 5, 1],
      xLength = 10,
      yLength = 10,
      iColor = '#83C167', // GREEN
      jColor = '#FC6255', // RED
      showBasisVectors = true,
      gridColor = '#555555',
    } = options;

    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._iColor = iColor;
    this._jColor = jColor;
    this._showBasisVectors = showBasisVectors;
    this._gridColor = gridColor;

    this._setupGrid();

    if (showBasisVectors) {
      this._setupBasisVectors();
    }

    this.render();
  }

  /**
   * Set up the background grid.
   */
  private _setupGrid(): void {
    const grid = new Group();

    const [xMin, xMax, xStep] = this._xRange;
    const [yMin, yMax, yStep] = this._yRange;

    // Vertical lines
    for (let x = xMin; x <= xMax; x += xStep) {
      const vx = this._coordToVisualX(x);
      const line = new Line({
        start: [vx, -this._yLength / 2, 0] as Vector3Tuple,
        end: [vx, this._yLength / 2, 0] as Vector3Tuple,
        color: this._gridColor,
        strokeWidth: 1,
      });
      line.setOpacity(0.5);
      grid.add(line);
    }

    // Horizontal lines
    for (let y = yMin; y <= yMax; y += yStep) {
      const vy = this._coordToVisualY(y);
      const line = new Line({
        start: [-this._xLength / 2, vy, 0] as Vector3Tuple,
        end: [this._xLength / 2, vy, 0] as Vector3Tuple,
        color: this._gridColor,
        strokeWidth: 1,
      });
      line.setOpacity(0.5);
      grid.add(line);
    }

    this._grid = grid;
    this._transformableObjects.push(grid);
    this.add(grid);
  }

  /**
   * Set up the basis vectors.
   */
  private _setupBasisVectors(): void {
    const origin = this.coordsToPoint(0, 0);

    // i vector (1, 0)
    const iEnd = this.coordsToPoint(1, 0);
    this._iVector = new Arrow({
      start: origin,
      end: iEnd,
      color: this._iColor,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 4,
    });
    this._transformableObjects.push(this._iVector);
    this.add(this._iVector);

    // j vector (0, 1)
    const jEnd = this.coordsToPoint(0, 1);
    this._jVector = new Arrow({
      start: origin,
      end: jEnd,
      color: this._jColor,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 4,
    });
    this._transformableObjects.push(this._jVector);
    this.add(this._jVector);
  }

  /**
   * Convert x coordinate to visual x position.
   */
  private _coordToVisualX(x: number): number {
    const [xMin, xMax] = this._xRange;
    const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
    return (xNorm - 0.5) * this._xLength;
  }

  /**
   * Convert y coordinate to visual y position.
   */
  private _coordToVisualY(y: number): number {
    const [yMin, yMax] = this._yRange;
    const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;
    return (yNorm - 0.5) * this._yLength;
  }

  /**
   * Convert graph coordinates to visual point coordinates.
   * @param x - X coordinate in graph space
   * @param y - Y coordinate in graph space
   * @returns The visual point [x, y, z]
   */
  coordsToPoint(x: number, y: number): Vector3Tuple {
    return coordsToPointHelper(x, y, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Convert visual point to graph coordinates.
   * @param point - Visual point [x, y, z]
   * @returns Graph coordinates [x, y]
   */
  pointToCoords(point: Vector3Tuple): [number, number] {
    return pointToCoordsHelper(point, this._xRange, this._yRange, this._xLength, this._yLength);
  }

  /**
   * Get the i basis vector mobject.
   */
  get iVector(): Mobject | null {
    return this._iVector;
  }

  /**
   * Get the j basis vector mobject.
   */
  get jVector(): Mobject | null {
    return this._jVector;
  }

  /**
   * Get the background grid mobject.
   */
  get grid(): Mobject | null {
    return this._grid;
  }

  /**
   * Get the current transformation matrix.
   */
  get currentMatrix(): Matrix2D {
    return [[...this._currentMatrix[0]], [...this._currentMatrix[1]]];
  }

  /**
   * Apply a matrix transformation to all transformable objects.
   * @param matrix - 2D transformation matrix [[a, b], [c, d]]
   * @returns this for chaining
   */
  applyMatrix(matrix: Matrix2D): this {
    const [[a, b], [c, d]] = matrix;

    // Update current matrix by multiplying
    const [[a1, b1], [c1, d1]] = this._currentMatrix;
    this._currentMatrix = [
      [a * a1 + b * c1, a * b1 + b * d1],
      [c * a1 + d * c1, c * b1 + d * d1],
    ];

    // Apply transformation to all transformable objects
    // Create a THREE.js matrix for the transformation
    const threeMatrix = new THREE.Matrix4();
    threeMatrix.set(
      a, b, 0, 0,
      c, d, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );

    for (const obj of this._transformableObjects) {
      const threeObj = obj.getThreeObject();
      threeObj.applyMatrix4(threeMatrix);
    }

    this.render();
    return this;
  }

  /**
   * Reset the transformation to identity.
   * @returns this for chaining
   */
  resetTransformation(): this {
    // Calculate inverse of current matrix
    const [[a, b], [c, d]] = this._currentMatrix;
    const det = a * d - b * c;

    if (Math.abs(det) < 0.0001) {
      // Matrix is singular, rebuild the scene
      this._rebuildScene();
      return this;
    }

    const invMatrix: Matrix2D = [
      [d / det, -b / det],
      [-c / det, a / det],
    ];

    // Apply inverse to reset
    const threeMatrix = new THREE.Matrix4();
    threeMatrix.set(
      invMatrix[0][0], invMatrix[0][1], 0, 0,
      invMatrix[1][0], invMatrix[1][1], 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );

    for (const obj of this._transformableObjects) {
      const threeObj = obj.getThreeObject();
      threeObj.applyMatrix4(threeMatrix);
    }

    this._currentMatrix = [[1, 0], [0, 1]];
    this.render();
    return this;
  }

  /**
   * Rebuild the scene from scratch.
   */
  private _rebuildScene(): void {
    // Remove old objects
    for (const obj of this._transformableObjects) {
      this.remove(obj);
    }
    this._transformableObjects = [];
    this._grid = null;
    this._iVector = null;
    this._jVector = null;

    // Reset matrix
    this._currentMatrix = [[1, 0], [0, 1]];

    // Rebuild
    this._setupGrid();
    if (this._showBasisVectors) {
      this._setupBasisVectors();
    }

    this.render();
  }

  /**
   * Add a vector to the scene that will transform with the matrix.
   * @param vector - Vector coordinates [x, y]
   * @param options - Optional configuration
   * @returns The created vector mobject
   */
  addVector(
    vector: [number, number],
    options: {
      color?: string;
      addToTransformable?: boolean;
    } = {}
  ): Mobject {
    const { color = '#FFFF00', addToTransformable = true } = options;

    const origin = this.coordsToPoint(0, 0);
    const end = this.coordsToPoint(vector[0], vector[1]);

    const arrow = new Arrow({
      start: origin,
      end,
      color,
      tipLength: 0.2,
      tipWidth: 0.12,
      strokeWidth: 3,
    });

    if (addToTransformable) {
      this._transformableObjects.push(arrow);
    }

    this.add(arrow);
    return arrow;
  }

  /**
   * Add a mobject (such as a label or shape) that will transform with the matrix.
   * Use this to add any mobject that should participate in linear transformations.
   * @param mobject - The mobject to add
   * @param position - Optional position [x, y] in graph coordinates
   * @returns The added mobject
   */
  addTransformableLabel(mobject: Mobject, position?: [number, number]): Mobject {
    if (position) {
      const visualPos = this.coordsToPoint(position[0], position[1]);
      mobject.moveTo(visualPos);
    }

    this._transformableObjects.push(mobject);
    this.add(mobject);
    return mobject;
  }

  /**
   * Get the origin point in visual coordinates.
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Show the basis vectors if hidden.
   * @returns this for chaining
   */
  showBasisVectors(): this {
    if (this._iVector && this._jVector) {
      return this;
    }
    this._setupBasisVectors();
    this._showBasisVectors = true;
    this.render();
    return this;
  }

  /**
   * Hide the basis vectors.
   * @returns this for chaining
   */
  hideBasisVectors(): this {
    if (this._iVector) {
      this.remove(this._iVector);
      const idx = this._transformableObjects.indexOf(this._iVector);
      if (idx !== -1) this._transformableObjects.splice(idx, 1);
      this._iVector = null;
    }
    if (this._jVector) {
      this.remove(this._jVector);
      const idx = this._transformableObjects.indexOf(this._jVector);
      if (idx !== -1) this._transformableObjects.splice(idx, 1);
      this._jVector = null;
    }
    this._showBasisVectors = false;
    this.render();
    return this;
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this._transformableObjects = [];
    super.dispose();
  }
}
