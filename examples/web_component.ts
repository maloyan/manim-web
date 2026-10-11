import {
  registerManimElement,
  ManimSceneElement,
  Player,
  Circle,
  Square,
  Create,
  Transform,
  FadeOut,
  BLACK,
  BLUE,
  RED,
} from '../src/index.ts';

// Define the <manim-scene> custom element. Safe to call more than once.
registerManimElement();

// The element needs a factory that builds the scene or player for its
// container. Bundler users set the factory on the element property. Plain
// HTML users instead point the `src` attribute at a module that
// default-exports the same factory.
const element = document.querySelector('manim-scene') as ManimSceneElement;

element.scene = (container: HTMLElement) => {
  const player = new Player(container, {
    width: 800,
    height: 450,
    backgroundColor: BLACK,
  });

  player.sequence(async (scene) => {
    const circle = new Circle({ radius: 1.5, color: BLUE, fillOpacity: 0.5 });
    await scene.play(new Create(circle));

    const square = new Square({ sideLength: 3, color: RED, fillOpacity: 0.5 });
    await scene.play(new Transform(circle, square));

    await scene.play(new FadeOut(circle));
  });

  return player;
};
