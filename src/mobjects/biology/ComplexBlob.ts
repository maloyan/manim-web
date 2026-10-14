/**
 * ComplexBlob - a labeled, rounded protein "blob" with a soft gradient.
 *
 * The renderer draws one flat fill per shape, so a real SVG gradient cannot
 * render on a mobject. The blob fakes a radial gradient with stacked concentric
 * shapes. Each layer is smaller and lighter than the one below it, and the
 * layers shift up and left a little, so the highlight sits off center. An
 * optional glow is a set of larger, faint shapes behind the body.
 *
 * The blob is a VGroup, so Create, FadeIn and shift animate it directly.
 *
 * @example
 * ```typescript
 * const complexI = new ComplexBlob({ label: 'I', color: '#E57373' });
 * scene.play(new FadeIn(complexI));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Ellipse } from '../geometry/Ellipse';
import { RoundedRectangle } from '../geometry/PolygonExtensions';
import { Text } from '../text/Text';
import { interpolateColor } from '../../utils/color';
import { ComplexBlobLabelPosition, ComplexBlobOptions, ComplexBlobShape } from './biologyTypes';

/** Default base color. */
const DEFAULT_COLOR = '#E57373';

/** Default number of gradient layers. */
const DEFAULT_LAYERS = 6;

/** Number of glow shapes behind the body. */
const GLOW_LAYERS = 3;

/** How much the body color lightens at the innermost layer (0 to 1 toward white). */
const MAX_LIGHTEN = 0.55;

/** How small the innermost layer is, as a fraction of the body size. */
const INNER_SCALE = 0.45;

/** Highlight shift of the innermost layer, as a fraction of the body size. */
const HIGHLIGHT_SHIFT = 0.12;

/** Gap between the body and an outside label. */
const LABEL_BUFFER = 0.22;

/** Options with every default applied. */
type ResolvedBlobOptions = Required<ComplexBlobOptions>;

/** Apply the defaults and check the numbers. */
function resolveBlobOptions(options: ComplexBlobOptions): ResolvedBlobOptions {
  const cfg: ResolvedBlobOptions = {
    label: options.label,
    width: options.width ?? 1.2,
    height: options.height ?? 1,
    shape: options.shape ?? 'rounded',
    color: options.color ?? DEFAULT_COLOR,
    layers: Math.floor(options.layers ?? DEFAULT_LAYERS),
    glow: options.glow ?? true,
    fontSize: options.fontSize ?? 24,
    labelColor: options.labelColor ?? '#FFFFFF',
    labelPosition: options.labelPosition ?? 'inside',
    center: options.center ?? [0, 0, 0],
  };
  if (!(cfg.width > 0) || !(cfg.height > 0)) {
    throw new Error('ComplexBlob: size must be positive');
  }
  if (!(cfg.layers >= 1)) throw new Error('ComplexBlob: layers must be at least 1');
  return cfg;
}

/** The label y offset from the body center. */
function labelOffsetY(position: ComplexBlobLabelPosition, height: number): number {
  if (position === 'inside') return 0;
  const away = height / 2 + LABEL_BUFFER;
  return position === 'below' ? -away : away;
}

export class ComplexBlob extends VGroup {
  protected _bodyWidth: number;
  protected _bodyHeight: number;
  protected _shape: ComplexBlobShape;
  protected _center: Vector3Tuple;

  /** The concentric gradient layers, outermost first. */
  protected _layers: VMobject[] = [];

  /** The group of gradient layers. */
  readonly body: VGroup;
  /** The glow group behind the body, or null when glow is off. */
  readonly glow: VGroup | null;
  /** The text label. */
  readonly labelText: Text;

  constructor(options: ComplexBlobOptions) {
    super();

    const cfg = resolveBlobOptions(options);
    this._bodyWidth = cfg.width;
    this._bodyHeight = cfg.height;
    this._shape = cfg.shape;
    this._center = [cfg.center[0], cfg.center[1], cfg.center[2]];

    this.body = this._buildBody(cfg.color, cfg.layers);
    this.glow = cfg.glow ? this._buildGlow(cfg.color) : null;
    if (this.glow) this.add(this.glow);
    this.add(this.body);

    const [cx, cy, cz] = this._center;
    this.labelText = new Text({ text: cfg.label, fontSize: cfg.fontSize, color: cfg.labelColor });
    this.labelText.moveTo([cx, cy + labelOffsetY(cfg.labelPosition, cfg.height), cz]);
    this.add(this.labelText);
  }

  /** Build the stacked gradient layers, outermost first. */
  private _buildBody(color: string, layers: number): VGroup {
    const [cx, cy, cz] = this._center;
    const w = this._bodyWidth;
    const h = this._bodyHeight;
    const dark = interpolateColor(color, '#000000', 0.25);
    const light = interpolateColor(color, '#FFFFFF', MAX_LIGHTEN);
    const body = new VGroup();
    for (let i = 0; i < layers; i++) {
      const t = layers === 1 ? 0 : i / (layers - 1);
      const scale = 1 - t * (1 - INNER_SCALE);
      const layer = this._makeShape(w * scale, h * scale, interpolateColor(dark, light, t), 1, [
        cx - t * w * HIGHLIGHT_SHIFT,
        cy + t * h * HIGHLIGHT_SHIFT,
        cz,
      ]);
      this._layers.push(layer);
      body.add(layer);
    }
    return body;
  }

  /** Build the faint glow shapes, largest first. */
  private _buildGlow(color: string): VGroup {
    const glow = new VGroup();
    for (let i = GLOW_LAYERS; i >= 1; i--) {
      const grow = 1 + i * 0.12;
      glow.add(
        this._makeShape(this._bodyWidth * grow, this._bodyHeight * grow, color, 0.08, this._center),
      );
    }
    return glow;
  }

  /** Build one body or glow shape. */
  private _makeShape(
    width: number,
    height: number,
    color: string,
    fillOpacity: number,
    center: Vector3Tuple,
    strokeWidth = 0,
  ): VMobject {
    const shape: VMobject =
      this._shape === 'ellipse'
        ? new Ellipse({ width, height, color, fillOpacity, strokeWidth, center })
        : new RoundedRectangle({
            width,
            height,
            cornerRadius: Math.min(width, height) * 0.35,
            color,
            fillOpacity,
            strokeWidth,
            center,
          });
    shape.fillColor = color;
    return shape;
  }

  /** The gradient layers, outermost first. */
  getLayers(): VMobject[] {
    return [...this._layers];
  }

  /** Width of the outer body layer. */
  getBodyWidth(): number {
    return this._bodyWidth;
  }

  /** Height of the outer body layer. */
  getBodyHeight(): number {
    return this._bodyHeight;
  }

  /** Center of the outer body layer, in world coordinates. */
  getBodyCenter(): Vector3Tuple {
    return this._layers[0].getCenter();
  }
}
