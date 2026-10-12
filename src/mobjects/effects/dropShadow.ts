/**
 * Per-mobject drop shadow as a one-call style.
 *
 * `withDropShadow(mobject, options)` returns a VGroup that holds one or more
 * shadow copies behind the original. Each shadow is a deep `copy()` of the
 * source, recolored to the shadow color at a reduced opacity, shifted by the
 * offset, and optionally scaled. The source is never recolored or moved: the
 * group holds the real original in front, so the result is a drop-in for it.
 *
 * There is no real blur pass. `layers` fakes a soft edge with several copies:
 * the strongest copy sits at the base offset, and each extra copy is fainter
 * and spreads farther out by `blur`.
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';

/** Options for {@link withDropShadow}. */
export interface DropShadowOptions {
  /** Shadow offset `[dx, dy]` in scene units. Default `[0.1, -0.1]` (down-right). */
  offset?: [number, number];
  /** Shadow color. Default black `#000000`. */
  color?: string;
  /** Shadow opacity of the strongest layer (0..1). Default `0.5`. */
  opacity?: number;
  /** Number of shadow copies. More copies fake a softer edge. Default `1`. */
  layers?: number;
  /** Extra outward spread of the outer layers, as a fraction of `offset`. */
  blur?: number;
  /** Uniform scale of each shadow copy about its center. Default `1`. */
  scale?: number;
}

interface ResolvedOptions {
  offset: [number, number];
  color: string;
  opacity: number;
  layers: number;
  blur: number;
  scale: number;
}

const DEFAULT_OFFSET: [number, number] = [0.1, -0.1];
const DEFAULT_COLOR = '#000000';
const DEFAULT_OPACITY = 0.5;
/** Outward spread of the farthest layer when `blur` is not set and layers > 1. */
const DEFAULT_MULTI_LAYER_SPREAD = 0.6;

function resolveOptions(options: DropShadowOptions): ResolvedOptions {
  const layers = Math.max(1, Math.floor(options.layers ?? 1));
  return {
    offset: options.offset ?? DEFAULT_OFFSET,
    color: options.color ?? DEFAULT_COLOR,
    opacity: options.opacity ?? DEFAULT_OPACITY,
    layers,
    blur: options.blur ?? (layers > 1 ? DEFAULT_MULTI_LAYER_SPREAD : 0),
    scale: options.scale ?? 1,
  };
}

/** Recolor every leaf of one shadow copy to the shadow color at `opacity`. */
function paintShadow(shadow: VMobject, color: string, opacity: number): void {
  for (const member of shadow.familyMembersWithPoints()) {
    member.setColor(color);
    member.setStrokeOpacity(opacity);
    member.setFillOpacity(opacity);
  }
}

/**
 * Return a VGroup with a drop shadow behind `mobject`.
 *
 * The source is copied for every shadow layer, so it is never recolored,
 * moved, or scaled. The returned group holds the shadow layers first (drawn
 * behind) and the original last (drawn in front).
 *
 * @param mobject - Source VMobject (shape, text, group, ...)
 * @param options - Shadow options; see {@link DropShadowOptions}
 * @returns A VGroup = `[shadow layers..., original]`
 */
export function withDropShadow<T extends VMobject>(
  mobject: T,
  options: DropShadowOptions = {},
): VGroup {
  const opts = resolveOptions(options);
  const [dx, dy] = opts.offset;
  const n = opts.layers;

  // An empty VGroup skips the constructor's normalizeTransform(), so the
  // children keep their own points and positions exactly (the shadow offset
  // stays expressed as a clean shift, and the original is untouched).
  const group = new VGroup();

  // Layer `i = 1` is the strongest copy at the base offset. Higher `i` are
  // fainter and spread farther out to fake a soft edge. Add the faintest and
  // farthest first so the strongest shadow paints nearest the front.
  for (let i = n; i >= 1; i--) {
    const extra = n === 1 ? 0 : (i - 1) / (n - 1);
    const spread = 1 + opts.blur * extra;
    const layerOpacity = opts.opacity * ((n - i + 1) / n);

    const shadow = mobject.copy();
    if (opts.scale !== 1) shadow.scale(opts.scale);
    shadow.shift([dx * spread, dy * spread, 0]);
    paintShadow(shadow, opts.color, layerOpacity);
    group.add(shadow);
  }

  // The original sits in front of every shadow (added last = drawn on top).
  group.add(mobject);
  return group;
}
