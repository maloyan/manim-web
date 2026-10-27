// Live example component for the "Bivariate normal" docs page.
import React from 'react';
import ManimExample from '../ManimExample';

async function animate(scene: any) {
  const {
    ThreeDAxes,
    Surface3D,
    Rectangle,
    TangleTex,
    makeTangle,
    BLACK,
    BLUE_D,
    BLUE_E,
    YELLOW,
    TEAL,
    ORANGE,
    PINK,
    GREEN,
  } = await import('manim-web');

  // The bivariate normal density in matrix form. Rest the mouse on the mean
  // vector or the covariance matrix to expand it; inside, every parameter shows
  // as its symbol and turns into its number while you drag it (or click it to
  // type a value). Drag empty space to orbit the camera.
  const formula = new TangleTex({
    latex: String.raw`f(\vec x) = \frac{1}{2\pi\sqrt{\det\tanglematrix{Sigma}}}\,e^{-\frac{1}{2}(\vec x-\tanglematrix{mu})^{\top}\tanglematrix{Sigma}^{-1}(\vec x-\tanglematrix{mu})}`,
    fontSize: 40,
    anchor: 'left',
    parameters: {
      mx: param(0, -2, 2, 0.1, '\\mu_x', YELLOW),
      my: param(0, -2, 2, 0.1, '\\mu_y', ORANGE),
      sx: param(1, 0.6, 2, 0.05, '\\sigma_x', TEAL),
      sy: param(1, 0.6, 2, 0.05, '\\sigma_y', GREEN),
      rho: param(0.5, -0.8, 0.8, 0.05, '\\rho', PINK),
    },
    matrices: {
      mu: {
        symbol: '\\vec\\mu',
        entries: [[String.raw`\tangle{mx}`], [String.raw`\tangle{my}`]],
        evaluate: ({ mx, my }) => [[mx], [my]],
      },
      Sigma: {
        symbol: '\\Sigma',
        entries: [
          [String.raw`\tangle{sx}^2`, String.raw`\tangle{rho}\tangle{sx}\tangle{sy}`],
          [String.raw`\tangle{rho}\tangle{sx}\tangle{sy}`, String.raw`\tangle{sy}^2`],
        ],
        evaluate: ({ sx, sy, rho }) => [
          [sx * sx, rho * sx * sy],
          [rho * sx * sy, sy * sy],
        ],
      },
    },
  });

  /** A parameter shown as its symbol until it is dragged or edited. */
  function param(
    value: number,
    min: number,
    max: number,
    step: number,
    symbol: string,
    color: string,
  ) {
    return { value, min, max, step, display: 'symbol' as const, symbol, color };
  }

  /** Height of the drawn surface per unit of density, so the peak is easy to see. */
  const Z_SCALE = 8;

  /** The surface z = Z_SCALE * f(x, y) for the formula's current parameters. */
  function surfaceFunc(): (u: number, v: number) => [number, number, number] {
    const { mx, my, sx, sy, rho } = formula.getValues();
    const norm = 1 / (2 * Math.PI * sx * sy * Math.sqrt(1 - rho * rho));
    return (x, y) => {
      const dx = (x - mx) / sx;
      const dy = (y - my) / sy;
      const q = (dx * dx - 2 * rho * dx * dy + dy * dy) / (1 - rho * rho);
      return [x, y, Z_SCALE * norm * Math.exp(-q / 2)];
    };
  }

  const surface = new Surface3D({
    func: surfaceFunc(),
    uRange: [-3.5, 3.5],
    vRange: [-3.5, 3.5],
    uResolution: 40,
    vResolution: 40,
    checkerboardColors: [BLUE_D, BLUE_E],
    opacity: 0.9,
  });
  const axes = new ThreeDAxes({
    xRange: [-3.5, 3.5, 1],
    yRange: [-3.5, 3.5, 1],
    zRange: [0, 6, 1],
    axisColor: '#ffffff',
    tipLength: 0.3,
    tipRadius: 0.12,
    shaftRadius: 0.008,
  });

  // A backdrop behind the formula, sized to it, so the surface never runs
  // through the symbols.
  const pad = 0.2;
  const backdrop = new Rectangle({ color: BLACK, fillOpacity: 0.8, strokeWidth: 0 });
  function fitBackdrop(): void {
    backdrop.setWidth(formula.getWidth() + 2 * pad).setHeight(formula.getHeight() + 2 * pad);
    backdrop.moveTo(formula.getCenter());
  }
  // While a matrix animates open or closed, follow the formula every frame.
  backdrop.addUpdater(fitBackdrop);

  // Pin the formula to the screen (top left), low enough that it stays in
  // view with both matrices open; anchor: 'left' keeps its left edge there as
  // matrices open and numbers show.
  const tallest = formula.copy().setExpanded('mu', true).setExpanded('Sigma', true);
  await Promise.all([formula.waitForRender(), tallest.waitForRender()]);
  formula.moveTo([-6.8 + pad, 3.8 - pad - tallest.getHeight() / 2, 0], [-1, 0, 0]);
  fitBackdrop();
  scene.add(axes, surface);
  scene.addFixedInFrameMobjects(backdrop, formula);
  // Fixed-in-frame mobjects all draw at renderOrder 0 (a 3D scene sorts them
  // by distance). Lift the formula above its backdrop; its re-rendered glyphs
  // take the formula's renderOrder, so it stays on top.
  formula.getThreeObject().traverse((node) => {
    node.renderOrder = 1;
  });

  makeTangle(formula, scene, {
    // Rebuild the surface for the new parameters; makeTangle then renders
    // once the formula's glyphs are in, after fitting the backdrop.
    onChange: () => surface.setFunc(surfaceFunc()),
    onBeforeRender: fitBackdrop,
  });
  scene.render();

  // Hold the scene open so the reader can interact. Without a wait the
  // ManimExample harness rebuilds the scene every loop and resets the values.
  await scene.wait(999999);
}

function createScene(container: HTMLElement, manim: any) {
  return new manim.ThreeDScene(container, {
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    phi: 62 * (Math.PI / 180),
    theta: -50 * (Math.PI / 180),
    distance: 22,
    fov: 30,
    orbitControlsUp: 'z',
  });
}

export default function BivariateNormalExample() {
  return <ManimExample animationFn={animate} createScene={createScene} />;
}
