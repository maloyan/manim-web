// Live example for the 0.38 ReactionArrow mobject: the four reaction symbols an
// organic chemist draws between reactants and products, stacked in one 2D frame.
// forward (one head), reversible (two full heads), equilibrium (two harpoon
// half-heads) and resonance (a head at both ends). ReactionArrow is 2D, so a
// regular Scene. Each row flanks its arrow with a reactant formula on the left
// and a product formula on the right, drawn as MathTexImage so the chemical
// subscripts and superscripts read correctly. White arrows and formulas read on
// the dark background.
import React from 'react';
import ManimExample from '../ManimExample';

// One row per arrow kind. The arrow shaft spans x = -2..2 at `y`; the reactant
// formula sits left of the shaft, the product formula right of it.
interface Row {
  y: number;
  kind: 'forward' | 'reversible' | 'equilibrium' | 'resonance';
  reactant: string;
  product: string;
  above?: string;
  below?: string;
}

const ROWS: Row[] = [
  {
    y: 2.4,
    kind: 'forward',
    reactant: 'C_2H_4',
    product: 'C_2H_5OH',
    above: 'cat., Δ',
    below: 'H2O',
  },
  { y: 0.8, kind: 'reversible', reactant: 'N_2', product: 'NH_3', above: 'k1' },
  { y: -0.8, kind: 'equilibrium', reactant: 'CH_3COOH', product: 'CH_3COO^-' },
  { y: -2.4, kind: 'resonance', reactant: 'SO_2', product: 'SO_2' },
];

async function animate(scene: any) {
  const { ReactionArrow, MathTexImage, Create, FadeIn } = await import('manim-web');

  // Rows are drawn top to bottom. Each play reveals the reactant, the arrow and
  // the product together, so every step reads as "reactant -> product".
  for (const row of ROWS) {
    const reactant = new MathTexImage({ latex: row.reactant, color: '#ffffff', fontSize: 32 });
    reactant.moveTo([-4.2, row.y, 0]);

    const product = new MathTexImage({ latex: row.product, color: '#ffffff', fontSize: 32 });
    product.moveTo([4.2, row.y, 0]);

    const arrow = new ReactionArrow({
      start: [-2, row.y, 0],
      end: [2, row.y, 0],
      kind: row.kind,
      conditionsAbove: row.above,
      conditionsBelow: row.below,
      color: '#ffffff',
      strokeWidth: 6,
    });

    await scene.play(
      new FadeIn(reactant, { duration: 0.9 }),
      new Create(arrow, { duration: 0.9 }),
      new FadeIn(product, { duration: 0.9 }),
    );
  }
}

export default function ReactionArrowExample() {
  return <ManimExample animationFn={animate} />;
}
