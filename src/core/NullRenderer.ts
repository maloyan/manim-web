import * as THREE from 'three';
import { IRenderer } from './Renderer';

/**
 * No-op renderer for headless mode.
 * Drop-in replacement for Renderer that performs no actual rendering.
 * Used when Scene is created with { headless: true } or via Scene.createHeadless().
 *
 * - render(), resize(), dispose() are no-ops
 * - getCanvas() and getThreeRenderer() throw with descriptive errors
 * - Width, height, colors are stored in memory for scene logic
 */
export class NullRenderer implements IRenderer {
  private _width: number;
  private _height: number;
  private _backgroundColor: THREE.Color;
  private _backgroundOpacity: number;

  /**
   * Create a NullRenderer with optional dimensions and colors.
   * @param options - Configuration options (defaults: 800x450, black background)
   */
  constructor(
    options: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      backgroundOpacity?: number;
    } = {},
  ) {
    this._width = options.width ?? 800;
    this._height = options.height ?? 450;
    this._backgroundColor = new THREE.Color(options.backgroundColor ?? '#000000');
    this._backgroundOpacity = options.backgroundOpacity ?? 1;
  }

  get isContextLost(): boolean {
    return false;
  }
  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get backgroundColor(): THREE.Color {
    return this._backgroundColor;
  }
  set backgroundColor(color: THREE.Color | string) {
    this._backgroundColor = color instanceof THREE.Color ? color : new THREE.Color(color);
  }
  get backgroundOpacity(): number {
    return this._backgroundOpacity;
  }
  set backgroundOpacity(value: number) {
    this._backgroundOpacity = Math.max(0, Math.min(1, value));
  }

  render(_scene: THREE.Scene, _camera: THREE.Camera): void {
    /* no-op */
  }
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }
  /** Always throws — canvas is not available in headless mode. */
  getCanvas(): HTMLCanvasElement {
    throw new Error(
      'getCanvas() is not available in headless mode. Create a Scene with a container for rendering.',
    );
  }
  /** Always throws — WebGL renderer is not available in headless mode. */
  getThreeRenderer(): THREE.WebGLRenderer {
    throw new Error(
      'getThreeRenderer() is not available in headless mode. Create a Scene with a container for rendering.',
    );
  }
  dispose(): void {
    /* no-op */
  }
}
