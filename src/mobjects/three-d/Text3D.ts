/**
 * Text3D - extruded / beveled 3D text as a mobject.
 *
 * ManimCE renders only flat Text / MathTex. manim-web adds true 3D text with
 * depth and an optional bevel through Three.js TextGeometry, which extrudes a
 * typeface.json font into a solid mesh. The mesh drops into the normal
 * Mobject3D hierarchy, so it participates in shift / scale / rotate, z-depth and
 * the 3D camera exactly like a Cube or a Sphere.
 *
 * Async + dependency-injection design (why there are static factories):
 *   TextGeometry needs a parsed font, and the font loads over the network with
 *   the FontLoader example module. Both the import and the load are async, so
 *   the real path does them in `fromUrl` / `fromFont`, then constructs a Text3D
 *   with the resolved font and a synchronous geometry factory. The mesh itself
 *   builds lazily and synchronously in `_createThreeObject`, like ModelMobject.
 *
 * The example modules are pulled in through a lazy dynamic `import()` on first
 * use, so the base bundle and SSR never load them. Tests inject a stub font
 * loader and a recording geometry factory (via the options or the module seams
 * `setFontLoaderFactory` / `setTextGeometryFactory`), which bypasses the import,
 * the network and any GPU - mirroring the `setModelLoaderFactory` seam in
 * ModelMobject.
 *
 * No large font is bundled. `fromUrl` defaults to {@link DEFAULT_FONT_URL}, a
 * CDN-hosted typeface.json; supply your own `fontUrl` or a parsed `font`.
 */
import * as THREE from 'three';
import { Mobject3D } from './Mobject3D';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A parsed typeface (a Three.js `Font`). Text3D treats it as opaque; only the
 * geometry factory reads it, so the example-module type never leaks in here.
 */
export type ParsedFont = unknown;

/**
 * The minimal FontLoader contract Text3D needs. Three.js `FontLoader` satisfies
 * it structurally. Tests implement it with a stub.
 */
export interface FontLoaderLike {
  loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<ParsedFont>;
}

/** Builds a FontLoader. The DI seam set by `setFontLoaderFactory`. */
export type FontLoaderFactory = () => FontLoaderLike | Promise<FontLoaderLike>;

/** The extrude parameters handed to the geometry factory for one build. */
export interface Text3DGeometryParams {
  /** The parsed typeface to extrude. */
  font: ParsedFont;
  /** The cap height of the text. */
  size: number;
  /** The extrusion depth along +Z. */
  depth: number;
  /** Curve subdivisions per glyph outline. */
  curveSegments: number;
  /** Whether the bevel is applied. */
  bevelEnabled: boolean;
  /** How far the bevel cuts into the extrusion. */
  bevelThickness: number;
  /** How far the bevel extends out from the outline. */
  bevelSize: number;
  /** Bevel subdivisions. */
  bevelSegments: number;
  /** Bevel offset from the outline. */
  bevelOffset: number;
}

/**
 * Builds the extruded text geometry from the text and parameters. Three.js
 * `TextGeometry` satisfies it. The DI seam set by `setTextGeometryFactory`.
 */
export type TextGeometryFactory = (
  text: string,
  params: Text3DGeometryParams,
) => THREE.BufferGeometry;

/** Bevel options for {@link Text3D}. Missing fields fall back to the defaults. */
export interface Text3DBevel {
  /** Turn the bevel on. Default: false. */
  enabled?: boolean;
  /** How far the bevel cuts into the extrusion. Default: 0.03. */
  thickness?: number;
  /** How far the bevel extends out from the outline. Default: 0.02. */
  size?: number;
  /** Bevel subdivisions. Default: 3. */
  segments?: number;
  /** Bevel offset from the outline. Default: 0. */
  offset?: number;
}

/** Options for the {@link Text3D} constructor. */
export interface Text3DOptions {
  /** A parsed typeface. Required for a synchronous build (see `fromUrl`). */
  font?: ParsedFont;
  /** Cap height of the text. Default: 1. */
  size?: number;
  /** Extrusion depth along +Z. Default: 0.2. */
  depth?: number;
  /** Bevel settings. Default: disabled. */
  bevel?: Text3DBevel;
  /** Fill color as a CSS color string. Default: '#ffffff'. */
  color?: string;
  /** Opacity from 0 to 1. Default: 1. */
  opacity?: number;
  /** Curve subdivisions per glyph outline. Default: 12. */
  curveSegments?: number;
  /** Inject a geometry factory directly (bypasses the example-module import). */
  geometryFactory?: TextGeometryFactory;
}

