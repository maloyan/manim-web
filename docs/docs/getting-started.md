---
title: Getting Started
sidebar_label: Getting Started
sidebar_position: 2
---

# Getting Started

There are two ways to use manim-web:

1. **Zero-build** — one HTML file, no tools to install. Best to try the library.
2. **npm + bundler** — a project with TypeScript and autocomplete. Best to build
   something real.

Start with the zero-build path. Move to npm when you want types and editor help.

## Zero-build: just an HTML file

You do not need Node, npm, or a build step. You need one `.html` file and a
browser. Copy the file below, save it as `index.html`, and open it.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>manim-web demo</title>
  </head>
  <body>
    <div id="container"></div>
    <script type="module">
      import {
        Scene,
        Circle,
        Create,
        FadeOut,
      } from 'https://cdn.jsdelivr.net/npm/manim-web@latest/dist/manim-web.browser.js';

      const container = document.getElementById('container');
      const scene = new Scene(container, { width: 800, height: 450 });

      const circle = new Circle({ radius: 1.5 });
      await scene.play(new Create(circle));
      await scene.wait(1);
      await scene.play(new FadeOut(circle));
    </script>
  </body>
</html>
```

How it works:

- `<script type="module">` lets the browser use `import`. You need it.
- The URL `https://cdn.jsdelivr.net/npm/manim-web@latest/dist/manim-web.browser.js`
  loads the pre-built browser bundle from the jsDelivr CDN. The `@latest` tag
  always points to the newest release. Pin a version for stable work, for
  example `manim-web@0.12.0`.
- Import only the names you use. The example uses `Scene`, `Circle`, `Create`,
  and `FadeOut`.
- `scene.play(...)` returns a promise. Use `await` to run animations in order.

Open the file by double-clicking it. Most browsers run ES modules from a
`file://` page. If yours blocks the CDN import, serve the folder instead:

```bash
npx serve .
```

Then open the printed `http://localhost:...` address.

## npm + bundler

A **bundler** is a tool that reads your `import` statements, collects every file
your code depends on, and produces the JavaScript the browser runs. It also
gives you TypeScript types and editor autocomplete. [Vite](https://vite.dev/) is
a good default.

Create a project and add manim-web:

```bash
npm create vite@latest my-animation -- --template vanilla-ts
cd my-animation
npm install manim-web
```

Replace `src/main.ts` with a scene:

```typescript
import { Scene, Circle, Create, FadeOut, BLACK } from 'manim-web';

const container = document.getElementById('container');
const scene = new Scene(container, {
  width: 800,
  height: 450,
  backgroundColor: BLACK,
  backgroundOpacity: 1, // 0 = fully transparent, 1 = fully opaque
});

const circle = new Circle({ radius: 1.5 });
await scene.play(new Create(circle));
await scene.wait(1);
await scene.play(new FadeOut(circle));
```

Add a container element to `index.html`:

```html
<div id="container"></div>
```

Start the dev server:

```bash
npm run dev
```

Any modern bundler works the same way (Vite, webpack, esbuild). Install
`manim-web`, import from it, and point the bundler at your entry file.

## Framework integrations

manim-web ships components for React and Vue. Both build the scene in a
callback that runs once, after the scene mounts. Pass the drawing code there —
there is no `construct` or `setup` prop.

### React

The `ManimScene` component runs your code in the `onSceneReady` callback.

```tsx
import { ManimScene } from 'manim-web/react';
import { Circle, Create } from 'manim-web';

function App() {
  return (
    <ManimScene
      width={800}
      height={450}
      onSceneReady={async (scene) => {
        const circle = new Circle({ radius: 1.5 });
        await scene.play(new Create(circle));
      }}
    />
  );
}
```

`ManimScene` accepts `width`, `height`, `backgroundColor`, `backgroundOpacity`,
`onSceneReady`, `className`, `style`, and `children`.

### Vue

The `ManimScene` component emits a `ready` event with the scene instance.

```vue
<template>
  <ManimScene :width="800" :height="450" @ready="onReady" />
</template>

<script setup lang="ts">
import { ManimScene, Circle, Create, type Scene } from 'manim-web/vue';

const onReady = async (scene: Scene) => {
  const circle = new Circle({ radius: 1.5 });
  await scene.play(new Create(circle));
};
</script>
```

### Web component

For plain HTML with no framework, use the `<manim-scene>` custom element. It
loads a scene from a module that default-exports a factory
`(container) => Scene`.

```html
<manim-scene width="800" height="450" src="./my-scene.js"></manim-scene>
<script type="module">
  import { registerManimElement } from 'manim-web/element';
  registerManimElement();
</script>
```

## Try it in the Playground

The repository ships an in-browser editor. Edit a scene on the left, press
**Run**, and see it on the right. No setup is needed.

```bash
npm run dev
```

Then open `/examples/playground/` on the dev server address. Use it to test a
snippet or check an error before you add code to your project.

## What you can build

manim-web supports a wide range of mathematical animations:

- **Shapes and geometry** -- circles, squares, ellipses, lines, polygons, and boolean operations
- **Graphs and plots** -- axes, function graphs, area plots, and Riemann sums
- **Text and equations** -- rendered text, LaTeX math equations via KaTeX
- **Animations** -- Create, FadeIn, FadeOut, Transform, Write, MoveAlongPath, Rotating, and more
- **Updaters** -- attach dynamic behaviors to objects that update every frame
- **Value tracking** -- animate numeric values smoothly with ValueTracker

## Next steps

- Browse the [Examples](./examples.mdx) to see what is possible
- Explore the [API Reference](/api) in the sidebar for detailed documentation
