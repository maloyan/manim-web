// Live example for the 0.38 ElectronPushingArrow mobject: an SN2-style step
// drawn with curved electron-pushing arrows over a 2D skeletal molecule. A
// nucleophile O attacks a carbon C while the C-Br bond breaks toward Br. 2D, so
// a regular Scene. Both arrows are drawn with Create, so the curl reveals
// progressively like a hand-drawn mechanism arrow.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { MoleculeMobject, ElectronPushingArrow, arrowBetweenAtoms, Create } =
    await import('manim-web');

  // Atom 0 = nucleophile O (top left), atom 1 = carbon C, atom 2 = leaving
  // group Br (bottom right). One C-Br single bond that the second arrow breaks.
  const molecule = new MoleculeMobject({
    atoms: [
      { element: 'O', x: -1.2, y: 1.2 },
      { element: 'C', x: 0.6, y: 0 },
      { element: 'Br', x: 2.4, y: -0.6 },
    ],
    bonds: [{ from: 1, to: 2 }],
    showCarbonLabels: true,
  });

  // center() moves the molecule by -oldCenter. The arrows below are built from
  // the ORIGINAL atom coordinates (arrowBetweenAtoms reads the un-centered atom
  // positions), so shift each arrow by the same delta to keep them aligned.
  const oldCenter = molecule.getCenter();
  const delta: [number, number, number] = [-oldCenter[0], -oldCenter[1], -oldCenter[2]];
  molecule.center();
  await scene.play(new Create(molecule, { duration: 1.5 }));

  // Nucleophilic attack: an electron pair moves from O (atom 0) to C (atom 1).
  // bulge/direction bow the arrow up and clear of the atom labels.
  const attack = arrowBetweenAtoms(molecule, 0, 1, {
    electrons: 'pair',
    bulge: 0.35,
    direction: 'ccw',
    color: '#e84393',
    strokeWidth: 6,
  });
  attack.shift(delta);
  await scene.play(new Create(attack, { duration: 1 }));

  // Bond breaking: the C-Br bonding pair leaves onto Br. Start near the middle
  // of the C-Br bond and end near Br; direction 'cw' bows it clear of the label.
  const breaking = new ElectronPushingArrow({
    from: [1.5, -0.3, 0],
    to: [2.4, -0.9, 0],
    electrons: 'pair',
    bulge: 0.3,
    direction: 'cw',
    color: '#f368e0',
    strokeWidth: 6,
  });
  breaking.shift(delta);
  await scene.play(new Create(breaking, { duration: 1 }));
}

export default function ReactionMechanismExample() {
  return <ManimExample animationFn={animate} />;
}
