# Function: moveAlongPath()

> **moveAlongPath**(`mobject`, `path`, `options?`): [`MoveAlongPath`](../classes/MoveAlongPath.md)

Defined in: [animation/movement/MoveAlongPath.ts:202](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/animation/movement/MoveAlongPath.ts#L202)

Create a MoveAlongPath animation for a mobject.

## Parameters

### mobject

[`Mobject`](../classes/Mobject.md)

The mobject to move along the path

### path

[`VMobject`](../classes/VMobject.md)

The VMobject path to follow

### options?

`Omit`\<[`MoveAlongPathOptions`](../interfaces/MoveAlongPathOptions.md), `"path"`\>

Animation options (duration, rateFunc, rotateAlongPath)

## Returns

[`MoveAlongPath`](../classes/MoveAlongPath.md)
