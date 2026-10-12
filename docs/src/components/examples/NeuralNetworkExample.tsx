// Live example component for the "New in 0.27 and 0.28" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { NeuralNetwork, FeedForwardLayer, forwardPass } = await import('manim-web');

  // Layers are placed left to right; a dense set of connection lines joins each
  // adjacent pair of layers.
  const net = new NeuralNetwork(
    [
      new FeedForwardLayer({ numNodes: 3 }),
      new FeedForwardLayer({ numNodes: 5 }),
      new FeedForwardLayer({ numNodes: 4 }),
      new FeedForwardLayer({ numNodes: 2 }),
    ],
    { layerSpacing: 1.1 },
  );
  net.center();
  scene.add(net);
  await scene.wait(0.5);

  // Light each gap's connections from the input layer to the output layer.
  await scene.play(forwardPass(net, { gapDuration: 0.8 }));
  await scene.wait(999999);
}

export default function NeuralNetworkExample() {
  return <ManimExample animationFn={animate} />;
}
