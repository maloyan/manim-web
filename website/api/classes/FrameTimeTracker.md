# Class: FrameTimeTracker

Defined in: [utils/Performance.ts:129](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L129)

Simple frame time tracker for measuring render performance.

## Constructors

### Constructor

> **new FrameTimeTracker**(`maxSamples`): `FrameTimeTracker`

Defined in: [utils/Performance.ts:138](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L138)

Create a new FrameTimeTracker.

#### Parameters

##### maxSamples

`number` = `60`

Maximum number of samples to keep (default: 60)

#### Returns

`FrameTimeTracker`

## Methods

### endFrame()

> **endFrame**(): `void`

Defined in: [utils/Performance.ts:152](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L152)

Mark the end of a frame and record the time.

#### Returns

`void`

***

### get95thPercentile()

> **get95thPercentile**(): `number`

Defined in: [utils/Performance.ts:192](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L192)

Get the 95th percentile frame time.
Useful for identifying stutter/jank.

#### Returns

`number`

95th percentile frame time in ms

***

### getAverageFrameTime()

> **getAverageFrameTime**(): `number`

Defined in: [utils/Performance.ts:164](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L164)

Get the average frame time in milliseconds.

#### Returns

`number`

Average frame time in ms

***

### getMaxFrameTime()

> **getMaxFrameTime**(): `number`

Defined in: [utils/Performance.ts:173](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L173)

Get the maximum frame time in milliseconds.

#### Returns

`number`

Max frame time in ms

***

### getMinFrameTime()

> **getMinFrameTime**(): `number`

Defined in: [utils/Performance.ts:182](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L182)

Get the minimum frame time in milliseconds.

#### Returns

`number`

Min frame time in ms

***

### getSummary()

> **getSummary**(): `object`

Defined in: [utils/Performance.ts:210](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L210)

Get a summary of frame time statistics.

#### Returns

`object`

Object with avg, min, max, and p95 frame times

##### avg

> **avg**: `number`

##### max

> **max**: `number`

##### min

> **min**: `number`

##### p95

> **p95**: `number`

***

### reset()

> **reset**(): `void`

Defined in: [utils/Performance.ts:202](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L202)

Reset all recorded frame times.

#### Returns

`void`

***

### startFrame()

> **startFrame**(): `void`

Defined in: [utils/Performance.ts:145](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/utils/Performance.ts#L145)

Mark the start of a frame.

#### Returns

`void`
