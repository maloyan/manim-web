// Live example component for the "New in 0.29, 0.30 and 0.31" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const { StateMachine, when, Square, Transform } = await import('manim-web');

  const idle = () => new Square({ sideLength: 1.6, color: '#58c4dd', strokeWidth: 4 });
  const active = () => new Square({ sideLength: 3, color: '#fc6255', strokeWidth: 4 });

  let shape = idle();
  shape.center();
  scene.add(shape);

  // Each state's onEnter records the shape it wants. A trigger input flips the
  // machine between the two states; update() evaluates the current state's
  // transitions and runs the target onEnter.
  let pendingTarget: any = null;
  const sm = new StateMachine();
  sm.addState('idle', { onEnter: () => (pendingTarget = idle()) });
  sm.addState('active', { onEnter: () => (pendingTarget = active()) });
  sm.triggerInput('toggle');
  sm.addTransition('idle', 'active', when('toggle').onTrigger());
  sm.addTransition('active', 'idle', when('toggle').onTrigger());

  for (let i = 0; i < 4; i++) {
    pendingTarget = null;
    sm.fire('toggle');
    sm.update(); // fires the transition, runs onEnter, which sets pendingTarget
    if (pendingTarget) {
      pendingTarget.center();
      await scene.play(new Transform(shape, pendingTarget, { duration: 1 }));
    }
    await scene.wait(0.5);
  }
  await scene.wait(999999);
}

export default function StateMachineExample() {
  return <ManimExample animationFn={animate} />;
}
