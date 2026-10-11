/**
 * SlideInteractionRenderer - keeps a paused Player slide interactive.
 *
 * The Player drives its own render loop (see Player._startLoop). The loop
 * stops while the Player is paused on a slide, so nothing redraws the scene in
 * response to pointer input. The interaction helpers (Draggable, Clickable,
 * Hoverable in src/interaction/) mutate mobjects on pointer events, but
 * Clickable and Hoverable never render, and Draggable only renders when no
 * render loop is active. On a paused slide the result is a frozen frame: a
 * drag, click or hover does not become visible.
 *
 * This helper closes that gap. It listens for the same pointer event types the
 * interaction helpers react to and, while the Player is idle (paused), requests
 * one scene render per event. It never advances the playback timeline, so the
 * animation stays exactly where the slide paused.
 *
 * The render is scheduled in a microtask. A microtask runs after the whole
 * event dispatch finishes, so every listener of that event — including a
 * Draggable on `window` and a Clickable on the canvas — has already mutated its
 * mobject before the render reads the scene. Listener registration order is
 * therefore irrelevant. Multiple events in one tick coalesce into one render.
 */

import { Scene } from '../core/Scene';

/**
 * Pointer event types the interaction helpers react to. A render after any of
 * these reflects whatever drag, click or hover did to the scene.
 */
const INTERACTION_EVENTS: readonly string[] = [
  'mousedown',
  'mousemove',
  'mouseup',
  'click',
  'touchstart',
  'touchmove',
  'touchend',
];

export class SlideInteractionRenderer {
  private _target: HTMLElement;
  private _scene: Scene;
  private _isIdle: () => boolean;
  private _onEvent: () => void;
  private _attached: boolean = false;
  private _renderScheduled: boolean = false;
  private _renderCount: number = 0;

  /**
   * @param target - Element that pointer events bubble to (the Player
   *   container). The canvas is a child of this element, so canvas events reach
   *   it. The container exists even for a headless Scene, where `getCanvas()`
   *   throws.
   * @param scene - The scene to render.
   * @param isIdle - Returns true when the Player is paused (no render loop
   *   running). A render is requested only then; during playback the Player
   *   loop already draws every frame.
   */
  constructor(target: HTMLElement, scene: Scene, isIdle: () => boolean) {
    this._target = target;
    this._scene = scene;
    this._isIdle = isIdle;
    this._onEvent = () => this._handleEvent();
  }

  /** Whether listeners are currently attached. */
  get isAttached(): boolean {
    return this._attached;
  }

  /** Number of idle renders performed. Exposed for tests and introspection. */
  get renderCount(): number {
    return this._renderCount;
  }

  /** Start listening for pointer events. Idempotent. */
  attach(): void {
    if (this._attached) return;
    for (const type of INTERACTION_EVENTS) {
      this._target.addEventListener(type, this._onEvent);
    }
    this._attached = true;
  }

  /** Stop listening and drop any pending render. */
  dispose(): void {
    if (!this._attached) return;
    for (const type of INTERACTION_EVENTS) {
      this._target.removeEventListener(type, this._onEvent);
    }
    this._attached = false;
    this._renderScheduled = false;
  }

  private _handleEvent(): void {
    // While the Player is playing, its render loop already draws every frame.
    if (!this._isIdle()) return;
    this._scheduleRender();
  }

  private _scheduleRender(): void {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    queueMicrotask(() => {
      this._renderScheduled = false;
      // Re-check: playback may have resumed, or the helper disposed, between
      // the event and this microtask.
      if (!this._attached || !this._isIdle()) return;
      this._scene.render();
      this._renderCount++;
    });
  }
}
