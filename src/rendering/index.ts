/**
 * Rendering module - GPU-accelerated Bezier curve rendering via custom shaders.
 *
 * Provides ManimGL-quality anti-aliased curves with variable stroke width,
 * round caps, and clean SDF-based rendering as an opt-in alternative to
 * the default Line2-based stroke rendering.
 */

export {
  createBezierShaderMaterial,
  updateBezierMaterialResolution,
  type BezierShaderMaterialOptions,
} from './BezierShaderMaterial';

export {
  BezierRenderer,
  type BezierRendererOptions,
  type BezierSegment,
} from './BezierRenderer';
