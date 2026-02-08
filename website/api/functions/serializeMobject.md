# Function: serializeMobject()

> **serializeMobject**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:95](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L95)

Capture a JSON-serializable snapshot of a mobject and its hierarchy.
Non-destructive: does not modify the mobject in any way.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to serialize

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

A deep, JSON-safe MobjectState
