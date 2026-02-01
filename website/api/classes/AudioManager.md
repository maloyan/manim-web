# Class: AudioManager

Defined in: [core/AudioManager.ts:91](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L91)

Manages audio playback synchronized with the manim-js Scene timeline.

Usage:
```ts
const audio = new AudioManager();
await audio.addSound('/sounds/click.wav', { time: 0.5 });
audio.play();             // start playback
audio.seek(2.0);          // jump to 2 s
const wav = await audio.exportWAV();
```

## Constructors

### Constructor

> **new AudioManager**(): `AudioManager`

#### Returns

`AudioManager`

## Accessors

### context

#### Get Signature

> **get** **context**(): `AudioContext`

Defined in: [core/AudioManager.ts:136](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L136)

Get the underlying AudioContext (creates one if needed).

##### Returns

`AudioContext`

***

### isPlaying

#### Get Signature

> **get** **isPlaying**(): `boolean`

Defined in: [core/AudioManager.ts:358](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L358)

Whether audio is currently playing.

##### Returns

`boolean`

***

### tracks

#### Get Signature

> **get** **tracks**(): readonly [`AudioTrack`](../interfaces/AudioTrack.md)[]

Defined in: [core/AudioManager.ts:351](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L351)

Get a readonly copy of the current track list.

##### Returns

readonly [`AudioTrack`](../interfaces/AudioTrack.md)[]

## Methods

### addSound()

> **addSound**(`url`, `options`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/AudioManager.ts:175](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L175)

Add a sound to the timeline.

#### Parameters

##### url

`string`

URL of the audio file

##### options

[`AddSoundOptions`](../interfaces/AddSoundOptions.md) = `{}`

Scheduling and playback options

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

The created AudioTrack (buffer may still be loading)

***

### addSoundAtAnimation()

> **addSoundAtAnimation**(`animation`, `url`, `options`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/AudioManager.ts:208](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L208)

Add a sound that starts when a given animation begins on the timeline.

The animation must already be scheduled (i.e. have a non-null `startTime`).
If the animation has not been scheduled yet, `time` falls back to 0.

#### Parameters

##### animation

[`Animation`](Animation.md)

Animation whose start time to sync with

##### url

`string`

URL of the audio file

##### options

`Omit`\<[`AddSoundOptions`](../interfaces/AddSoundOptions.md), `"time"`\> & `object` = `{}`

Additional options (time is overridden by animation)

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

The created AudioTrack

***

### clearTracks()

> **clearTracks**(): `void`

Defined in: [core/AudioManager.ts:341](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L341)

Remove all tracks and stop playback.

#### Returns

`void`

***

### createStreamDestination()

> **createStreamDestination**(): `MediaStreamAudioDestinationNode`

Defined in: [core/AudioManager.ts:450](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L450)

Get an AudioNode destination suitable for muxing with a MediaRecorder.
This creates a MediaStreamAudioDestinationNode that can be combined with
a video stream for video+audio export.

#### Returns

`MediaStreamAudioDestinationNode`

MediaStreamAudioDestinationNode connected to the master gain

***

### dispose()

> **dispose**(): `void`

Defined in: [core/AudioManager.ts:522](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L522)

Release all audio resources.

#### Returns

`void`

***

### exportWAV()

> **exportWAV**(`duration?`, `sampleRate?`): `Promise`\<`Blob`\>

Defined in: [core/AudioManager.ts:438](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L438)

Export all audio tracks as a WAV Blob.

#### Parameters

##### duration?

`number`

Total duration (seconds). Defaults to getDuration().

##### sampleRate?

`number` = `44100`

Sample rate. Defaults to 44100.

#### Returns

`Promise`\<`Blob`\>

WAV Blob

***

### getCurrentTime()

> **getCurrentTime**(): `number`

Defined in: [core/AudioManager.ts:279](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L279)

Get the current playback position on the timeline (seconds).

#### Returns

`number`

***

### getDuration()

> **getDuration**(): `number`

Defined in: [core/AudioManager.ts:365](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L365)

Get the total duration of the audio timeline (end of the latest track).

#### Returns

`number`

***

### loadBuffer()

> **loadBuffer**(`url`): `Promise`\<`AudioBuffer`\>

Defined in: [core/AudioManager.ts:149](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L149)

Load and decode an audio file, with caching.

#### Parameters

##### url

`string`

URL of the audio resource

#### Returns

`Promise`\<`AudioBuffer`\>

Decoded AudioBuffer

***

### mixdown()

> **mixdown**(`duration?`, `sampleRate?`): `Promise`\<`AudioBuffer`\>

Defined in: [core/AudioManager.ts:385](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L385)

Render all audio tracks into a single stereo AudioBuffer (offline).

#### Parameters

##### duration?

`number`

Total duration to render (seconds). Defaults to getDuration().

##### sampleRate?

`number` = `44100`

Output sample rate. Defaults to 44100.

#### Returns

`Promise`\<`AudioBuffer`\>

Mixed-down AudioBuffer

***

### pause()

> **pause**(): `void`

Defined in: [core/AudioManager.ts:239](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L239)

Pause audio playback, remembering the current position.

#### Returns

`void`

***

### play()

> **play**(): `void`

Defined in: [core/AudioManager.ts:225](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L225)

Start (or resume) audio playback from the current position.

#### Returns

`void`

***

### removeTrack()

> **removeTrack**(`trackId`): `void`

Defined in: [core/AudioManager.ts:327](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L327)

Remove a track by id.

#### Parameters

##### trackId

`number`

#### Returns

`void`

***

### seek()

> **seek**(`time`): `void`

Defined in: [core/AudioManager.ts:254](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L254)

Seek to an absolute time on the timeline (seconds).
If currently playing, audio restarts from the new position.

#### Parameters

##### time

`number`

#### Returns

`void`

***

### setGlobalGain()

> **setGlobalGain**(`value`): `void`

Defined in: [core/AudioManager.ts:292](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L292)

Set the master output volume.

#### Parameters

##### value

`number`

Gain value (0 = silent, 1 = unity)

#### Returns

`void`

***

### setTrackGain()

> **setTrackGain**(`trackId`, `value`): `void`

Defined in: [core/AudioManager.ts:307](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L307)

Set the gain for a specific track.

#### Parameters

##### trackId

`number`

Track identifier

##### value

`number`

Gain value (0 = silent, 1 = unity)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [core/AudioManager.ts:270](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L270)

Stop playback and reset to the beginning.

#### Returns

`void`

***

### audioBufferToWAV()

> `static` **audioBufferToWAV**(`buffer`): `Blob`

Defined in: [core/AudioManager.ts:464](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/AudioManager.ts#L464)

Encode an AudioBuffer as a WAV Blob (PCM 16-bit).

#### Parameters

##### buffer

`AudioBuffer`

#### Returns

`Blob`
