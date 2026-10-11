/**
 * ChoroplethMap: a 2D thematic map that fills each GeoJSON feature with a color
 * from a value-driven color scale.
 *
 * The map is a {@link Group} of regions. Each feature becomes one region (a
 * single {@link Polygon} when it has one exterior ring, or a nested
 * {@link Group} of polygons for a MultiPolygon). Lon/lat are projected to 2D
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
  exteriorRings,
  type GeoFeature,
  type GeoFeatureCollection,
  type GeoLinearRing,
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

    const features = geojson.features ?? [];
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
        noDataColor,
        borderColor,
        borderWidth,
      });
    });
  }

  private _buildRegion(
    feature: GeoFeature,
    value: number | null | undefined,
    style: {
      fillOpacity: number;
      noDataColor: string;
      borderColor: string;
      borderWidth: number;
    },
  ): void {
    const hasValue = typeof value === 'number' && Number.isFinite(value);
    const color = hasValue ? this._colorScale.colorFor(value) : style.noDataColor;

    const rings = exteriorRings(feature.geometry);
    const polygons: Polygon[] = [];
    for (const ring of rings) {
      const polygon = this._buildPolygon(ring, color, style);
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
    ring: GeoLinearRing,
    color: string,
    style: { fillOpacity: number; borderColor: string; borderWidth: number },
  ): Polygon | null {
    // Drop a trailing point that duplicates the first (GeoJSON rings are
    // closed); Polygon closes the ring itself.
    const open = dropClosingPoint(ring);
    if (open.length < 3) return null;

    const vertices = open.map((position) => {
      const [x, y] = this._projection(position);
      return [x, y, 0] as [number, number, number];
    });

    const polygon = new Polygon({
      vertices,
      color: style.borderColor,
      strokeWidth: style.borderWidth,
      fillOpacity: style.fillOpacity,
      closed: true,
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

  /** Get the fill color assigned to a feature's region. */
  getRegionColor(index: number): string {
    return this._regionColors[index];
  }

  /** Get the polygons that make up a feature's region (one per exterior ring). */
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
