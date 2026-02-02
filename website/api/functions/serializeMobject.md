# Function: serializeMobject()

> **serializeMobject**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:95](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/StateManager.ts#L95)

Capture a JSON-serializable snapshot of a mobject and its hierarchy.
Non-destructive: does not modify the mobject in any way.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to serialize

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

A deep, JSON-safe MobjectState
