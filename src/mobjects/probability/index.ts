/**
 * Probability mobjects for manimweb
 *
 * This module provides mobjects for probability visualizations,
 * including sample spaces with partitioned rectangles and dice faces.
 */

// Sample Space
export {
  type BraceAnnotationOptions,
  type DivideOptions,
  type Partition,
  SampleSpace,
  type SampleSpaceOptions,
} from "./SampleSpace";

// Dice Face
export { createDiceRow, DiceFace, type DiceFaceOptions } from "./DiceFace";
