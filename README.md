<div align="center">

# manim-web

**Mathematical animations for the web.**

The power of [3Blue1Brown's Manim](https://github.com/3b1b/manim) — in the browser, no Python required.

<img src="assets/demo_square_to_circle.gif" width="600" alt="Square to Circle demo">

[![npm version](https://img.shields.io/npm/v/manim-web.svg)](https://www.npmjs.com/package/manim-web)
[![CI](https://github.com/maloyan/manim-js/actions/workflows/ci.yml/badge.svg)](https://github.com/maloyan/manim-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Quick Start](#quick-start) · [Examples](https://maloyan.github.io/manim-web/) · [Docs](https://maloyan.github.io/manim-web/) · [npm](https://www.npmjs.com/package/manim-web)

</div>

---

## Quick Start

```bash
npm install manim-web
```

```typescript
import { Scene, Circle, Square, Create, Transform, FadeOut } from 'manim-web';

async function squareToCircle(scene: Scene) {
  const square = new Square({ sideLength: 3 });
  const circle = new Circle({ radius: 1.5 });

  await scene.play(new Create(square));
  await scene.play(new Transform(square, circle));
  await scene.play(new FadeOut(square));
}
```

Or use a plain `<script>` tag — see the [examples](https://maloyan.github.io/manim-web/) for more.

## What You Can Build

<table>
<tr>
<td align="center"><img src="assets/demo_function_graph.gif" width="350" alt="Function Graphs"><br><b>Function Graphs</b></td>
<td align="center"><img src="assets/demo_math_equations.gif" width="350" alt="LaTeX Equations"><br><b>LaTeX Equations</b></td>
</tr>
<tr>
<td align="center"><img src="assets/demo_text.gif" width="350" alt="Text Animations"><br><b>Text Animations</b></td>
<td align="center"><img src="assets/demo_square_to_circle.gif" width="350" alt="Geometry Transforms"><br><b>Geometry Transforms</b></td>
</tr>
</table>

## Features

- **Geometry** — Circle, Rectangle, Polygon, Arrow, Arc, Star, Brace, and more
- **Text & LaTeX** — Text, MathTex, Tex, Paragraph via KaTeX
- **Graphing** — Axes, NumberPlane, FunctionGraph, ParametricFunction, VectorField, BarChart
- **3D** — Sphere, Cube, Cylinder, Torus, Surface3D, ThreeDAxes with orbit controls
- **Animations** — FadeIn/Out, Create, Transform, Write, GrowFromCenter, AnimationGroup, LaggedStart
- **Interaction** — Draggable, Hoverable, Clickable mobjects
- **Export** — GIF and video export
- **Graphs & Tables** — Network graphs, Matrix, Table

## Framework Integrations

### React

```tsx
import { ManimScene } from 'manim-web/react';

function App() {
  return <ManimScene construct={squareToCircle} width={800} height={450} />;
}
```

### Vue

```vue
<script setup>
import { ManimScene } from 'manim-web/vue';
</script>

<template>
  <ManimScene :construct="squareToCircle" :width="800" :height="450" />
</template>
```

## Python to TypeScript

Have existing Manim scripts? Convert them:

```bash
node tools/py2ts.cjs input.py -o output.ts
```

## Contributing

```bash
git clone https://github.com/maloyan/manim-js.git
cd manim-web
npm install
npm run dev
```

## License

MIT
