import * as THREE from 'three';
import { logger } from '../utils/logger';

/**
 * Opt-in WebXR (VR/AR) scene output.
 *
 * three.js ships a first-class WebXR backend (`renderer.xr`). This module wraps
 * it so a manim-web {@link Scene} can be viewed in an immersive headset, which
 * no desktop-only manim can do.
 *
 * The desktop render path is never touched. XR activates only on an explicit
 * {@link WebXRSession.enterXR} call. When WebXR is unavailable (CI, headless,
 * most desktops) every entry point degrades cleanly: {@link isXRSupported}
 * resolves `false` and {@link WebXRSession.enterXR} resolves `false` without
 * throwing, so calling code needs no feature guards of its own.
 */

/**
 * Minimal structural view of a scene that can be driven in an XR session.
 *
 * Both `Scene` (via `camera`) and `ThreeDScene` (via `camera3D`) satisfy this
 * shape, so `enableXR(scene)` accepts either without a hard import of the Scene
 * classes (which keeps this module free of a scene-graph dependency cycle).
 */
export interface XRSceneLike {
  /** The three.js scene graph to render in the headset. */
  readonly threeScene: THREE.Scene;
  /** The renderer wrapper exposing the underlying `THREE.WebGLRenderer`. */
  readonly renderer: { getThreeRenderer(): THREE.WebGLRenderer };
  /** 2D scene camera (base `Scene`). Used when no `camera3D` is present. */
  readonly camera?: { getCamera(): THREE.Camera };
  /** 3D scene camera (`ThreeDScene`). Preferred for immersive rendering. */
  readonly camera3D?: { getCamera(): THREE.Camera };
}

/** Options for {@link enableXR} / {@link WebXRSession}. */
export interface WebXROptions {
  /** Session mode. Defaults to `'immersive-vr'`. */
  mode?: XRSessionMode;
  /** Extra WebXR features to request (forwarded to `requestSession`). */
  sessionInit?: XRSessionInit;
  /** Reference space type for the session. Defaults to `'local-floor'`. */
  referenceSpaceType?: XRReferenceSpaceType;
  /** Camera to render with. Overrides the scene's own camera when provided. */
  camera?: THREE.Camera;
  /**
   * Called once per XR frame, after the scene is rendered. Use it to advance
   * animation state while an immersive session drives the render loop.
   */
  onFrame?: (time: number, frame: XRFrame | null) => void;
  /** Called after the session ends and the desktop state is restored. */
  onExit?: () => void;
}

/** Options for {@link WebXRSession.createButton}. */
export interface XRButtonOptions {
  /** Label shown when a session can be started. Defaults to `'Enter VR'`. */
  enterText?: string;
  /** Label shown while a session is active. Defaults to `'Exit VR'`. */
  exitText?: string;
  /** Label shown when the mode is unsupported. Defaults to `'VR not supported'`. */
  unsupportedText?: string;
}

/**
 * Read the WebXR entry point from the current global scope.
 * Returns `null` when `navigator` or `navigator.xr` is absent (CI, headless,
 * browsers without WebXR), so callers can degrade instead of throwing.
 */
function getXRSystem(): XRSystem | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.xr ?? null;
}

/**
 * Whether an immersive session of the given mode can be started right now.
 *
 * @param mode - Session mode to probe. Defaults to `'immersive-vr'`.
 * @returns `true` only when WebXR exists and reports the mode as supported;
 *   `false` in every unavailable or error case (never throws).
 */
export async function isXRSupported(mode: XRSessionMode = 'immersive-vr'): Promise<boolean> {
  const xr = getXRSystem();
  if (!xr) return false;
  try {
    return await xr.isSessionSupported(mode);
  } catch (err) {
    logger.debug('WebXR: isSessionSupported failed', err);
    return false;
  }
}

/**
 * Controller for an opt-in WebXR session bound to one scene.
 *
 * Create it with {@link enableXR}. The session is inert until
 * {@link WebXRSession.enterXR} runs, so constructing it has no effect on the
 * default desktop render loop.
 */
export class WebXRSession {
  private readonly _scene: XRSceneLike;
  private readonly _mode: XRSessionMode;
  private readonly _sessionInit: XRSessionInit;
  private readonly _referenceSpaceType: XRReferenceSpaceType;
  private readonly _camera: THREE.Camera;
  private readonly _onFrame?: (time: number, frame: XRFrame | null) => void;
  private readonly _onExit?: () => void;

  private _session: XRSession | null = null;
  private _active = false;
  // xr.enabled value before the session started, restored on exit.
  private _prevXrEnabled = false;
  private readonly _onSessionEnd: () => void;

  /**
   * @param scene - The scene to render in the headset.
   * @param options - Session configuration. See {@link WebXROptions}.
   */
  constructor(scene: XRSceneLike, options: WebXROptions = {}) {
    this._scene = scene;
    this._mode = options.mode ?? 'immersive-vr';
    this._sessionInit = options.sessionInit ?? {};
    this._referenceSpaceType = options.referenceSpaceType ?? 'local-floor';
    this._camera = options.camera ?? WebXRSession._resolveCamera(scene);
    this._onFrame = options.onFrame;
    this._onExit = options.onExit;
    this._onSessionEnd = () => this._cleanup();
  }

  /** The session mode this controller requests. */
  get mode(): XRSessionMode {
    return this._mode;
  }

  /** Whether an immersive session is currently active. */
  get active(): boolean {
    return this._active;
  }

  /** The underlying WebXR session while active, otherwise `null`. */
  get session(): XRSession | null {
    return this._session;
  }

