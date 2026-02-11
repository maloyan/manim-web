# Interface: AnimationGroupOptions

Defined in: [animation/AnimationGroup.ts:10](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/AnimationGroup.ts#L10)

## Extended by

- [`LaggedStartOptions`](LaggedStartOptions.md)

## Properties

### lagRatio?

> `optional` **lagRatio**: `number`

Defined in: [animation/AnimationGroup.ts:15](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/animation/AnimationGroup.ts#L15)

Lag ratio: 0 = all parallel (default), 1 = sequential.
Values between 0 and 1 create overlapping animations.

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
