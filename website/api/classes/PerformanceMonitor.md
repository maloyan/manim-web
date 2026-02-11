# Class: PerformanceMonitor

Defined in: [utils/Performance.ts:10](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L10)

Performance monitor for tracking frame rate and other metrics.
Useful for debugging and optimizing animations.

## Constructors

### Constructor

> **new PerformanceMonitor**(): `PerformanceMonitor`

#### Returns

`PerformanceMonitor`

## Methods

### getFps()

> **getFps**(): `number`

Defined in: [utils/Performance.ts:85](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L85)

Get the current FPS (rolling average).

#### Returns

`number`

Current frames per second

***

### getInstantFps()

> **getInstantFps**(): `number`

Defined in: [utils/Performance.ts:93](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L93)

Get the instant FPS (last measured value before averaging).

#### Returns

`number`

Instant frames per second

***

### isRunning()

> **isRunning**(): `boolean`

Defined in: [utils/Performance.ts:103](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L103)

Check if the monitor is currently running.

#### Returns

`boolean`

true if monitoring is active

***

### reset()

> **reset**(): `void`

Defined in: [utils/Performance.ts:110](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L110)

Reset the monitor statistics.

#### Returns

`void`

***

### start()

> **start**(`callback?`): `void`

Defined in: [utils/Performance.ts:26](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L26)

Start monitoring performance.

#### Parameters

##### callback?

(`fps`) => `void`

Optional callback called each second with current FPS

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [utils/Performance.ts:40](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/utils/Performance.ts#L40)

Stop monitoring performance.

#### Returns

`void`
