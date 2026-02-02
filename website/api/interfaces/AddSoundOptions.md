# Interface: AddSoundOptions

Defined in: [core/AudioManager.ts:28](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L28)

Options when adding a sound to the audio manager.

## Properties

### duration?

> `optional` **duration**: `number`

Defined in: [core/AudioManager.ts:42](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L42)

Duration to play (seconds). Defaults to the full buffer length.

***

### fadeIn?

> `optional` **fadeIn**: `number`

Defined in: [core/AudioManager.ts:36](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L36)

Fade-in duration in seconds. Defaults to 0.

***

### fadeOut?

> `optional` **fadeOut**: `number`

Defined in: [core/AudioManager.ts:38](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L38)

Fade-out duration in seconds. Defaults to 0.

***

### gain?

> `optional` **gain**: `number`

Defined in: [core/AudioManager.ts:32](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L32)

Volume gain (0 = silent, 1 = full). Defaults to 1.

***

### loop?

> `optional` **loop**: `boolean`

Defined in: [core/AudioManager.ts:34](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L34)

Whether to loop the clip. Defaults to false.

***

### offset?

> `optional` **offset**: `number`

Defined in: [core/AudioManager.ts:40](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L40)

Offset into the audio buffer to start playback from (seconds). Defaults to 0.

***

### time?

> `optional` **time**: `number`

Defined in: [core/AudioManager.ts:30](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/AudioManager.ts#L30)

Absolute time (in seconds) when the sound should start playing. Defaults to 0.
