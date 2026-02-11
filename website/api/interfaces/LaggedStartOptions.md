# Interface: LaggedStartOptions

Defined in: [animation/LaggedStart.ts:8](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/LaggedStart.ts#L8)

## Extends

- [`AnimationGroupOptions`](AnimationGroupOptions.md)

## Properties

### lagRatio?

> `optional` **lagRatio**: `number`

Defined in: [animation/LaggedStart.ts:14](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/LaggedStart.ts#L14)

Lag ratio between animation starts.
Default is 0.2 (20% overlap between consecutive animations).
0 = all parallel, 1 = sequential (no overlap).

#### Overrides

[`AnimationGroupOptions`](AnimationGroupOptions.md).[`lagRatio`](AnimationGroupOptions.md#lagratio)

***

### rateFunc()?

> `optional` **rateFunc**: (`t`) => `number`

Defined in: [animation/AnimationGroup.ts:17](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/AnimationGroup.ts#L17)

Rate function applied to the group's overall progress

#### Parameters

##### t

`number`

#### Returns

`number`

#### Inherited from

[`AnimationGroupOptions`](AnimationGroupOptions.md).[`rateFunc`](AnimationGroupOptions.md#ratefunc)
