---
title: Getting Started
sidebar_label: Getting Started
sidebar_position: 2
---

# Getting Started

## Installation

```bash
npm install manim-js
```

## Basic Usage

Create a minimal scene with a shape animation:

```typescript
import { Scene, Circle, Create, FadeOut, BLACK } from 'manim-js';

// Set up the scene
const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
});

// Create and animate a circle
const circle = new Circle({ radius: 1.5 });
await scene.play(new Create(circle));
await scene.wait(1);
await scene.play(new FadeOut(circle));
```

You will need an HTML page with a container element:

```html
<div id="container"></div>
<script type="module" src="./your-scene.ts"></script>
```

## Using with a bundler

manim-js works with any modern bundler (Vite, webpack, esbuild, etc.). With Vite:

```bash
npm create vite@latest my-animation -- --template vanilla-ts
cd my-animation
npm install manim-js
```

Then import and use `manim-js` in your TypeScript files.

## Framework integrations

### React

```tsx
import { ManimScene } from 'manim-js/react';
import { Circle, Create } from 'manim-js';

function App() {
  return (
    <ManimScene
      width={800}
      height={450}
      setup={async (scene) => {
        const circle = new Circle({ radius: 1.5 });
        await scene.play(new Create(circle));
      }}
    />
  );
}
```

### Vue

```vue
<template>
  <ManimScene :width="800" :height="450" :setup="setup" />
</template>

<script setup lang="ts">
import { ManimScene } from 'manim-js/vue';
import { Circle, Create } from 'manim-js';

const setup = async (scene) => {
  const circle = new Circle({ radius: 1.5 });
  await scene.play(new Create(circle));
};
</script>
```

## What you can build

manim-js supports a wide range of mathematical animations:

- **Shapes and geometry** -- circles, squares, ellipses, lines, polygons, and boolean operations
- **Graphs and plots** -- axes, function graphs, area plots, and Riemann sums
- **Text and equations** -- rendered text, LaTeX math equations via KaTeX
- **Animations** -- Create, FadeIn, FadeOut, Transform, Write, MoveAlongPath, Rotating, and more
- **Updaters** -- attach dynamic behaviors to objects that update every frame
- **Value tracking** -- animate numeric values smoothly with ValueTracker

## Next steps

- Browse the [Examples](./examples/index.md) to see what is possible
- Explore the [API Reference](./api/) in the sidebar for detailed documentation
