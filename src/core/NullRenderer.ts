import * as THREE from 'three';

export class NullRenderer {
  private _width: number;
  private _height: number;
  private _backgroundColor: THREE.Color;
  private _backgroundOpacity: number;

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
  getCanvas(): HTMLCanvasElement {
    throw new Error(
      'getCanvas() is not available in headless mode. Create a Scene with a container for rendering.',
    );
  }
  getThreeRenderer(): THREE.WebGLRenderer {
    throw new Error(
      'getThreeRenderer() is not available in headless mode. Create a Scene with a container for rendering.',
    );
  }
  dispose(): void {
    /* no-op */
  }
}
