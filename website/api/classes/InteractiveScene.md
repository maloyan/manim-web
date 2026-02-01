# Class: InteractiveScene

Defined in: [core/InteractiveScene.ts:81](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L81)

A Scene with ManimGL-style interactive authoring tools.

Features:
- **Selection**: click, shift+click, box-select mobjects
- **Undo/Redo**: Ctrl+Z / Ctrl+Shift+Z (uses SceneStateManager)
- **Delete**: Delete/Backspace removes selected mobjects
- **Copy/Paste**: Ctrl+C / Ctrl+V with slight offset
- **Group/Ungroup**: Ctrl+G / Ctrl+Shift+G
- **Color Palette**: press 'C' to toggle an overlay with Manim colors
- **Drag Move**: drag selected mobjects to reposition them

## Example

```ts
const scene = new InteractiveScene(container, { showColorPalette: true });
scene.add(new Circle(), new Square());
// Now you can click, drag, Ctrl+Z, etc.
```

## Extends

- [`Scene`](Scene.md)

## Constructors

### Constructor

> **new InteractiveScene**(`container`, `options`): `InteractiveScene`

Defined in: [core/InteractiveScene.ts:118](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L118)

Create a new InteractiveScene.

#### Parameters

##### container

`HTMLElement`

DOM element to render into

##### options

[`InteractiveSceneOptions`](../interfaces/InteractiveSceneOptions.md) = `{}`

Interactive scene configuration

#### Returns

`InteractiveScene`

#### Overrides

