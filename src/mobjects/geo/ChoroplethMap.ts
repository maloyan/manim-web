/**
 * ChoroplethMap: a 2D thematic map that fills each GeoJSON feature with a color
 * from a value-driven color scale.
 *
 * The map is a {@link Group} of regions. Each feature becomes one region (a
 * single {@link Polygon} when it has one exterior ring, or a nested
 * {@link Group} of polygons for a MultiPolygon). Interior rings (holes) are
 * punched out of the fill. Lon/lat are projected to 2D
 * with a {@link GeoProjection} (equirectangular by default). The fill color
 * comes from a {@link ColorScale}; an optional border is drawn as the polygon
 * stroke.
 *
 * GeoJSON is passed in directly (dependency-injection seam), so tests and
 * callers supply plain objects with no network access.
 */

import { Group } from '../../core/Group';
import { Mobject } from '../../core/Mobject';
import { Polygon } from '../geometry/Polygon';
import { GRAY } from '../../constants/colors';
import {
  polygonRings,
  type GeoFeature,
  type GeoFeatureCollection,
  type GeoLinearRing,
  type PolygonRings,
} from './geojson';
import { equirectangular, type GeoProjection } from './projections';
import { ColorScale } from './colorScale';

/**
 * Reads the value a feature should be colored by. Return `null`/`undefined`
 * (or a non-finite number) to color the feature with the no-data color.
 */
export type ChoroplethValueAccessor = (
  feature: GeoFeature,
  index: number,
) => number | null | undefined;

/** Options for a {@link ChoroplethMap}. */
export interface ChoroplethMapOptions {
  /** The GeoJSON feature collection to render. */
  geojson: GeoFeatureCollection;
  /** Reads the numeric value per feature. */
  value: ChoroplethValueAccessor;
  /** Reference colors for the fill scale (interpolated). Default: a blue ramp. */
  colorScale?: string[];
  /** Fixed value domain `[min, max]`. Default: computed from the data. */
  domain?: [number, number];
  /** Fill opacity from 0 to 1. Default: 1. */
  fillOpacity?: number;
  /** Fill color used when a feature has no value. Default: Manim gray. */
  noDataColor?: string;
  /** Border (stroke) color. Default: '#1b263b'. */
  borderColor?: string;
  /** Border width in pixels. 0 hides the border. Default: 1. */
  borderWidth?: number;
  /** Projection from lon/lat to 2D. Default: equirectangular(). */
  projection?: GeoProjection;
}

/**
 * ChoroplethMap - a value-colored 2D map built from GeoJSON polygons.
 *
 * @example
 * ```typescript
 * const map = new ChoroplethMap({
 *   geojson: worldFeatureCollection,
 *   value: (feature) => feature.properties?.gdp as number,
 *   colorScale: ['#f7fbff', '#08306b'],
 *   borderWidth: 1,
 * });
 * map.scale(2);
 * scene.add(map);
 * ```
 */
export class ChoroplethMap extends Group {
  private _projection: GeoProjection;
  private _colorScale: ColorScale;
  private _regions: Mobject[] = [];
  private _regionColors: string[] = [];
  private _regionPolygons: Polygon[][] = [];
  private _features: GeoFeature[] = [];
  private _fillOpacity: number;
  private _noDataColor: string;
  private _fixedDomain: boolean;

