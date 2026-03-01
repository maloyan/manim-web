---
title: Python to TypeScript Converter
sidebar_label: py2ts Converter
sidebar_position: 3
---

# Python to TypeScript Converter

## Overview

The converter at `tools/py2ts.cjs` translates Python Manim scripts into manim-web TypeScript. It is regex-based and handles approximately 170 mobject classes, 45+ animations, 80+ method mappings, and 100+ kwarg conversions. Automated conversion is approximate -- always review the output and adjust as needed.

## Usage

Convert a file directly:

```bash
node tools/py2ts.cjs input.py -o output.ts
```

Or pipe from stdin:

```bash
cat script.py | node tools/py2ts.cjs
```

Run the built-in test suite to verify the converter works correctly:

```bash
node tools/py2ts.cjs --test
```

## What Converts Cleanly

The converter handles many common patterns well:

- **Scene classes** become async functions
- **Mobject creation** with kwargs converts to object literals
- **`self.play()` / `self.wait()`** become `await scene.play()` / `await scene.wait()`
- **Method calls** convert from snake_case to camelCase
- **Colors and directions** (`BLUE`, `UP`, `RIGHT`, etc.) map directly
- **Lambda functions** convert to arrow functions
- **List comprehensions** convert to `.map()` / `.filter()` calls
- **f-strings** convert to template literals
- **Vector arithmetic** like `2 * UP + LEFT` becomes `addVec(scaleVec(2, UP), LEFT)`
- **NumPy basics** like `np.sin`, `np.linspace`, `np.pi` convert to their JS equivalents

### Complete Example

**Python input:**

```python
class SquareToCircle(Scene):
    def construct(self):
        square = Square(color=BLUE)
        circle = Circle(fill_opacity=0.8, fill_color=PINK)
        self.play(Create(square))
        self.play(Transform(square, circle))
        self.wait()
```

**TypeScript output:**

```typescript
import { Scene, Square, Circle, Create, Transform, BLUE, PINK } from 'manim-web';

export async function squareToCircle(scene: Scene) {
  const square = new Square({ color: BLUE });
  const circle = new Circle({ fillOpacity: 0.8, fillColor: PINK });
  await scene.play(new Create(square));
  await scene.play(new Transform(square, circle));
  await scene.wait();
}
```

## Supported Constructs

### Mobjects

| Category | Classes |
|----------|---------|
| **Geometry** | Circle, Square, Rectangle, Line, Arrow, DashedLine, Polygon, RegularPolygon, Triangle, Ellipse, Arc, ArcBetweenPoints, Dot, Annulus, Sector, Star, RoundedRectangle |
| **Text** | Text, MathTex, Tex, Paragraph, MarkupText, DecimalNumber, Integer, Title, BulletedList, Code |
| **Graphing** | Axes, NumberPlane, FunctionGraph, ParametricFunction, NumberLine, BarChart, CoordinateSystem |
| **3D** | Sphere, Cube, Cylinder, Cone, Torus, ThreeDAxes, Surface, Line3D, Arrow3D, Dot3D, Prism |
| **Tables** | Matrix, IntegerMatrix, DecimalMatrix, MobjectMatrix, Table, MathTable |

### Animations

| Category | Animations |
|----------|------------|
| **Creation** | Create, Write, DrawBorderThenFill, ShowCreation, Uncreate, Unwrite |
| **Fading** | FadeIn, FadeOut, FadeInFromPoint, FadeOutToPoint |
| **Transforms** | Transform, ReplacementTransform, TransformFromCopy, MoveToTarget, ApplyMethod |
| **Movement** | Shift, Rotate, GrowFromCenter, GrowFromEdge, GrowFromPoint, GrowArrow, SpinInFromNothing |
| **Indication** | Indicate, Flash, Circumscribe, ShowPassingFlash, Wiggle, FocusOn, ApplyWave |
| **Composition** | AnimationGroup, LaggedStart, LaggedStartMap, Succession |

