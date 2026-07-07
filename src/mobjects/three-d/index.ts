/**
 * 3D Mobjects for manimweb
 *
 * This module provides 3D geometric shapes and surfaces as Mobjects
 * that can be rendered in a 3D scene with proper lighting and materials.
 */

// Shared 3D mesh base class
export { Mobject3D } from "./Mobject3D";

// Basic 3D primitives
export { Sphere, type SphereOptions } from "./Sphere";
export { Box3D, type Box3DOptions, Cube, type CubeOptions } from "./Cube";
export {
  Cone,
  type ConeOptions,
  Cylinder,
  type CylinderOptions,
} from "./Cylinder";
export { Torus, type TorusOptions } from "./Torus";

// Platonic solids
export {
  Dodecahedron,
  type DodecahedronOptions,
  Icosahedron,
  type IcosahedronOptions,
  Octahedron,
  type OctahedronOptions,
  Polyhedron,
  type PolyhedronOptions,
  Tetrahedron,
  type TetrahedronOptions,
} from "./Polyhedra";

// Lines and arrows
export { Line3D, type Line3DOptions } from "./Line3D";
export { Arrow3D, type Arrow3DOptions, Vector3D } from "./Arrow3D";

// Surfaces
export { Surface3D, type Surface3DOptions } from "./Surface3D";
export {
  ParametricSurface,
  type ParametricSurfaceOptions,
  SurfacePresets,
} from "./ParametricSurface";
export {
  texturedSphere,
  type TexturedSphereOptions,
  TexturedSurface,
  type TexturedSurfaceOptions,
} from "./TexturedSurface";

// Coordinate systems
export { ThreeDAxes, type ThreeDAxesOptions } from "./ThreeDAxes";

// Additional 3D primitives and extensions
export {
  Dot3D,
  type Dot3DOptions,
  Prism,
  type PrismOptions,
  ThreeDVMobject,
  type ThreeDVMobjectOptions,
} from "./ThreeDExtensions";

// Convex Hull
export { ConvexHull3D, type ConvexHull3DOptions } from "./ConvexHull3D";
