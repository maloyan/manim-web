export {
  // Letter-by-letter animations
  AddTextLetterByLetter,
  addTextLetterByLetter,
  type AddTextLetterByLetterOptions,
  Create,
  create,
  // Types
  type CreateOptions,
  DrawBorderThenFill,
  drawBorderThenFill,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
  Uncreate,
  uncreate,
  Unwrite,
  unwrite,
  // Write animations for text
  Write,
  write,
  type WriteOptions,
} from "./Create";

// Typing with cursor animations
export {
  TypeWithCursor,
  typeWithCursor,
  type TypeWithCursorOptions,
  UntypeWithCursor,
  untypeWithCursor,
  type UntypeWithCursorOptions,
} from "./TypeWithCursor";

// Extended creation animations
export {
  // Word by word text animation
  AddTextWordByWord,
  addTextWordByWord,
  type AddTextWordByWordOptions,
  // Show submobjects cumulatively
  ShowIncreasingSubsets,
  showIncreasingSubsets,
  type ShowIncreasingSubsetsOptions,
  // Show partial path
  ShowPartial,
  showPartial,
  type ShowPartialOptions,
  // Show one submobject at a time
  ShowSubmobjectsOneByOne,
  showSubmobjectsOneByOne,
  type ShowSubmobjectsOneByOneOptions,
  // Spiral in effect
  SpiralIn,
  spiralIn,
  type SpiralInOptions,
} from "./CreationExtensions";
