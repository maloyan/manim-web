# Debug Tests

This directory contains HTML debug tests to understand how manim-web fails.

## Creating a Debug Test

Each example is a standalone HTML file with an unstyled Play and Reset button:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debug Test</title>
</head>
<body>
  <div id="container"></div>
  <button id="playBtn">Play</button>
  <button id="resetBtn">Reset</button>

  <script type="module">
    import { Scene, Circle, Create } from '../src/index.ts';

    const container = document.getElementById('container');
    const scene = new Scene(container, {
      width: 800,
      height: 450,
      backgroundColor: '#1a1a2e'
    });

    document.getElementById('playBtn').addEventListener('click', async () => {
      scene.clear();
      const c = new Circle({ radius: 1, color: '#e94560' });
      scene.add(c);
      await scene.play(new Create(c));
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      scene.clear();
    });
  </script>
</body>
</html>
```

### MathTexImage with manual scaleVector

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MathTexImage Debug</title>
</head>
<body>
  <div id="container"></div>
  <button id="playBtn">Play</button>
  <button id="resetBtn">Reset</button>

  <script type="module">
    import { Scene, MathTexImage, Create } from '../src/index.ts';

    const container = document.getElementById('container');
    const scene = new Scene(container, {
      width: 800,
      height: 450,
      backgroundColor: '#1a1a2e'
    });

    document.getElementById('playBtn').addEventListener('click', async () => {
      scene.clear();
      const tex = new MathTexImage({ latex: 'E = mc^2' });
      tex.scaleVector.set(2, 2, 2);
      scene.add(tex);
      await scene.play(new Create(tex));
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      scene.clear();
    });
  </script>
</body>
</html>
```

## Running a Debug Test

From the `manim-web` root, start Vite:

```bash
cd manim-web && npx vite
```

Then open a specific example:

```bash
xdg-open http://localhost:5173/debug/math-tex-image-debug.html
```