/**
 * AnimateChoropleth: tween a {@link ChoroplethMap}'s region fills from their
 * current colors to the colors for a new set of values.
 *
 * This is the "choropleth over time" animation: give it the map and a new value
 * accessor, and every region's fill crossfades from its present color to the
 * color the new value maps to. Colors are blended with {@link interpolateColor}
 * (the same RGB blend the rest of the library uses). It mirrors
 * {@link FadeToColor}, but drives each region's fill (not a single stroke color)
 * and reads its targets from the map's own value/color/domain logic.
 *
 * @example
 * ```typescript
 * scene.play(animateChoropleth(map, newValues, { runTime: 2 }));
 * ```
 */

import { Animation, type AnimationOptions } from '../../animation/Animation';
import { interpolateColor } from '../../utils/color';
import { ChoroplethMap, type ChoroplethValueAccessor } from './ChoroplethMap';

/** Options for {@link AnimateChoropleth} / {@link animateChoropleth}. */
export interface AnimateChoroplethOptions extends Omit<AnimationOptions, 'duration'> {
  /** Run time in seconds. Default: 1. Alias of the base `duration`. */
  runTime?: number;
  /** Run time in seconds (alias of `runTime`). */
  duration?: number;
}

/**
 * AnimateChoropleth - crossfades every region fill of a {@link ChoroplethMap}
 * toward the colors a new value accessor produces.
 */
export class AnimateChoropleth extends Animation<ChoroplethMap> {
  private _toValue: ChoroplethValueAccessor;
  private _startColors: string[] = [];
  private _targetColors: string[] = [];

  constructor(
    map: ChoroplethMap,
    toValue: ChoroplethValueAccessor,
    options: AnimateChoroplethOptions = {},
  ) {
    const { runTime, duration, ...rest } = options;
    super(map, { ...rest, duration: runTime ?? duration ?? 1 });
    this._toValue = toValue;
  }

  override begin(): void {
    super.begin();
    const map = this.mobject;
    const count = map.getRegionCount();

    // Snapshot the colors each region shows right now.
    this._startColors = [];
    for (let index = 0; index < count; index++) {
      this._startColors.push(map.getRegionColor(index));
    }

    // Apply the new values once to read the target colors (this also updates the
    // data-driven domain), then restore the visible start state for alpha 0.
    map.setValues(this._toValue);
    this._targetColors = [];
    for (let index = 0; index < count; index++) {
      this._targetColors.push(map.getRegionColor(index));
    }
    this._applyColors(0);
  }

  interpolate(alpha: number): void {
    this._applyColors(alpha);
  }

  override finish(): void {
    // Lock in exact target colors (and keep getRegionColor consistent).
    this.mobject.setValues(this._toValue);
    super.finish();
  }

  /** Blend each region's fill from its start color to its target color. */
  private _applyColors(alpha: number): void {
    const map = this.mobject;
    for (let index = 0; index < this._startColors.length; index++) {
      const color = interpolateColor(this._startColors[index], this._targetColors[index], alpha);
      for (const polygon of map.getRegionPolygons(index)) {
        polygon.setFill(color);
      }
    }
  }
}

/**
 * Create an {@link AnimateChoropleth}. Convenience factory matching the
 * `scene.play(animateChoropleth(map, toValue, { runTime }))` call shape.
 *
 * @param map - The map to recolor.
 * @param toValue - Reads the new numeric value per feature.
 * @param options - Run time and rate function.
 * @returns The animation.
 */
export function animateChoropleth(
  map: ChoroplethMap,
  toValue: ChoroplethValueAccessor,
  options?: AnimateChoroplethOptions,
): AnimateChoropleth {
  return new AnimateChoropleth(map, toValue, options);
}
