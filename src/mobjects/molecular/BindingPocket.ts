/**
 * BindingPocket - a translucent or wireframe sphere marking a binding site.
 *
 * A binding pocket is the region of a protein a ligand docks into. BindingPocket
 * is a {@link Group} that holds a single {@link Sphere} at a center with a
 * radius, drawn either as a translucent surface or as a wireframe shell, so the
 * ligand stays visible as it enters.
 *
 * @example
 * ```typescript
 * const pocket = new BindingPocket({ center: [2, 0, 1], radius: 3 });
 * scene.add(pocket);
 * ```
 */

import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { Sphere } from '../three-d/Sphere';

/** The draw style of a {@link BindingPocket}. */
export type BindingPocketStyle = 'wireframe-sphere' | 'translucent-surface';

/** Options for a {@link BindingPocket}. */
export interface BindingPocketOptions {
  /** The pocket center `[x, y, z]`. */
  center: Vector3Tuple;
  /** The pocket radius. Default: 3. */
  radius?: number;
  /** The draw style. Default: `'translucent-surface'`. */
  style?: BindingPocketStyle;
  /** The sphere color. Default: `'#66ccff'`. */
  color?: string;
  /** The opacity from 0 to 1. Default: 0.25. */
  opacity?: number;
}

export class BindingPocket extends Group {
  private readonly _center: Vector3Tuple;
  private readonly _radius: number;
  private readonly _pocketStyle: BindingPocketStyle;
  private readonly _pocketColor: string;
  private readonly _pocketOpacity: number;

  /** The sphere that draws the pocket. */
  readonly sphere: Sphere;

  constructor(options: BindingPocketOptions) {
    super();

    this._center = [...options.center];
    this._radius = options.radius ?? 3;
    this._pocketStyle = options.style ?? 'translucent-surface';
    this._pocketColor = options.color ?? '#66ccff';
    this._pocketOpacity = options.opacity ?? 0.25;

    this.sphere = new Sphere({
      center: this._center,
      radius: this._radius,
      color: this._pocketColor,
      opacity: this._pocketOpacity,
      wireframe: this._pocketStyle === 'wireframe-sphere',
    });
    this.add(this.sphere);
  }

  /** The pocket center `[x, y, z]`. */
  override getCenter(): Vector3Tuple {
    return [...this._center];
  }

  /** The pocket radius. */
  getRadius(): number {
    return this._radius;
  }

  /** The draw style. */
  getStyle(): BindingPocketStyle {
    return this._pocketStyle;
  }

  override copy(): BindingPocket {
    const copy = new BindingPocket({
      center: this._center,
      radius: this._radius,
      style: this._pocketStyle,
      color: this._pocketColor,
      opacity: this._pocketOpacity,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
