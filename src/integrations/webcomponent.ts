/**
 * `<manim-scene>` custom element — a zero-build way to embed a live manim-web
 * animation with a single HTML tag.
 *
 * ```html
 * <manim-scene
 *   width="800"
 *   height="450"
 *   background="#1a1a2e"
 *   controls
 *   autoplay
 *   loop
 *   src="./my-scene.js"
 * ></manim-scene>
 * <script type="module">
 *   import { registerManimElement } from 'manim-web/element';
 *   registerManimElement();
 * </script>
 * ```
 *
 * The module at `src` must default-export a factory
 * `(container: HTMLElement) => Scene | Player`. Bundler users may instead set
 * the factory directly on the element property: `element.scene = factoryFn`.
 *
 * The module is import-safe in Node / SSR: it never touches `customElements`
 * or `HTMLElement` at evaluation time, so importing it where the DOM is
 * absent does not throw. Call {@link registerManimElement} in the browser to
 * define the tag.
 */

import { Scene } from '../core/Scene';
import { Player } from '../player/Player';
import { PlaybackControls } from '../interaction/PlaybackControls';
import { logger } from '../utils/logger';

/** A scene or player instance bound to a container by a factory. */
export type ManimSceneInstance = Scene | Player;

/**
 * Factory that builds the animation. It receives the element's inner container
 * and returns a {@link Scene} or {@link Player} (optionally as a promise).
 */
export type ManimSceneFactory = (
  container: HTMLElement,
) => ManimSceneInstance | Promise<ManimSceneInstance>;

/** Default container width in pixels when the `width` attribute is absent. */
const DEFAULT_WIDTH = 800;
/** Default container height in pixels when the `height` attribute is absent. */
const DEFAULT_HEIGHT = 450;

/**
 * Indirection for the dynamic `import(src)` so tests can stub module loading.
 * Production uses the native dynamic import.
 */
export const manimElementInternals: {
  importModule: (src: string) => Promise<unknown>;
} = {
  importModule: (src: string): Promise<unknown> => import(/* @vite-ignore */ src),
};

/** Narrow an instance to a {@link Player} by its unique public method. */
function isPlayer(instance: ManimSceneInstance): instance is Player {
  return typeof (instance as Player).togglePlayPause === 'function';
}

/** Dispose an instance without letting a dispose error escape. */
function disposeInstance(instance: ManimSceneInstance): void {
  try {
    instance.dispose();
  } catch (err) {
    logger.error('<manim-scene> failed to dispose instance:', err);
  }
}

/**
 * Convert an attribute value to a CSS length. A bare number becomes pixels;
 * any other value (e.g. `100%`) passes through. An empty value uses the
 * fallback pixel size.
 */
function cssSize(value: string | null, fallback: number): string {
  const trimmed = value?.trim();
  if (!trimmed) return `${fallback}px`;
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

/** Parse an attribute to a finite pixel number, or null when not numeric. */
function numericSize(value: string | null): number | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * `HTMLElement` is undefined in Node / SSR. Extending a dummy base there keeps
 * the class declaration from throwing at import time; the element is only ever
 * instantiated in a browser, where the real base is used.
 */
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement);

