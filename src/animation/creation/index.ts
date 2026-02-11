export {
  Create,
  create,
  DrawBorderThenFill,
  drawBorderThenFill,
  Uncreate,
  uncreate,
  // Write animations for text
  Write,
  write,
  Unwrite,
  unwrite,
  // Letter-by-letter animations
  AddTextLetterByLetter,
  addTextLetterByLetter,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
  // Types
  type CreateOptions,
  type WriteOptions,
  type AddTextLetterByLetterOptions,
} from './Create';

// Typing with cursor animations
export {
  TypeWithCursor,
  typeWithCursor,
  UntypeWithCursor,
  untypeWithCursor,
  type TypeWithCursorOptions,
  type UntypeWithCursorOptions,
} from './TypeWithCursor';

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
} from './CreationExtensions';