### Python Features

- **Booleans**: `True` / `False` become `true` / `false`
- **None**: becomes `null`
- **Comments**: `#` comments become `//` comments
- **Lambda functions**: `lambda x: x**2` becomes `(x) => Math.pow(x, 2)`
- **List comprehensions**: `[x**2 for x in range(5)]` becomes `Array.from({length: 5}, (_, x) => Math.pow(x, 2))`
- **f-strings**: `f"Value: {x}"` becomes `` `Value: ${x}` ``
- **Slicing**: `arr[1:3]` becomes `arr.slice(1, 3)`
- **range()**: `range(5)` becomes appropriate JS equivalent
- **Power operator**: `x**2` becomes `Math.pow(x, 2)`

## Known Limitations

### Custom VMobject subclasses are NOT supported

The converter uses a fixed lookup table of approximately 170 known classes. Any class you define yourself will **not** be recognized or converted. You must manually port custom VMobject subclasses to TypeScript.

### Other limitations

- **Class inheritance beyond Scene**: Only `class MyScene(Scene)` is recognized. Custom base classes, multiple inheritance, or `VMobject` subclasses will not convert.
- **Dynamic Python features**: `getattr()`, `setattr()`, decorators (`@property`), metaclasses -- none are converted.
- **Complex `.animate` chains**: Only the first method in a chain is converted. For example, `obj.animate.shift(UP).rotate(PI).scale(2)` needs manual fixing.
- **Advanced NumPy**: Only simple operations (`np.sin`, `np.linspace`, `np.pi`, `np.arange` with literals) are handled. Matrix operations, `np.dot`, `np.cross`, and complex array shapes are not supported.
- **Scene variants**: `MovingCameraScene`, `ThreeDScene`, and `ZoomedScene` are all converted to plain `Scene` -- specialized behavior must be set up manually.
- **Imports**: Only `from manim import *` is recognized. Custom imports are stripped.
- **Control flow edge cases**: Complex `for` loop unpacking, deeply nested `if`/`for`, and `try`/`except` blocks may not convert correctly.
- **MathTex part indexing**: `eq[0]` requires `await eq.waitForRender()` before use in TypeScript, which the converter does not add automatically.
- **Triple-quoted strings**: Treated as regular strings.
- **Complex method chaining**: Beyond `.animate`, deep chains with nested parentheses may fail to convert.

## Manual Porting Guide

When the converter cannot handle something automatically, here is how to approach common cases:

### Custom VMobject subclasses

Create a TypeScript class extending `VMobject` and port the construct logic:

```typescript
import { VMobject } from 'manim-web';

class MyShape extends VMobject {
  constructor(options = {}) {
    super(options);
    // Port your construct() logic here
  }
}
```

### Scene variants

For camera control (e.g., replacing `MovingCameraScene`), use camera methods directly:

```typescript
scene.camera.setPosition([2, 1, 0]);
scene.camera.setZoom(1.5);
```

### Complex animate chains

Break chained `.animate` calls into individual calls or use `generateTarget()`:

```python
# Python (won't convert correctly)
self.play(obj.animate.shift(UP).rotate(PI).scale(2))
```

```typescript
// TypeScript -- break into separate animations
obj.generateTarget();
obj.target.shift(UP);
obj.target.rotate(PI);
obj.target.scale(2);
await scene.play(new MoveToTarget(obj));
```

### MathTex indexing

Add `await tex.waitForRender()` before accessing parts by index:

```typescript
const eq = new MathTex({ tex: 'a^2 + b^2 = c^2' });
scene.add(eq);
await eq.waitForRender();
// Now you can safely access eq[0], eq[1], etc.
```

## Next steps

- Try converting a Python script and review the output
- Browse the [Examples](./examples.mdx) to see manim-web patterns
- Explore the [API Reference](/api) for detailed class documentation
