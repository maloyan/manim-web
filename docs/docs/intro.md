---
title: Introduction
sidebar_label: Introduction
slug: /
sidebar_position: 1
---

# manim-web

Mathematical animations for the web -- a TypeScript port of the Python [Manim](https://www.manim.community/) library that runs entirely in the browser using WebGL (Three.js).

## What is manim-web?

manim-web lets you create programmatic mathematical animations directly in the browser. It provides a scene-based API where you describe objects (shapes, text, graphs) and the animations that act on them (create, fade, transform, move).

Everything renders in real time using WebGL -- no server, no video encoding, no Python required.

## Features

- **Shapes and geometry** -- circles, rectangles, polygons, lines, arcs, arrows, and boolean operations on shapes
- **Graphs and plots** -- coordinate axes, function graphs, area plots, Riemann sums, and dashed lines
- **Text and math** -- rendered text with custom fonts, LaTeX math equations via KaTeX
- **Rich animation library** -- Create, FadeIn, FadeOut, Transform, Write, MoveAlongPath, Rotating, and many more
- **Updaters** -- attach dynamic behaviors to objects that update every frame
- **Value tracking** -- animate numeric values smoothly with ValueTracker
- **Framework integrations** -- first-class React and Vue components

## Quick example

```typescript
import { Scene, Circle, Create, FadeOut, BLACK } from 'manim-web';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

const circle = new Circle({ radius: 1.5 });
await scene.play(new Create(circle));
await scene.wait(1);
await scene.play(new FadeOut(circle));
```

## Next steps

- [Getting Started](./getting-started.md) -- install the library and build your first scene
- [Examples](./examples.mdx) -- browse working examples with source code
- [API Reference](/api) -- full TypeDoc-generated reference
