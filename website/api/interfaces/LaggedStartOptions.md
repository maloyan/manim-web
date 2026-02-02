# Interface: LaggedStartOptions

Defined in: [animation/LaggedStart.ts:8](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/LaggedStart.ts#L8)

## Extends

- [`AnimationGroupOptions`](AnimationGroupOptions.md)

## Properties

### lagRatio?

> `optional` **lagRatio**: `number`

Defined in: [animation/LaggedStart.ts:14](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/LaggedStart.ts#L14)

Lag ratio between animation starts.
Default is 0.2 (20% overlap between consecutive animations).
0 = all parallel, 1 = sequential (no overlap).

#### Overrides

[`AnimationGroupOptions`](AnimationGroupOptions.md).[`lagRatio`](AnimationGroupOptions.md#lagratio)

***

### rateFunc()?

> `optional` **rateFunc**: (`t`) => `number`

Defined in: [animation/AnimationGroup.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/AnimationGroup.ts#L17)

Rate function applied to the group's overall progress

#### Parameters

##### t

`number`

#### Returns

`number`

#### Inherited from

[`AnimationGroupOptions`](AnimationGroupOptions.md).[`rateFunc`](AnimationGroupOptions.md#ratefunc)
