/**
 * Geographical maps module for manim-web.
 *
 * Provides a 2D choropleth map ({@link ChoroplethMap}) and a 3D globe
 * ({@link Globe}) built from GeoJSON. See each class for coordinate
 * conventions and covered projections.
 */

// GeoJSON types and helpers
export {
  exteriorRings,
  type GeoPosition,
  type GeoLinearRing,
  type GeoPolygon,
  type GeoMultiPolygon,
  type GeoGeometry,
  type GeoProperties,
  type GeoFeature,
  type GeoFeatureCollection,
} from './geojson';

// Projections
export {
  equirectangular,
  mercator,
  type GeoProjection,
  type EquirectangularOptions,
  type MercatorOptions,
} from './projections';

// Color scale
export { ColorScale, type ColorScaleOptions } from './colorScale';

// 2D choropleth map
export {
  ChoroplethMap,
  GeoMap,
  type ChoroplethMapOptions,
  type ChoroplethValueAccessor,
} from './ChoroplethMap';

// 3D globe
export {
  Globe,
  type LatLon,
  type GlobeOptions,
  type GlobePointOptions,
  type GlobeArcOptions,
  type GlobeGraticuleOptions,
} from './Globe';
