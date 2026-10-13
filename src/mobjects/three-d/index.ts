/**
 * 3D Mobjects for manimweb
 *
 * This module provides 3D geometric shapes and surfaces as Mobjects
 * that can be rendered in a 3D scene with proper lighting and materials.
 */

// Shared 3D mesh base class
export { Mobject3D } from './Mobject3D';

// Basic 3D primitives
export { Sphere, type SphereOptions } from './Sphere';
export { Cube, Box3D, type CubeOptions, type Box3DOptions } from './Cube';
export { Cylinder, Cone, type CylinderOptions, type ConeOptions } from './Cylinder';
export { Torus, type TorusOptions } from './Torus';

// Platonic solids
export {
  Polyhedron,
  Tetrahedron,
  Octahedron,
  Icosahedron,
  Dodecahedron,
  type PolyhedronOptions,
  type TetrahedronOptions,
  type OctahedronOptions,
  type IcosahedronOptions,
  type DodecahedronOptions,
} from './Polyhedra';

// Lines and arrows
export { Line3D, type Line3DOptions } from './Line3D';
export { Arrow3D, Vector3D, type Arrow3DOptions } from './Arrow3D';

// Shared mesh orientation helper (local +Y -> direction)
export { orientMeshAlong } from './meshOrient';

// Molecular primitives (bonds, tubes)
export { Bond3D, type Bond3DOptions } from './Bond3D';
export { TubeFromPoints, type TubeFromPointsOptions } from './TubeFromPoints';

// Surfaces
export { Surface3D, type Surface3DOptions } from './Surface3D';
export {
  ParametricSurface,
  SurfacePresets,
  type ParametricSurfaceOptions,
} from './ParametricSurface';
export {
  TexturedSurface,
  texturedSphere,
  type TexturedSurfaceOptions,
  type TexturedSphereOptions,
} from './TexturedSurface';

// Coordinate systems
export { ThreeDAxes, type ThreeDAxesOptions } from './ThreeDAxes';

// Additional 3D primitives and extensions
export {
  Prism,
  Dot3D,
  ThreeDVMobject,
  type PrismOptions,
  type Dot3DOptions,
  type ThreeDVMobjectOptions,
} from './ThreeDExtensions';

// Convex Hull
export { ConvexHull3D, type ConvexHull3DOptions } from './ConvexHull3D';

// Marching cubes (isosurface extraction)
export {
  marchingCubes,
  type MarchingCubesOptions,
  type MarchingCubesResult,
  type ScalarField3D,
} from './marchingCubes';

// ImplicitSurface (3D isosurface)
export { ImplicitSurface, type ImplicitSurfaceOptions } from './ImplicitSurface';

// GPU instancing (opt-in, for large scenes)
export {
  InstancedMobject,
  type InstancedMobjectOptions,
  type InstanceTransform,
} from './InstancedMobject';

// Extruded / beveled 3D text
export {
  Text3D,
  setFontLoaderFactory,
  setTextGeometryFactory,
  DEFAULT_FONT_URL,
  type Text3DOptions,
  type Text3DFromUrlOptions,
  type Text3DBevel,
  type Text3DGeometryParams,
  type ParsedFont,
  type FontLoaderLike,
  type FontLoaderFactory,
  type TextGeometryFactory,
} from './Text3D';
