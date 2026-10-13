/**
 * Prebuilt example molecules.
 *
 * Each builder returns a {@link MoleculeMobject} with explicit atom and bond
 * coordinates. These cover the common teaching molecules without a SMILES
 * parser, which stays out of scope. Every builder accepts style overrides
 * (bond length, colors, label options) through MoleculeBuilderOptions.
 */

import { MoleculeMobject } from './MoleculeMobject';
import { MoleculeOptions } from './chemistryTypes';

/** Style overrides a builder forwards to the MoleculeMobject (no atoms/bonds). */
export type MoleculeBuilderOptions = Partial<Omit<MoleculeOptions, 'atoms' | 'bonds'>>;

/** Water, H2O. An oxygen with two hydrogens at the bent 104.5 degree angle. */
export function water(options: MoleculeBuilderOptions = {}): MoleculeMobject {
  return new MoleculeMobject({
    atoms: [
      { element: 'O', x: 0, y: 0 },
      { element: 'H', x: -0.79, y: -0.61 },
      { element: 'H', x: 0.79, y: -0.61 },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
    ],
    ...options,
  });
}

/** Methane, CH4. A central carbon with four hydrogens; the carbon is labeled. */
export function methane(options: MoleculeBuilderOptions = {}): MoleculeMobject {
  return new MoleculeMobject({
    atoms: [
      { element: 'C', x: 0, y: 0 },
      { element: 'H', x: 0, y: 1 },
      { element: 'H', x: 0, y: -1 },
      { element: 'H', x: -1, y: 0 },
      { element: 'H', x: 1, y: 0 },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
    ],
    showCarbonLabels: true,
    ...options,
  });
}

/**
 * Benzene, C6H6. Six carbons in a regular hexagon ring with alternating single
 * and double bonds (Kekule structure). Carbons stay implicit (skeletal).
 */
export function benzene(options: MoleculeBuilderOptions = {}): MoleculeMobject {
  const atoms = Array.from({ length: 6 }, (_unused, i) => {
    const angle = (Math.PI / 3) * i + Math.PI / 2;
    return { element: 'C', x: Math.cos(angle), y: Math.sin(angle) };
  });
  const bonds = Array.from({ length: 6 }, (_unused, i) => ({
    from: i,
    to: (i + 1) % 6,
    // cast: pin the literal type so Array.from infers the bond-order union, not number.
    order: (i % 2 === 0 ? 2 : 1) as 1 | 2,
  }));
  return new MoleculeMobject({ atoms, bonds, ...options });
}

/**
 * Ethanol, C2H5OH. Two carbons and a hydroxyl group, drawn skeletal: the
 * carbons are implicit, the oxygen and its hydrogen are labeled.
 */
export function ethanol(options: MoleculeBuilderOptions = {}): MoleculeMobject {
  return new MoleculeMobject({
    atoms: [
      { element: 'C', x: 0, y: 0 },
      { element: 'C', x: 0.87, y: 0.5 },
      { element: 'O', x: 1.74, y: 0 },
      { element: 'H', x: 2.61, y: 0.5 },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
    ],
    ...options,
  });
}
