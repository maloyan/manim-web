/**
 * Default caption text of the 3D cell kit, one entry per organelle kind.
 *
 * Each body is one short sentence in plain words; a footnote gives a scale
 * caveat where the drawing is not to scale. The table is mutable on purpose:
 * assign to an entry to change the default caption of every new organelle of
 * that kind, or pass `info` to one organelle.
 */

import type { OrganelleInfo } from './cell3dTypes';

export const ORGANELLE_INFO: Record<string, OrganelleInfo> = {
  cell: {
    title: 'Animal cell',
    body: 'A cutaway of one human cell and its main parts.',
    footnote: 'A typical cell is about 20 micrometres across.',
  },
  'cell membrane': {
    title: 'Cell membrane',
    body: 'A double layer of fat molecules that decides what enters and leaves.',
    footnote: 'About 5 nanometres thick in life. Drawn much thicker here.',
  },
  nucleus: {
    title: 'Nucleus',
    body: "Holds the DNA, the cell's recipes for its proteins.",
  },
  'nuclear pore': {
    title: 'Nuclear pore',
    body: 'A gate through the nuclear envelope. Messenger RNA goes out, proteins come in.',
    footnote: 'A nucleus has a few thousand of them, far smaller than drawn.',
  },
  'rough er': {
    title: 'Rough ER',
    body: 'Folded sheets covered in ribosomes. Their proteins fold inside the sheets.',
    footnote: 'ER is short for endoplasmic reticulum. It is joined to the nuclear envelope.',
  },
  'smooth er': {
    title: 'Smooth ER',
    body: 'A net of tubes with no ribosomes. It makes fats and stores calcium.',
  },
  'golgi apparatus': {
    title: 'Golgi apparatus',
    body: 'Puts the last changes on proteins, sorts them and sends them on in vesicles.',
    footnote: 'Cargo comes in on the side that faces the ER and goes out on the far side.',
  },
  mitochondrion: {
    title: 'Mitochondrion',
    body: 'Burns food with oxygen and stores the energy as ATP.',
    footnote: 'The inner membrane folds into cristae, where most ATP is made.',
  },
  ribosome: {
    title: 'Ribosome',
    body: 'Reads messenger RNA and links amino acids into a protein chain.',
    footnote: 'A cell has millions of them. Drawn many times too large.',
  },
  vesicle: {
    title: 'Vesicle',
    body: 'A small bubble of membrane that carries cargo through the cell.',
  },
  lysosome: {
    title: 'Lysosome',
    body: 'A sac of acid and enzymes that digests old parts and bacteria.',
  },
  peroxisome: {
    title: 'Peroxisome',
    body: 'Breaks down fatty acids and turns hydrogen peroxide into water and oxygen.',
  },
  centrosome: {
    title: 'Centrosome',
    body: 'Two centrioles at right angles. Microtubules grow out from here.',
    footnote: 'Each centriole is a ring of nine triplets of microtubules.',
  },
  cytoskeleton: {
    title: 'Cytoskeleton',
    body: 'Protein filaments that shape the cell and carry cargo.',
    footnote:
      'Microtubules are tracks, actin shapes the edge, intermediate filaments resist pulling.',
  },
};

/** The caption of a kind with overrides merged in; an unknown kind uses its name as title. */
export function resolveInfo(kind: string, overrides?: Partial<OrganelleInfo>): OrganelleInfo {
  const base = ORGANELLE_INFO[kind] ?? { title: kind, body: '' };
  return { ...base, ...overrides };
}