  constructor(options: ChoroplethMapOptions) {
    super();

    const {
      geojson,
      value,
      colorScale = ['#0d1b2a', '#4cc9f0'],
      domain,
      fillOpacity = 1,
      noDataColor = GRAY,
      borderColor = '#1b263b',
      borderWidth = 1,
      projection = equirectangular(),
    } = options;

    this._projection = projection;
    this._fillOpacity = fillOpacity;
    this._noDataColor = noDataColor;
    this._fixedDomain = domain !== undefined;

    const features = geojson.features ?? [];
    this._features = features;
    const values = features.map((feature, index) => value(feature, index));

    this._colorScale = new ColorScale({ colors: colorScale, domain });
    if (!domain) {
      this._colorScale.setDomainFromValues(
        values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)),
      );
    }

    features.forEach((feature, index) => {
      this._buildRegion(feature, values[index], {
        fillOpacity,
        borderColor,
        borderWidth,
      });
    });
  }

  /**
   * Re-apply values: recompute each region's fill color from a new accessor and
   * update the region fills in place. The color/domain logic matches the
   * constructor: when the map was built without a fixed `domain`, the domain is
   * re-derived from the new values; a fixed domain is kept. The scene graph is
   * unchanged (same regions, same polygons), so this is safe to call every frame.
   *
   * @param value - Reads the new numeric value per feature.
   */
  setValues(value: ChoroplethValueAccessor): void {
    const values = this._features.map((feature, index) => value(feature, index));
    if (!this._fixedDomain) {
      this._colorScale.setDomainFromValues(
        values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)),
      );
    }
    values.forEach((v, index) => {
      const color = this._colorForValue(v);
      this._regionColors[index] = color;
      for (const polygon of this._regionPolygons[index]) {
        polygon.setFill(color, this._fillOpacity);
      }
    });
  }

  /** Map a feature value to its fill color (no-data color when non-finite). */
  private _colorForValue(value: number | null | undefined): string {
    const hasValue = typeof value === 'number' && Number.isFinite(value);
    return hasValue ? this._colorScale.colorFor(value) : this._noDataColor;
  }

  private _buildRegion(
    feature: GeoFeature,
    value: number | null | undefined,
    style: {
      fillOpacity: number;
      borderColor: string;
      borderWidth: number;
    },
  ): void {
    const color = this._colorForValue(value);

    const rings = polygonRings(feature.geometry);
    const polygons: Polygon[] = [];
    for (const polygonRing of rings) {
      const polygon = this._buildPolygon(polygonRing, color, style);
      if (polygon) polygons.push(polygon);
    }

    // One child per feature: the polygon itself when single, else a sub-group.
    const region: Mobject = polygons.length === 1 ? polygons[0] : new Group(...polygons);
    this.add(region);

    this._regions.push(region);
    this._regionColors.push(color);
    this._regionPolygons.push(polygons);
  }

  private _buildPolygon(
    rings: PolygonRings,
    color: string,
    style: { fillOpacity: number; borderColor: string; borderWidth: number },
  ): Polygon | null {
    // Drop a trailing point that duplicates the first (GeoJSON rings are
    // closed); Polygon closes each ring itself. Then project lon/lat to 2D.
    const projectRing = (ring: GeoLinearRing): [number, number, number][] =>
      dropClosingPoint(ring).map((position) => {
        const [x, y] = this._projection(position);
        return [x, y, 0];
      });

    const vertices = projectRing(rings.exterior);
    if (vertices.length < 3) return null;

    // Interior rings (holes) are punched out of the fill. Drop any that are too
    // small to bound an area.
    const holes = rings.holes.map(projectRing).filter((hole) => hole.length >= 3);

    const polygon = new Polygon({
      vertices,
      color: style.borderColor,
      strokeWidth: style.borderWidth,
      fillOpacity: style.fillOpacity,
      closed: true,
      holes: holes.length > 0 ? holes : undefined,
    });
    polygon.setFill(color, style.fillOpacity);
    return polygon;
  }

  /** Get the per-feature region mobjects (one entry per feature). */
  getRegions(): Mobject[] {
    return [...this._regions];
  }

  /** Get the number of regions (equals the number of input features). */
  getRegionCount(): number {
    return this._regions.length;
  }

  /**
   * Get the fill color assigned to a feature's region.
   *
   * @param index - The region index, from 0 to {@link getRegionCount} minus 1.
   * @returns The hex color string, or `undefined` if the index is out of range.
   */
  getRegionColor(index: number): string | undefined {
    if (index < 0 || index >= this._regionColors.length) return undefined;
    return this._regionColors[index];
  }

  /**
   * Get the polygons that make up a feature's region (one per exterior ring;
   * each carries its own interior rings as holes).
   */
  getRegionPolygons(index: number): Polygon[] {
    return [...(this._regionPolygons[index] ?? [])];
  }

  /** Get the projection used to place lon/lat. */
  getProjection(): GeoProjection {
    return this._projection;
  }

  /** Get the color scale mapping values to fill colors. */
  getColorScale(): ColorScale {
    return this._colorScale;
  }
}

/** Alias: some callers prefer the shorter `GeoMap` name. */
export const GeoMap = ChoroplethMap;

/**
 * Drop a ring's final vertex when it duplicates the first (a closed GeoJSON
 * ring). Returns a new array; the input is not mutated.
 */
function dropClosingPoint(ring: GeoLinearRing): GeoLinearRing {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1);
  }
  return ring;
}