[`Scene`](Scene.md).[`constructor`](Scene.md#constructor)

## Properties

### selection

> `readonly` **selection**: [`SelectionManager`](SelectionManager.md)

Defined in: [core/InteractiveScene.ts:83](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L83)

The selection manager handling click/box-select.

## Accessors

### audioManager

#### Get Signature

> **get** **audioManager**(): [`AudioManager`](AudioManager.md)

Defined in: [core/Scene.ts:197](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L197)

Get the audio manager (lazily created on first access).
Use this to access lower-level audio controls.

##### Returns

[`AudioManager`](AudioManager.md)

#### Inherited from

[`Scene`](Scene.md).[`audioManager`](Scene.md#audiomanager)

***

### camera

#### Get Signature

> **get** **camera**(): [`Camera2D`](Camera2D.md)

Defined in: [core/Scene.ts:150](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L150)

Get the camera.

##### Returns

[`Camera2D`](Camera2D.md)

#### Inherited from

[`Scene`](Scene.md).[`camera`](Scene.md#camera)

***

### currentTime

#### Get Signature

> **get** **currentTime**(): `number`

Defined in: [core/Scene.ts:178](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L178)

Get the current playback time.

##### Returns

`number`

#### Inherited from

[`Scene`](Scene.md).[`currentTime`](Scene.md#currenttime)

***

### isPlaying

#### Get Signature

> **get** **isPlaying**(): `boolean`

Defined in: [core/Scene.ts:171](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L171)

Get whether animations are currently playing.

##### Returns

`boolean`

#### Inherited from

[`Scene`](Scene.md).[`isPlaying`](Scene.md#isplaying)

***

### mobjects

#### Get Signature

> **get** **mobjects**(): `ReadonlySet`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Scene.ts:185](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L185)

Get all mobjects in the scene.

##### Returns

`ReadonlySet`\<[`Mobject`](Mobject.md)\>

#### Inherited from

[`Scene`](Scene.md).[`mobjects`](Scene.md#mobjects)

***

### mousePoint

#### Get Signature

> **get** **mousePoint**(): `Vector3`

Defined in: [core/InteractiveScene.ts:163](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L163)

Get the current mouse position in world coordinates.
Updated on every mouse move (like ManimGL's mouse_point).

##### Returns

`Vector3`

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](Renderer.md)

Defined in: [core/Scene.ts:157](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L157)

Get the renderer.

##### Returns

[`Renderer`](Renderer.md)

#### Inherited from

[`Scene`](Scene.md).[`renderer`](Scene.md#renderer)

***

### stateManager

#### Get Signature

> **get** **stateManager**(): [`SceneStateManager`](SceneStateManager.md)

Defined in: [core/Scene.ts:858](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L858)

Get the scene's state manager for advanced undo/redo control.

##### Returns

[`SceneStateManager`](SceneStateManager.md)

#### Inherited from

[`Scene`](Scene.md).[`stateManager`](Scene.md#statemanager)

***

### threeScene

#### Get Signature

> **get** **threeScene**(): `Scene`

Defined in: [core/Scene.ts:143](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L143)

Get the Three.js scene.

##### Returns

`Scene`

#### Inherited from

[`Scene`](Scene.md).[`threeScene`](Scene.md#threescene)

***

### timeline

#### Get Signature

> **get** **timeline**(): [`Timeline`](Timeline.md)

Defined in: [core/Scene.ts:164](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L164)

Get the current timeline.

##### Returns

[`Timeline`](Timeline.md)

#### Inherited from

[`Scene`](Scene.md).[`timeline`](Scene.md#timeline)

## Methods

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Scene.ts:249](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L249)

Add mobjects to the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`add`](Scene.md#add)

***

### addSound()

> **addSound**(`url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:218](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L218)

Add a sound to play at a specific time on the timeline.
Mirrors Python manim's `self.add_sound("file.wav", time_offset=0.5)`.

#### Parameters

##### url

`string`

URL of the audio file

##### options?

[`AddSoundOptions`](../interfaces/AddSoundOptions.md)

Scheduling and playback options

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Promise resolving to the created AudioTrack

#### Example

```ts
await scene.addSound('/sounds/click.wav', { time: 0.5 });
await scene.addSound('/sounds/whoosh.wav');  // plays at time 0
```

#### Inherited from

[`Scene`](Scene.md).[`addSound`](Scene.md#addsound)

***

### addSoundAtAnimation()

> **addSoundAtAnimation**(`animation`, `url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:237](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L237)

Add a sound that starts when a given animation begins.

#### Parameters

##### animation

[`Animation`](Animation.md)

The animation to sync with

##### url

`string`

URL of the audio file

##### options?

`Omit`\<[`AddSoundOptions`](../interfaces/AddSoundOptions.md), `"time"`\> & `object`

Additional options (timeOffset shifts relative to animation start)

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Promise resolving to the created AudioTrack

#### Example

```ts
const fadeIn = new FadeIn(circle);
await scene.addSoundAtAnimation(fadeIn, '/sounds/appear.wav');
await scene.play(fadeIn);
```

#### Inherited from

[`Scene`](Scene.md).[`addSoundAtAnimation`](Scene.md#addsoundatanimation)

***

### applyColorToSelected()

> **applyColorToSelected**(`color`): `void`

Defined in: [core/InteractiveScene.ts:288](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L288)

Apply a color to all selected mobjects.

#### Parameters

##### color

`string`

CSS color string

#### Returns

`void`

***

### batch()

> **batch**(`callback`): `void`

Defined in: [core/Scene.ts:744](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L744)

Batch multiple mobject updates without re-rendering between each.
Useful for performance when making many changes at once.

#### Parameters

##### callback

() => `void`

Function containing multiple mobject operations

#### Returns

`void`

#### Example

```ts
scene.batch(() => {
  circle.setColor('red');
  circle.shift([1, 0, 0]);
  square.setOpacity(0.5);
});
```

#### Inherited from

[`Scene`](Scene.md).[`batch`](Scene.md#batch)

***

### clear()

> **clear**(): `this`

Defined in: [core/Scene.ts:299](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L299)

Clear all mobjects from the scene.

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`clear`](Scene.md#clear)

***

### copySelected()

> **copySelected**(): `void`

Defined in: [core/InteractiveScene.ts:198](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L198)

Copy selected mobjects to the internal clipboard.

#### Returns

`void`

***

### deleteSelected()

> **deleteSelected**(): `void`

Defined in: [core/InteractiveScene.ts:182](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L182)

Programmatically delete the currently selected mobjects.
Saves state for undo before removing.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [core/InteractiveScene.ts:540](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L540)

Clean up all resources including event listeners and HUD.

#### Returns

`void`

#### Overrides

[`Scene`](Scene.md).[`dispose`](Scene.md#dispose)

***

### getCamera()

> **getCamera**(): [`Camera2D`](Camera2D.md)

Defined in: [core/Scene.ts:810](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L810)

Get the camera.

#### Returns

[`Camera2D`](Camera2D.md)

The Camera2D instance

#### Inherited from

[`Scene`](Scene.md).[`getCamera`](Scene.md#getcamera)

***

### getCanvas()

> **getCanvas**(): `HTMLCanvasElement`

Defined in: [core/Scene.ts:802](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L802)

Get the canvas element.

#### Returns

`HTMLCanvasElement`

The HTMLCanvasElement used for rendering

#### Inherited from

[`Scene`](Scene.md).[`getCanvas`](Scene.md#getcanvas)

***

### getContainer()

> **getContainer**(): `HTMLElement`

Defined in: [core/Scene.ts:819](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L819)

Get the container element the scene is rendered into.
Returns the parent element of the canvas.

#### Returns

`HTMLElement`

The container HTMLElement

#### Inherited from

[`Scene`](Scene.md).[`getContainer`](Scene.md#getcontainer)

***

### getHeight()

> **getHeight**(): `number`

Defined in: [core/Scene.ts:839](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L839)

Get the height of the canvas in pixels.

#### Returns

`number`

Canvas height in pixels

#### Inherited from

[`Scene`](Scene.md).[`getHeight`](Scene.md#getheight)

***

### getState()

> **getState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:912](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L912)

Get a snapshot of the current scene state without modifying stacks.

#### Parameters

##### label?

`string`

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Inherited from

[`Scene`](Scene.md).[`getState`](Scene.md#getstate)

***

### getTargetFps()

> **getTargetFps**(): `number`

Defined in: [core/Scene.ts:770](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L770)

Get the current target frame rate.

#### Returns

`number`

Target fps

#### Inherited from

[`Scene`](Scene.md).[`getTargetFps`](Scene.md#gettargetfps)

***

### getTimelineDuration()

> **getTimelineDuration**(): `number`

Defined in: [core/Scene.ts:847](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L847)

Get the total duration of the current timeline.

#### Returns

`number`

Duration in seconds, or 0 if no timeline

#### Inherited from

[`Scene`](Scene.md).[`getTimelineDuration`](Scene.md#gettimelineduration)

***

### getWidth()

> **getWidth**(): `number`

Defined in: [core/Scene.ts:831](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L831)

Get the width of the canvas in pixels.

#### Returns

`number`

Canvas width in pixels

#### Inherited from

[`Scene`](Scene.md).[`getWidth`](Scene.md#getwidth)

***

### groupSelected()

> **groupSelected**(): `void`

Defined in: [core/InteractiveScene.ts:237](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L237)

Group all selected mobjects into a new VGroup.
The individual mobjects are removed from the scene and replaced
by the group.

#### Returns

`void`

***

### isInView()

> **isInView**(`object`): `boolean`

Defined in: [core/Scene.ts:598](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L598)

Check if an object is within the camera's view frustum.
Useful for manual culling checks or debugging.

#### Parameters

##### object

`Object3D`

Three.js object to check

#### Returns

`boolean`

true if object is in view or if culling is disabled

#### Inherited from

[`Scene`](Scene.md).[`isInView`](Scene.md#isinview)

***

### pasteFromClipboard()

> **pasteFromClipboard**(): `void`

Defined in: [core/InteractiveScene.ts:212](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L212)

Paste mobjects from the clipboard into the scene.
Copies are offset slightly from the originals.

#### Returns

`void`

***

### pause()

> **pause**(): `this`

Defined in: [core/Scene.ts:493](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L493)

Pause playback (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`pause`](Scene.md#pause)

***

### play()

> **play**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:339](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L339)

Play animations in parallel (all at once).
Matches Manim's scene.play() behavior where multiple animations run simultaneously.
Automatically adds mobjects to the scene if not already present.

#### Parameters

##### animations

...[`Animation`](Animation.md)[]

Animations to play

#### Returns

`Promise`\<`void`\>

Promise that resolves when all animations complete

#### Inherited from

[`Scene`](Scene.md).[`play`](Scene.md#play)

***

### playAll()

> **playAll**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:394](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L394)

Play multiple animations in parallel (all at once).

#### Parameters

##### animations

...[`Animation`](Animation.md)[]

Animations to play simultaneously

#### Returns

`Promise`\<`void`\>

Promise that resolves when all animations complete

#### Inherited from

[`Scene`](Scene.md).[`playAll`](Scene.md#playall)

***

### redo()

> **redo**(): `boolean`

Defined in: [core/Scene.ts:901](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L901)

Redo the last undone change.
The current state is pushed to the undo stack.

#### Returns

`boolean`

true if redo was applied, false if nothing to redo

#### Inherited from

[`Scene`](Scene.md).[`redo`](Scene.md#redo)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Scene.ts:282](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L282)

Remove mobjects from the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to remove

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`remove`](Scene.md#remove)

***

### render()

> **render**(): `void`

Defined in: [core/Scene.ts:931](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L931)

Force render a single frame.
Useful for video export where frames need to be captured at specific times.

#### Returns

`void`

#### Inherited from

[`Scene`](Scene.md).[`render`](Scene.md#render)

***

### resize()

> **resize**(`width`, `height`): `this`

Defined in: [core/Scene.ts:788](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L788)

Handle window resize.

#### Parameters

##### width

`number`

New width in pixels

##### height

`number`

New height in pixels

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`resize`](Scene.md#resize)

***

### resume()

> **resume**(): `this`

Defined in: [core/Scene.ts:507](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L507)

Resume playback (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`resume`](Scene.md#resume)

***

### saveState()

> **saveState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:877](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L877)

Save the current state of all scene mobjects.
Pushes onto the undo stack and clears the redo stack.

#### Parameters

##### label?

`string`

Optional human-readable label

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

The captured SceneSnapshot

#### Example

```ts
scene.add(circle, square);
scene.saveState();
circle.shift([2, 0, 0]);
scene.undo(); // circle returns to original position
```

#### Inherited from

[`Scene`](Scene.md).[`saveState`](Scene.md#savestate)

***

### seek()

> **seek**(`time`): `this`

Defined in: [core/Scene.ts:478](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L478)

Seek to a specific time in the timeline.
Also seeks the audio manager if audio has been used.

#### Parameters

##### time

`number`

Time in seconds

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`seek`](Scene.md#seek)

***

### setFrustumCulling()

> **setFrustumCulling**(`enabled`): `this`

Defined in: [core/Scene.ts:778](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L778)

Enable or disable frustum culling.

#### Parameters

##### enabled

`boolean`

Whether frustum culling should be enabled

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`setFrustumCulling`](Scene.md#setfrustumculling)

***

### setState()

> **setState**(`snapshot`): `void`

Defined in: [core/Scene.ts:920](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L920)

Apply a previously captured snapshot, overwriting all mobject states.
Does NOT modify undo/redo stacks. Call saveState() first to preserve.

#### Parameters

##### snapshot

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Returns

`void`

#### Inherited from

[`Scene`](Scene.md).[`setState`](Scene.md#setstate)

***

### setTargetFps()

> **setTargetFps**(`fps`): `this`

Defined in: [core/Scene.ts:760](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L760)

Set the target frame rate.

#### Parameters

##### fps

`number`

Target frames per second (1-120)

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`setTargetFps`](Scene.md#settargetfps)

***

### stop()

> **stop**(): `this`

Defined in: [core/Scene.ts:522](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L522)

Stop playback and reset timeline (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`stop`](Scene.md#stop)

***

### toggleColorPalette()

> **toggleColorPalette**(): `void`

Defined in: [core/InteractiveScene.ts:170](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L170)

Toggle the color palette HUD visibility.

#### Returns

`void`

***

### undo()

> **undo**(): `boolean`

Defined in: [core/Scene.ts:887](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L887)

Undo the last change (restore the most recently saved state).
The current state is pushed to the redo stack.

#### Returns

`boolean`

true if undo was applied, false if nothing to undo

#### Inherited from

[`Scene`](Scene.md).[`undo`](Scene.md#undo)

***

### ungroupSelected()

> **ungroupSelected**(): `void`

Defined in: [core/InteractiveScene.ts:262](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/InteractiveScene.ts#L262)

Ungroup selected VGroups: replace each group with its children.

#### Returns

`void`

***

### wait()

> **wait**(`duration`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:435](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/Scene.ts#L435)

Wait for a duration (pause between animations).
Runs a render loop during the wait so that updaters keep ticking.

#### Parameters

##### duration

`number` = `1`

Duration in seconds

#### Returns

`Promise`\<`void`\>

Promise that resolves after the duration

#### Inherited from

[`Scene`](Scene.md).[`wait`](Scene.md#wait)
