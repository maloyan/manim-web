/**
 * Re-export barrel for backward compatibility.
 * Each scene extension class now lives in its own file.
 */
export { ThreeDScene, type ThreeDSceneOptions } from "./ThreeDScene";
export {
  MovingCameraScene,
  type MovingCameraSceneOptions,
} from "./MovingCameraScene";
export {
  ZoomDisplayPopOut,
  ZoomedScene,
  type ZoomedSceneOptions,
} from "./ZoomedScene";
export { VectorScene, type VectorSceneOptions } from "./VectorScene";
export {
  LinearTransformationScene,
  type LinearTransformationSceneOptions,
  type Matrix2D,
} from "./LinearTransformationScene";