/** Options for {@link Text3D.fromUrl}. */
export interface Text3DFromUrlOptions extends Text3DOptions {
  /** The typeface.json URL to load. Default: {@link DEFAULT_FONT_URL}. */
  fontUrl?: string;
  /** Inject a loader directly (bypasses the factory and the network). */
  fontLoader?: FontLoaderLike;
  /** Progress callback forwarded to the loader. */
  onProgress?: (event: ProgressEvent) => void;
}

// ---------------------------------------------------------------------------
// Defaults and the injectable factories
// ---------------------------------------------------------------------------

/**
 * A CDN-hosted typeface.json used when no `fontUrl` or `font` is supplied. It is
 * fetched at runtime, never bundled, so the base package stays small.
 */
export const DEFAULT_FONT_URL =
  'https://cdn.jsdelivr.net/npm/three@0.185.1/examples/fonts/helvetiker_regular.typeface.json';

/** Injected font-loader factory. When set, the lazy default import is skipped. */
let fontLoaderFactoryOverride: FontLoaderFactory | null = null;

/**
 * Inject a font-loader factory, replacing the lazy-loaded Three.js FontLoader.
 * Pass `null` to restore the default. Tests use this to avoid any real loader.
 */
export function setFontLoaderFactory(factory: FontLoaderFactory | null): void {
  fontLoaderFactoryOverride = factory;
}

/** Injected geometry factory. When set, the lazy default import is skipped. */
let geometryFactoryOverride: TextGeometryFactory | null = null;

/**
 * Inject a geometry factory, replacing the lazy-loaded Three.js TextGeometry.
 * Pass `null` to restore the default. Tests use this to avoid any font parsing.
 */
export function setTextGeometryFactory(factory: TextGeometryFactory | null): void {
  geometryFactoryOverride = factory;
}

/**
 * Dynamically load the Three.js FontLoader. The import specifier is a literal so
 * bundlers emit a separate lazy chunk and static analysers see it as used.
 */
async function resolveFontLoader(injected?: FontLoaderLike): Promise<FontLoaderLike> {
  if (injected) return injected;
  if (fontLoaderFactoryOverride) return fontLoaderFactoryOverride();
  const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
  return new FontLoader();
}

/**
 * Dynamically load the Three.js TextGeometry and wrap it in a synchronous
 * factory. The parameters are cast to the example module's own type via the
 * `as unknown as` contract pattern, since `font` is opaque here.
 */
async function resolveGeometryFactory(
  injected?: TextGeometryFactory,
): Promise<TextGeometryFactory> {
  if (injected) return injected;
  if (geometryFactoryOverride) return geometryFactoryOverride;
  const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js');
  // cast: bridge our TextGeometryParameters to the three.js TextGeometry
  // constructor options, whose Font type comes from a different module copy.
  return (text, params) =>
    new TextGeometry(text, params as unknown as ConstructorParameters<typeof TextGeometry>[1]);
}

