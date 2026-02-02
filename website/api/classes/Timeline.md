# Class: Timeline

Defined in: [animation/Timeline.ts:24](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L24)

## Constructors

### Constructor

> **new Timeline**(): `Timeline`

#### Returns

`Timeline`

## Accessors

### length

#### Get Signature

> **get** **length**(): `number`

Defined in: [animation/Timeline.ts:257](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L257)

Get the number of animations in the timeline.

##### Returns

`number`

## Methods

### add()

> **add**(`animation`, `position`): `this`

Defined in: [animation/Timeline.ts:45](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L45)

Add an animation to the timeline.

#### Parameters

##### animation

[`Animation`](Animation.md)

The animation to add

##### position

[`PositionParam`](../type-aliases/PositionParam.md) = `'>'`

When to start the animation (default: '>' - after previous ends)

#### Returns

`this`

***

### addParallel()

> **addParallel**(`animations`, `position`): `this`

Defined in: [animation/Timeline.ts:66](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L66)

Add multiple animations to play in parallel (all start at the same time).

#### Parameters

##### animations

[`Animation`](Animation.md)[]

The animations to add

##### position

[`PositionParam`](../type-aliases/PositionParam.md) = `'>'`

When to start all animations (default: '>' - after previous ends)

#### Returns

`this`

***

### clear()

> **clear**(): `this`

Defined in: [animation/Timeline.ts:264](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L264)

Clear all animations from the timeline.

#### Returns

`this`

***

### getCurrentTime()

> **getCurrentTime**(): `number`

Defined in: [animation/Timeline.ts:250](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L250)

Get the current playback time.

#### Returns

`number`

***

### getDuration()

> **getDuration**(): `number`

Defined in: [animation/Timeline.ts:243](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L243)

Get the total duration of the timeline.

#### Returns

`number`

***

### isFinished()

> **isFinished**(): `boolean`

Defined in: [animation/Timeline.ts:229](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L229)

Check if the timeline has finished playing.

#### Returns

`boolean`

***

### isPlaying()

> **isPlaying**(): `boolean`

Defined in: [animation/Timeline.ts:236](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L236)

Check if the timeline is currently playing.

#### Returns

`boolean`

***

### pause()

> **pause**(): `this`

Defined in: [animation/Timeline.ts:206](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L206)

Pause the timeline.

#### Returns

`this`

***

### play()

> **play**(): `this`

Defined in: [animation/Timeline.ts:198](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L198)

Start playing the timeline.

#### Returns

`this`

***

### reset()

> **reset**(): `this`

Defined in: [animation/Timeline.ts:214](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L214)

Reset the timeline to the beginning.

#### Returns

`this`

***

### seek()

> **seek**(`time`): `this`

Defined in: [animation/Timeline.ts:132](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L132)

Seek to a specific time in the timeline.

#### Parameters

##### time

`number`

The time to seek to (in seconds)

#### Returns

`this`

***

### update()

> **update**(`dt`): `void`

Defined in: [animation/Timeline.ts:156](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L156)

Update the timeline by a time delta.

#### Parameters

##### dt

`number`

Time delta in seconds

#### Returns

`void`