/** The `<manim-scene>` custom element implementation. */
export class ManimSceneElement extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return ['width', 'height', 'background', 'src', 'autoplay', 'controls', 'loop'];
  }

  private _container: HTMLDivElement | null = null;
  private _instance: ManimSceneInstance | null = null;
  private _controls: PlaybackControls | null = null;
  private _sceneFactory: ManimSceneFactory | null = null;
  private _connected = false;
  /** Incremented on every (re)mount and teardown to drop stale async work. */
  private _loadToken = 0;
  private _mountPromise: Promise<void> = Promise.resolve();

  /** The programmatic scene factory, an alternative to the `src` attribute. */
  get scene(): ManimSceneFactory | null {
    return this._sceneFactory;
  }

  set scene(factory: ManimSceneFactory | null) {
    this._sceneFactory = factory;
    if (this._connected) {
      this._mount();
    }
  }

  /**
   * Resolves once the element is connected and its most recent mount settles.
   * Yields a task first so a just-queued `connectedCallback` runs before the
   * mount promise is awaited.
   */
  async whenReady(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await this._mountPromise;
  }

  connectedCallback(): void {
    this._connected = true;
    this._ensureContainer();
    this._mount();
  }

  disconnectedCallback(): void {
    this._connected = false;
    this._loadToken++;
    this._teardownInstance();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this._connected || oldValue === newValue) return;
    if (name === 'width' || name === 'height' || name === 'background') {
      this._applyContainerStyle();
      this._resizeInstance();
    } else if (name === 'src') {
      this._mount();
    } else {
      // autoplay / controls / loop: re-wire without rebuilding the instance.
      this._applyPlaybackOptions();
    }
  }

  private _ensureContainer(): HTMLDivElement {
    if (!this._container) {
      const div = document.createElement('div');
      this._container = div;
      this.appendChild(div);
    }
    this._applyContainerStyle();
    return this._container;
  }

  private _applyContainerStyle(): void {
    const container = this._container;
    if (!container) return;
    container.style.width = cssSize(this.getAttribute('width'), DEFAULT_WIDTH);
    container.style.height = cssSize(this.getAttribute('height'), DEFAULT_HEIGHT);
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.background = this.getAttribute('background') ?? '';
  }

  private _mount(): Promise<void> {
    this._mountPromise = this._doMount();
    return this._mountPromise;
  }

  private async _doMount(): Promise<void> {
    this._teardownInstance();
    const token = ++this._loadToken;
    const container = this._ensureContainer();
    this._clearContainerChildren();

    const factory = await this._resolveFactory(token);
    if (factory === null || token !== this._loadToken) return;

    let instance: ManimSceneInstance;
    try {
      instance = await factory(container);
    } catch (err) {
      logger.error('<manim-scene> scene factory threw:', err);
      return;
    }
    if (token !== this._loadToken) {
      // A newer mount (or a disconnect) superseded this one while awaiting.
      disposeInstance(instance);
      return;
    }
    this._instance = instance;
    this._applyPlaybackOptions();
  }

  private async _resolveFactory(token: number): Promise<ManimSceneFactory | null> {
    if (this._sceneFactory) return this._sceneFactory;
    const src = this.getAttribute('src');
    if (!src) return null;

    const mod = (await manimElementInternals.importModule(src)) as { default?: unknown };
    if (token !== this._loadToken) return null;

    const factory = mod.default;
    if (typeof factory !== 'function') {
      logger.error(`<manim-scene> module "${src}" has no default-export factory function.`);
      return null;
    }
    return factory as ManimSceneFactory;
  }

  private _applyPlaybackOptions(): void {
    const instance = this._instance;
    if (!instance) return;

    const player = isPlayer(instance);
    if (player) {
      instance.loop = this.hasAttribute('loop');
    }

    // A Player already carries its own controls; only a bare Scene needs them.
    if (!player) {
      this._syncSceneControls(instance);
    }

    if (this.hasAttribute('autoplay') && !instance.isPlaying) {
      if (player) {
        instance.play();
      } else {
        instance.resume();
      }
    }
  }

  private _syncSceneControls(scene: Scene): void {
    const want = this.hasAttribute('controls');
    if (want && !this._controls) {
      this._controls = new PlaybackControls(scene);
    } else if (!want && this._controls) {
      this._controls.dispose();
      this._controls = null;
    }
  }

  private _resizeInstance(): void {
    const instance = this._instance;
    if (!instance) return;
    const width = numericSize(this.getAttribute('width'));
    const height = numericSize(this.getAttribute('height'));
    if (width === null || height === null) return;
    const scene = isPlayer(instance) ? instance.scene : instance;
    try {
      scene.resize(width, height);
    } catch (err) {
      logger.error('<manim-scene> failed to resize scene:', err);
    }
  }

  private _teardownInstance(): void {
    if (this._controls) {
      try {
        this._controls.dispose();
      } catch (err) {
        logger.error('<manim-scene> failed to dispose controls:', err);
      }
      this._controls = null;
    }
    if (this._instance) {
      disposeInstance(this._instance);
      this._instance = null;
    }
  }

  private _clearContainerChildren(): void {
    const container = this._container;
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
}

/**
 * Define the `<manim-scene>` custom element. Safe to call more than once and
 * safe in Node / SSR (where it does nothing because there is no registry).
 *
 * @param tagName - The tag to register. Defaults to `manim-scene`.
 */
export function registerManimElement(tagName = 'manim-scene'): void {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') {
    return;
  }
  if (customElements.get(tagName)) return;
  customElements.define(tagName, ManimSceneElement);
}
