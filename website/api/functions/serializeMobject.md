# Function: serializeMobject()

> **serializeMobject**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/StateManager.ts#L95)

Capture a JSON-serializable snapshot of a mobject and its hierarchy.
Non-destructive: does not modify the mobject in any way.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to serialize

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

A deep, JSON-safe MobjectState
