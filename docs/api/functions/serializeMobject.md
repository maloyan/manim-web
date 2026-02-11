# Function: serializeMobject()

> **serializeMobject**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:95](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/StateManager.ts#L95)

Capture a JSON-serializable snapshot of a mobject and its hierarchy.
Non-destructive: does not modify the mobject in any way.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to serialize

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

A deep, JSON-safe MobjectState
