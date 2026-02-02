# Interface: BezierSegment

Defined in: [rendering/BezierRenderer.ts:46](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L46)

Per-segment data extracted from a VMobject or provided directly.

## Properties

### color

> **color**: \[`number`, `number`, `number`, `number`\]

Defined in: [rendering/BezierRenderer.ts:60](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L60)

RGBA color [r, g, b, a] where each channel is 0..1

***

### p0

> **p0**: `number`[]

Defined in: [rendering/BezierRenderer.ts:48](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L48)

Control point 0 (start anchor)

***

### p1

> **p1**: `number`[]

Defined in: [rendering/BezierRenderer.ts:50](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L50)

Control point 1

***

### p2

> **p2**: `number`[]

Defined in: [rendering/BezierRenderer.ts:52](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L52)

Control point 2

***

### p3

> **p3**: `number`[]

Defined in: [rendering/BezierRenderer.ts:54](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L54)

Control point 3 (end anchor)

***

### widthEnd

> **widthEnd**: `number`

Defined in: [rendering/BezierRenderer.ts:58](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L58)

Stroke width at end of segment

***

### widthStart

> **widthStart**: `number`

Defined in: [rendering/BezierRenderer.ts:56](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/rendering/BezierRenderer.ts#L56)

Stroke width at start of segment
