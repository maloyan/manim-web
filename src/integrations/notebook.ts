import { Scene, type SceneOptions } from '../core/Scene';

// Re-export everything from the main library for convenience, so a notebook
// cell can import mobjects and animations from the same entry point.
export * from '../index';

/**
 * Default canvas width in pixels for a self-created element.
 * Matches the React and Vue wrappers.
 */
const DEFAULT_WIDTH = 800;

/**
 * Default canvas height in pixels for a self-created element.
 * Matches the React and Vue wrappers.
 */
const DEFAULT_HEIGHT = 450;

/**
 * A user callback that configures the scene.
 * It runs once after the scene is created. It can be synchronous or return a
 * Promise. {@link EmbeddedScene.ready} resolves when the returned Promise does.
 */
export type SceneSetup = (scene: Scene) => void | Promise<void>;

/**
 * Options for {@link embedScene}.
 * Extends {@link SceneOptions} with sizing and styling fields for the host
 * element.
 */
export interface EmbedOptions extends SceneOptions {
  /**
   * Aspect ratio (width / height). Used to derive the missing dimension when
   * only `width` or only `height` is given.
   */
  aspect?: number;
  /** Space-separated CSS class names to add to the host element. */
  className?: string;
}

/**
 * The result of {@link embedScene}.
 */
export interface EmbeddedScene {
  /** The managed Scene instance. */
  scene: Scene;
  /** The host element that contains the scene canvas. */
  element: HTMLElement;
  /**
   * Resolves when the `setup` callback finishes. Rejects if `setup` throws or
   * returns a rejected Promise. Resolves immediately when no `setup` is given.
   */
  ready: Promise<void>;
  /** Tear down the scene. Idempotent. Removes a self-created element. */
  dispose: () => void;
}

/**
 * An Observable cell node returned by {@link observableScene}.
 * It is a plain `HTMLElement` with the scene and a `dispose` method attached,
 * so a cell can read `node.scene` or tear down early with `node.dispose()`.
 */
export interface ObservableSceneNode extends HTMLElement {
  /** The managed Scene instance. */
  scene: Scene;
  /** Tear down the scene and remove the node. Idempotent. */
  dispose: () => void;
}

/**
 * Options for {@link observableScene}.
 * Extends {@link EmbedOptions} with Observable's `invalidation` promise.
 */
export interface ObservableSceneOptions extends EmbedOptions {
  /**
   * Observable's per-cell `invalidation` promise. When it resolves (the cell
   * re-runs or is removed), the scene is disposed automatically.
   */
  invalidation?: PromiseLike<unknown>;
}

/**
 * Resolve the explicit pixel dimensions from the sizing options.
 * @param options - The sizing options.
 * @returns The resolved width and height, each omitted when not determined.
 */
function resolveSize(options: EmbedOptions): { width?: number; height?: number } {
  const { width, height, aspect } = options;
  if (width != null && height != null) return { width, height };
  if (width != null && aspect != null) return { width, height: Math.round(width / aspect) };
  if (height != null && aspect != null) return { width: Math.round(height * aspect), height };
  if (width != null) return { width };
  if (height != null) return { height };
  return {};
}

/**
 * Return the global document, or throw a clear error in a headless environment.
 * @param fnName - The caller name, used in the error message.
 * @returns The global Document.
 */
function requireDocument(fnName: string): Document {
  if (typeof document === 'undefined') {
    throw new Error(
      `${fnName} requires a DOM document. It cannot run in a headless or Node environment. ` +
        `Pass an existing container element, or run it in a browser or notebook output cell.`,
    );
  }
  return document;
}

/**
 * Embed a manim-web scene into a container element (or a new element).
 *
 * The scene canvas is created inside the container and sized to it. The
 * `setup` callback runs once with the scene. The returned `dispose` tears the
 * scene down and removes a self-created element.
 *
 * @param container - The host element. When omitted, a new `div` is created
 *   (requires a DOM document) and returned detached for the caller to insert.
 * @param setup - Optional callback to configure the scene. Sync or async.
 * @param options - Sizing, styling, and Scene options.
 * @returns The managed scene, its element, a `ready` promise, and `dispose`.
 *
 * @example
 * ```typescript
 * const { element, dispose } = embedScene(undefined, async (scene) => {
 *   const circle = new Circle({ radius: 1 });
 *   scene.add(circle);
 *   await scene.play(new FadeIn(circle));
 * }, { width: 640, height: 360 });
 * document.body.appendChild(element);
 * ```
 */
export function embedScene(
  container?: HTMLElement | null,
  setup?: SceneSetup,
  options: EmbedOptions = {},
): EmbeddedScene {
  // `aspect` and `className` are not Scene options; they stay in `rest` but are
  // harmless to Scene (it ignores unknown fields), and width/height are
  // overridden below by the resolved dimensions.
  const { className, ...rest } = options;
  const size = resolveSize(options);

  let element: HTMLElement;
  let ownsElement = false;
  if (container) {
    element = container;
  } else {
    const doc = requireDocument('embedScene');
    element = doc.createElement('div');
    ownsElement = true;
    element.style.position = 'relative';
    element.style.width = `${size.width ?? DEFAULT_WIDTH}px`;
    element.style.height = `${size.height ?? DEFAULT_HEIGHT}px`;
  }

  if (className) {
    const tokens = className.split(/\s+/).filter(Boolean);
    element.classList.add(...tokens);
  }

  const scene = new Scene(element, { ...rest, width: size.width, height: size.height });

  let ready: Promise<void>;
  try {
    ready = Promise.resolve(setup?.(scene));
  } catch (err) {
    ready = Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
  // Attach a no-op handler so a rejected setup that nobody awaits does not
  // surface as an unhandled rejection. A caller awaiting `ready` still sees it.
  void ready.catch(() => undefined);

  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    scene.dispose();
    if (ownsElement && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  return { scene, element, ready, dispose };
}

/**
 * Create a manim-web scene as a detached DOM node, for Observable cells.
 *
 * Observable renders the element a cell returns, so return this node directly.
 * When Observable's `invalidation` promise is passed, the scene disposes
 * automatically as the cell re-runs.
 *
 * @param setup - Optional callback to configure the scene. Sync or async.
 * @param options - Sizing, styling, Scene options, and `invalidation`.
 * @returns The host element, with `scene` and `dispose` attached.
 *
 * @example
 * ```javascript
 * // In an Observable cell:
 * observableScene(async (scene) => {
 *   const dot = new Dot();
 *   scene.add(dot);
 *   await scene.play(new FadeIn(dot));
 * }, { width, invalidation })
 * ```
 */
export function observableScene(
  setup?: SceneSetup,
  options: ObservableSceneOptions = {},
): ObservableSceneNode {
  requireDocument('observableScene');
  const { invalidation, ...embedOptions } = options;
  const embedded = embedScene(null, setup, embedOptions);

  if (invalidation && typeof invalidation.then === 'function') {
    invalidation.then(
      () => embedded.dispose(),
      () => embedded.dispose(),
    );
  }

  const node = embedded.element as ObservableSceneNode;
  node.scene = embedded.scene;
  node.dispose = embedded.dispose;
  return node;
}

/**
 * Get the host element for a scene or an embedded result.
 *
 * Use it in notebook kernels that render a returned element (for example,
 * `IPython.display`). It returns the element that contains the scene canvas.
 *
 * @param target - A Scene, or an {@link EmbeddedScene} result.
 * @returns The host element that contains the scene canvas.
 */
export function toHTMLElement(target: Scene | EmbeddedScene): HTMLElement {
  if (target instanceof Scene) {
    return target.getContainer();
  }
  return target.element;
}
