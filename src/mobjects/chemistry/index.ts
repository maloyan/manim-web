/**
 * Chemistry mobjects for manim-web.
 *
 * 2D skeletal molecule structures: atoms as element labels, bonds as
 * single/double/triple lines with optional wedge/dash stereochemistry, plus
 * prebuilt example molecules and the CPK color palette.
 */

export { MoleculeMobject } from './MoleculeMobject';
export {
  ElectronPushingArrow,
  arrowBetweenAtoms,
  DEFAULT_ELECTRON_ARROW_COLOR,
  type ElectronPushingArrowOptions,
  type ArrowElectrons,
} from './ElectronPushingArrow';
export { ReactionArrow, type ReactionArrowOptions, type ReactionArrowKind } from './ReactionArrow';
export { water, methane, benzene, ethanol, type MoleculeBuilderOptions } from './molecules';
export { parseMolfile, parseSdf, moleculeFromMolfile, type ParsedMolfile } from './molfile';
export {
  parseSmiles,
  moleculeFromSmiles,
  type ParsedSmiles,
  type SmilesAtom,
  type SmilesBond,
} from './smiles';
export { cpkColor, normalizeElement, CPK_COLORS, DEFAULT_ELEMENT_COLOR } from './cpkColors';
export {
  type AtomSpec,
  type BondSpec,
  type BondOrder,
  type BondStyle,
  type MoleculeOptions,
  type AtomRender,
  type BondRender,
} from './chemistryTypes';
