/**
 * Point-based mobjects rendered as particles using THREE.js Points.
 * Unlike VMobjects which render connected paths, PMobjects render
 * discrete points as particles for efficient visualization.
 */

export { PMobject, type PointData, type PMobjectOptions } from './PMobject';
export { PGroup, type PGroupOptions } from './PGroup';
export { PointMobject, type PointMobjectOptions } from './PointMobject';
export { PointCloudDot, type PointCloudDotOptions } from './PointCloudDot';
export { Mobject1D, type Mobject1DOptions } from './Mobject1D';
export { Mobject2D, type Mobject2DOptions, type Distribution2D } from './Mobject2D';
