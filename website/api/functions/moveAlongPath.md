# Function: moveAlongPath()

> **moveAlongPath**(`mobject`, `path`, `options?`): [`MoveAlongPath`](../classes/MoveAlongPath.md)

Defined in: [animation/movement/MoveAlongPath.ts:202](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/movement/MoveAlongPath.ts#L202)

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
