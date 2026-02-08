# Interface: SceneSnapshot

Defined in: [core/StateManager.ts:73](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L73)

A full scene snapshot: an ordered array of top-level mobject states.

## Properties

### label?

> `optional` **label**: `string`

Defined in: [core/StateManager.ts:75](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L75)

Human-readable label (optional)

***

### mobjects

> **mobjects**: [`MobjectState`](MobjectState.md)[]

Defined in: [core/StateManager.ts:81](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L81)

Ordered array of top-level mobject states (one per scene mobject)

***

### timestamp

> **timestamp**: `number`

Defined in: [core/StateManager.ts:78](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L78)

Timestamp (ms) when snapshot was taken