/** Fill in bevel defaults so a build always has every field. */
function resolveBevel(bevel?: Text3DBevel): Required<Text3DBevel> {
  return {
    enabled: bevel?.enabled ?? false,
    thickness: bevel?.thickness ?? 0.03,
    size: bevel?.size ?? 0.02,
    segments: bevel?.segments ?? 3,
    offset: bevel?.offset ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Text3D
// ---------------------------------------------------------------------------

export class Text3D extends Mobject3D {
  private _text: string;
  private _size: number;
  private _depth: number;
  private _curveSegments: number;
  private readonly _bevel: Required<Text3DBevel>;
  private readonly _font: ParsedFont | null;
  private readonly _geometryFactory: TextGeometryFactory | null;
  private readonly _options: Text3DOptions;

  /**
   * Prefer {@link Text3D.fromUrl} (loads a font) or {@link Text3D.fromFont}
   * (uses a parsed font). This constructor builds synchronously and needs both a
   * parsed `font` and a `geometryFactory`; without them it stays an empty,
   * headless-safe placeholder until those are supplied through a factory.
   */
  constructor(text: string, options: Text3DOptions = {}) {
    super();
    this._options = { ...options };
    this._text = text;
    this._size = options.size ?? 1;
    this._depth = options.depth ?? 0.2;
    this._curveSegments = options.curveSegments ?? 12;
    this._bevel = resolveBevel(options.bevel);
    this._font = options.font ?? null;
    this._geometryFactory = options.geometryFactory ?? null;
    this.color = options.color ?? '#ffffff';
    this._opacity = options.opacity ?? 1;
    this.fillOpacity = this._opacity;
  }

  /**
   * Load a typeface and return a ready Text3D.
   *
   * The font loads from `fontUrl` (default {@link DEFAULT_FONT_URL}) with the
   * Three.js FontLoader, then the mesh builds from TextGeometry. Inject a loader
   * with `fontLoader` (or `setFontLoaderFactory`) and a geometry factory with
   * `geometryFactory` (or `setTextGeometryFactory`) to avoid the network and the
   * example-module import, e.g. in tests.
   */
  static async fromUrl(text: string, options: Text3DFromUrlOptions = {}): Promise<Text3D> {
    const fontUrl = options.fontUrl ?? DEFAULT_FONT_URL;
    const loader = await resolveFontLoader(options.fontLoader);
    const font = await loader.loadAsync(fontUrl, options.onProgress);
    const geometryFactory = await resolveGeometryFactory(options.geometryFactory);
    return new Text3D(text, { ...options, font, geometryFactory });
  }

  /**
   * Build a Text3D from an already-parsed font. The geometry factory still
   * resolves (the TextGeometry example module, unless injected).
   */
  static async fromFont(
    text: string,
    font: ParsedFont,
    options: Text3DOptions = {},
  ): Promise<Text3D> {
    const geometryFactory = await resolveGeometryFactory(options.geometryFactory);
    return new Text3D(text, { ...options, font, geometryFactory });
  }

  // ── Mobject integration ──────────────────────────────────────────

  protected _createThreeObject(): THREE.Object3D {
    if (!this._canBuild()) return new THREE.Group();
    return new THREE.Mesh(this._buildGeometry(), this._createMaterial());
  }

  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const material = this._threeObject.material as THREE.MeshStandardMaterial;
      if (material) {
        material.color.set(this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.needsUpdate = true;
      }
    }
  }

  // ── Geometry building ────────────────────────────────────────────

  /** True when a font and a geometry factory are both available. */
  private _canBuild(): boolean {
    return this._font !== null && this._geometryFactory !== null;
  }

  private _buildGeometry(): THREE.BufferGeometry {
    const factory = this._geometryFactory;
    const font = this._font;
    if (!factory || font === null) {
      throw new Error('Text3D cannot build geometry without a font and a geometry factory.');
    }
    return factory(this._text, {
      font,
      size: this._size,
      depth: this._depth,
      curveSegments: this._curveSegments,
      bevelEnabled: this._bevel.enabled,
      bevelThickness: this._bevel.thickness,
      bevelSize: this._bevel.size,
      bevelSegments: this._bevel.segments,
      bevelOffset: this._bevel.offset,
    });
  }

  private _createMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });
  }

  /** Dispose the current geometry and rebuild it from the current state. */
  private _rebuildGeometry(): void {
    if (this._threeObject instanceof THREE.Mesh && this._canBuild()) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = this._buildGeometry();
    }
    this._markDirty();
  }

  // ── Accessors ────────────────────────────────────────────────────

  /** The rendered text. */
  getText(): string {
    return this._text;
  }

  /** Set the text and rebuild the geometry. */
  setText(text: string): this {
    this._text = text;
    this._rebuildGeometry();
    return this;
  }

  /** The cap height of the text. */
  getSize(): number {
    return this._size;
  }

  /** Set the cap height and rebuild the geometry. */
  setSize(size: number): this {
    this._size = size;
    this._rebuildGeometry();
    return this;
  }

  /** The extrusion depth. */
  getDepth(): number {
    return this._depth;
  }

  /** Set the extrusion depth and rebuild the geometry. */
  setDepth(depth: number): this {
    this._depth = depth;
    this._rebuildGeometry();
    return this;
  }

  // ── Copy ─────────────────────────────────────────────────────────

  override copy(): Text3D {
    const copy = new Text3D(this._text, {
      ...this._options,
      font: this._font ?? undefined,
      geometryFactory: this._geometryFactory ?? undefined,
      size: this._size,
      depth: this._depth,
      curveSegments: this._curveSegments,
      bevel: { ...this._bevel },
      color: this.color,
      opacity: this._opacity,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
