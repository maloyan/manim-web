# Function: moveAlongPath()

> **moveAlongPath**(`mobject`, `path`, `options?`): [`MoveAlongPath`](../classes/MoveAlongPath.md)

Defined in: [animation/movement/MoveAlongPath.ts:182](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/movement/MoveAlongPath.ts#L182)

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
