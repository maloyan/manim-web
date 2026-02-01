/**
 * Probability mobjects for manimweb
 *
 * This module provides mobjects for probability visualizations,
 * including sample spaces with partitioned rectangles and dice faces.
 */

// Sample Space
export {
  SampleSpace,
  type SampleSpaceOptions,
  type Partition,
  type DivideOptions,
  type BraceAnnotationOptions,
} from './SampleSpace';

// Dice Face
export {
  DiceFace,
  createDiceRow,
  type DiceFaceOptions,
} from './DiceFace';
