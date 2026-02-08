# Interface: MobjectState

Defined in: [core/StateManager.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L24)

JSON-serializable snapshot of a single mobject's visual state.
Captures position, rotation, scale, style, and VMobject-specific data.

## Properties

### children

> **children**: `MobjectState`[]

Defined in: [core/StateManager.ts:64](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L64)

Recursively captured child states

***

### color

> **color**: `string`

Defined in: [core/StateManager.ts:38](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L38)

CSS color string

***

### custom?

> `optional` **custom**: `Record`\<`string`, `unknown`\>

Defined in: [core/StateManager.ts:67](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L67)

Optional user-supplied custom data

***

### fillOpacity

> **fillOpacity**: `number`

Defined in: [core/StateManager.ts:47](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L47)

Fill opacity 0-1

***

### id

> **id**: `string`

Defined in: [core/StateManager.ts:26](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L26)

Mobject id at time of capture (used for lookup during restore)

***

### opacity

> **opacity**: `number`

Defined in: [core/StateManager.ts:41](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L41)

Overall stroke opacity 0-1

***

### points2D?

> `optional` **points2D**: [`Point`](Point.md)[]

Defined in: [core/StateManager.ts:55](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L55)

2D points [{x,y}, ...]

***

### points3D?

> `optional` **points3D**: `number`[][]

Defined in: [core/StateManager.ts:58](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L58)

3D Bezier control points [[x,y,z], ...]

***

### position

> **position**: \[`number`, `number`, `number`\]

Defined in: [core/StateManager.ts:29](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L29)

Position [x, y, z]

***

### rotation

> **rotation**: \[`number`, `number`, `number`, `string`\]

Defined in: [core/StateManager.ts:32](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L32)

Euler rotation [x, y, z, order]

***

### scale

> **scale**: \[`number`, `number`, `number`\]

Defined in: [core/StateManager.ts:35](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L35)

Scale [x, y, z]

***

### strokeWidth

> **strokeWidth**: `number`

Defined in: [core/StateManager.ts:44](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L44)

Stroke width

***

### style

> **style**: [`MobjectStyle`](MobjectStyle.md)

Defined in: [core/StateManager.ts:50](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L50)

Full style object

***

### visiblePointCount?

> `optional` **visiblePointCount**: `number`

Defined in: [core/StateManager.ts:61](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L61)

Visible point count (null means all)
