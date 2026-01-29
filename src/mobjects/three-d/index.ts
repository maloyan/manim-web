/**
 * 3D Mobjects for manimweb
 *
 * This module provides 3D geometric shapes and surfaces as Mobjects
 * that can be rendered in a 3D scene with proper lighting and materials.
 */

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

// Surfaces
export { Surface3D, type Surface3DOptions } from './Surface3D';
export {
  ParametricSurface,
  SurfacePresets,
  type ParametricSurfaceOptions,
} from './ParametricSurface';

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
