# Function: deserializeMobject()

> **deserializeMobject**(`mob`, `state`): `void`

Defined in: [core/StateManager.ts:133](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/StateManager.ts#L133)

Restore a mobject's properties from a previously captured state.
Applies position, rotation, scale, style, and VMobject points.
Does NOT add/remove children -- it restores properties of existing children
matched by array index (same order as when serialized).

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to restore

### state

[`MobjectState`](../interfaces/MobjectState.md)

The state to apply

## Returns

`void`
