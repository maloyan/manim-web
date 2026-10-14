// Live example for SpeechBubble and ThoughtBubble.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { SpeechBubble, ThoughtBubble, Text, Dot, FadeIn, BLUE, YELLOW, GREEN, WHITE } =
    await import('manim-web');

  // Two speakers, drawn as dots.
  const alice = new Dot({ point: [-4, -1.8, 0], radius: 0.18, color: BLUE });
  const bob = new Dot({ point: [4, -1.8, 0], radius: 0.18, color: GREEN });

  // The content must sit where the bubble should be. The bubble wraps it.
  const hello = new Text({ text: 'Hello, world!', fontSize: 34, color: WHITE });
  hello.moveTo([-2.6, 1.1, 0]);
  const speech = new SpeechBubble({
    content: hello,
    color: BLUE,
    pointAt: [-4, -1.6, 0], // the tail tip lands on Alice
  });

  const idea = new Text({ text: 'What if it floats?', fontSize: 30, color: WHITE });
  idea.moveTo([2.6, 1.1, 0]);
  const thought = new ThoughtBubble({
    content: idea,
    color: YELLOW,
    tailDirection: [0.6, -1, 0], // no target, so the tail follows a direction
  });

  scene.add(alice, bob);
  await scene.play(new FadeIn(speech));
  await scene.play(new FadeIn(thought));
  await scene.wait(999999);
}

export default function BubblesExample() {
  return <ManimExample animationFn={animate} />;
}
