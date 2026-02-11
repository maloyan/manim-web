# Interface: AudioTrack

Defined in: [core/AudioManager.ts:48](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L48)

Represents a single audio clip scheduled on the timeline.

## Properties

### buffer

> **buffer**: `AudioBuffer`

Defined in: [core/AudioManager.ts:54](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L54)

Decoded audio buffer (null until loaded).

***

### duration

> **duration**: `number`

Defined in: [core/AudioManager.ts:58](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L58)

How long the clip plays (seconds). Derived from buffer or explicit option.

***

### fadeIn

> **fadeIn**: `number`

Defined in: [core/AudioManager.ts:64](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L64)

Fade-in duration (seconds).

***

### fadeOut

> **fadeOut**: `number`

Defined in: [core/AudioManager.ts:66](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L66)

Fade-out duration (seconds).

***

### gain

> **gain**: `number`

Defined in: [core/AudioManager.ts:60](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L60)

Volume gain [0, 1].

***

### id

> **id**: `number`

Defined in: [core/AudioManager.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L50)

Unique identifier for this track.

***

### loop

> **loop**: `boolean`

Defined in: [core/AudioManager.ts:62](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L62)

Whether the clip loops.

***

### offset

> **offset**: `number`

Defined in: [core/AudioManager.ts:68](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L68)

Offset into the buffer (seconds).

***

### paused

> **paused**: `boolean`

Defined in: [core/AudioManager.ts:72](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L72)

Whether this track is paused.

***

### playing

> **playing**: `boolean`

Defined in: [core/AudioManager.ts:70](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L70)

Whether this track is currently playing.

***

### startTime

> **startTime**: `number`

Defined in: [core/AudioManager.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L56)

When the track starts on the timeline (seconds).

***

### url

> **url**: `string`

Defined in: [core/AudioManager.ts:52](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/AudioManager.ts#L52)

URL the audio was loaded from.
