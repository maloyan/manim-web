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
  polygonRings,
  type PolygonRings,
  type GeoPosition,
  type GeoLinearRing,
  type GeoPolygon,
  type GeoMultiPolygon,
  type GeoGeometry,
  type GeoPoint,
  type GeoMultiPoint,
  type GeoLineString,
  type GeoMultiLineString,
  type GeoProperties,
  type GeoFeature,
  type GeoFeatureCollection,
} from './geojson';

// TopoJSON -> GeoJSON conversion
export {
  topojsonToGeojson,
  type Topology,
  type TopoTransform,
  type TopoGeometryBase,
  type TopoGeometryObject,
  type TopoPoint,
  type TopoMultiPoint,
  type TopoLineString,
  type TopoMultiLineString,
  type TopoPolygon,
  type TopoMultiPolygon,
  type TopoGeometryCollection,
  type TopoNullGeometry,
} from './topojson';

// Projections
export {
  equirectangular,
  mercator,
  orthographic,
  albers,
  albersUsa,
  robinson,
  mollweide,
  isProjectedPointVisible,
  type GeoProjection,
  type EquirectangularOptions,
  type MercatorOptions,
  type OrthographicOptions,
  type AlbersOptions,
  type AlbersUsaOptions,
  type RobinsonOptions,
  type MollweideOptions,
} from './projections';

// Color scale
export { ColorScale, type ColorScaleOptions } from './colorScale';

// 2D choropleth map
export {
  ChoroplethMap,
  GeoMap,
  type ChoroplethMapOptions,
  type ChoroplethValueAccessor,
  type GeoBounds,
} from './ChoroplethMap';

// Animated choropleth (recolor regions over time)
export {
  AnimateChoropleth,
  animateChoropleth,
  type AnimateChoroplethOptions,
} from './AnimateChoropleth';

// 2D flow arc (curved flow line between two geo points)
export { FlowArc, type FlowArcOptions } from './FlowArc';

// 3D globe
export {
  Globe,
  type LatLon,
  type GlobeOptions,
  type GlobePointOptions,
  type GlobeArcOptions,
  type GlobeGraticuleOptions,
} from './Globe';