  /**
   * Whether this controller's mode is supported in the current environment.
   * Thin instance wrapper over {@link isXRSupported}.
   */
  isSupported(): Promise<boolean> {
    return isXRSupported(this._mode);
  }

  /**
   * Request an immersive session and switch the renderer to the XR render loop.
   *
   * Sets `renderer.xr.enabled = true`, requests the session, selects the
   * reference space, and drives rendering with `renderer.setAnimationLoop`
   * (required by WebXR; the desktop `requestAnimationFrame` path is not used
   * while presenting). Safe to call when already active (no-op).
   *
   * @returns `true` once the session is presenting; `false` when WebXR is
   *   unavailable or the request fails. Never throws for an unavailable device.
   */
  async enterXR(): Promise<boolean> {
    if (this._active) return true;

    const xr = getXRSystem();
    if (!xr) {
      logger.debug('WebXR: navigator.xr unavailable; enterXR is a no-op');
      return false;
    }

    let session: XRSession;
    try {
      session = await xr.requestSession(this._mode, this._sessionInit);
    } catch (err) {
      logger.debug('WebXR: requestSession failed', err);
      return false;
    }

    const threeRenderer = this._scene.renderer.getThreeRenderer();
    this._prevXrEnabled = threeRenderer.xr.enabled;
    threeRenderer.xr.enabled = true;
    threeRenderer.xr.setReferenceSpaceType(this._referenceSpaceType);

    try {
      await threeRenderer.xr.setSession(session);
    } catch (err) {
      logger.debug('WebXR: setSession failed; rolling back', err);
      threeRenderer.xr.enabled = this._prevXrEnabled;
      try {
        await session.end();
      } catch {
        // Session may never have started; nothing to end.
      }
      return false;
    }

    this._session = session;
    this._active = true;
    session.addEventListener('end', this._onSessionEnd);

    const loop: XRFrameRequestCallback = (time, frame) => {
      threeRenderer.render(this._scene.threeScene, this._camera);
      this._onFrame?.(time, frame ?? null);
    };
    threeRenderer.setAnimationLoop(loop);
    return true;
  }

  /**
   * End the active session and restore the desktop render state.
   *
   * Clears the XR animation loop, restores the previous `renderer.xr.enabled`
   * value, and ends the session. Safe to call when inactive (no-op). Cleanup
   * also runs if the user exits from inside the headset, via the session's
   * `end` event.
   */
  async exitXR(): Promise<void> {
    if (!this._active || !this._session) return;
    const session = this._session;
    try {
      await session.end();
    } catch (err) {
      logger.debug('WebXR: session.end failed', err);
    }
    // Idempotent: the `end` event may already have cleaned up.
    this._cleanup();
  }

  /**
   * Build an "Enter VR/AR" toggle button, like three.js `VRButton`.
   *
   * The button enters a session on first click and exits on the next. It
   * disables itself when the mode is unsupported. Returns `null` when no DOM is
   * present (CI, headless), so callers never need a `typeof document` guard.
   *
   * @param options - Button labels. See {@link XRButtonOptions}.
   * @returns The button element, or `null` without a DOM.
   */
  createButton(options: XRButtonOptions = {}): HTMLButtonElement | null {
    if (typeof document === 'undefined') return null;

    const vr = this._mode === 'immersive-vr';
    const enterText = options.enterText ?? (vr ? 'Enter VR' : 'Enter AR');
    const exitText = options.exitText ?? (vr ? 'Exit VR' : 'Exit AR');
    const unsupportedText =
      options.unsupportedText ?? (vr ? 'VR not supported' : 'AR not supported');

    const button = document.createElement('button');
    button.textContent = enterText;

    const sync = (): void => {
      button.textContent = this._active ? exitText : enterText;
    };

    button.addEventListener('click', () => {
      if (this._active) {
        void this.exitXR().then(sync);
      } else {
        void this.enterXR().then(sync);
      }
    });

    void this.isSupported().then((supported) => {
      if (!supported) {
        button.disabled = true;
        button.textContent = unsupportedText;
      }
    });

    return button;
  }

  /**
   * Restore desktop state after the session ends. Idempotent: guarded on the
   * active flag so {@link exitXR} and the `end` event can both call it.
   */
  private _cleanup(): void {
    if (!this._active) return;
    this._active = false;

    const threeRenderer = this._scene.renderer.getThreeRenderer();
    threeRenderer.setAnimationLoop(null);
    threeRenderer.xr.enabled = this._prevXrEnabled;

    if (this._session) {
      this._session.removeEventListener('end', this._onSessionEnd);
      this._session = null;
    }
    this._onExit?.();
  }

  /**
   * Pick the camera to render with. Prefers a 3D perspective camera
   * (`ThreeDScene.camera3D`), falls back to the base scene camera, and finally
   * to a fresh `PerspectiveCamera` so a session can always start.
   */
  private static _resolveCamera(scene: XRSceneLike): THREE.Camera {
    const cam3d = scene.camera3D?.getCamera();
    if (cam3d) return cam3d;
    const cam = scene.camera?.getCamera();
    if (cam) return cam;
    return new THREE.PerspectiveCamera();
  }
}

/**
 * Enable opt-in WebXR output for a scene.
 *
 * Returns an inert {@link WebXRSession}; nothing happens to the default render
 * path until {@link WebXRSession.enterXR} is called.
 *
 * @param scene - The scene to view in a headset.
 * @param options - Session configuration. See {@link WebXROptions}.
 */
export function enableXR(scene: XRSceneLike, options: WebXROptions = {}): WebXRSession {
  return new WebXRSession(scene, options);
}
