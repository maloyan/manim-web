# Class: PlaybackControls

Defined in: [interaction/PlaybackControls.ts:30](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L30)

PlaybackControls for timeline manipulation.
Extends Controls to add playback-specific UI elements.

## Extends

- [`Controls`](Controls.md)

## Constructors

### Constructor

> **new PlaybackControls**(`scene`, `options`): `PlaybackControls`

Defined in: [interaction/PlaybackControls.ts:45](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L45)

Create new PlaybackControls.

#### Parameters

##### scene

[`Scene`](Scene.md)

The scene to control

##### options

[`PlaybackControlsOptions`](../interfaces/PlaybackControlsOptions.md) = `{}`

Configuration options

#### Returns

`PlaybackControls`

#### Overrides

[`Controls`](Controls.md).[`constructor`](Controls.md#constructor)

## Properties

### \_options

> `protected` **\_options**: `Required`\<[`ControlsOptions`](../interfaces/ControlsOptions.md)\>

Defined in: [interaction/Controls.ts:89](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L89)

#### Inherited from

[`Controls`](Controls.md).[`_options`](Controls.md#_options)

***

### \_panel

> `protected` **\_panel**: `HTMLElement`

Defined in: [interaction/Controls.ts:88](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L88)

#### Inherited from

[`Controls`](Controls.md).[`_panel`](Controls.md#_panel)

***

### \_scene

> `protected` **\_scene**: [`Scene`](Scene.md)

Defined in: [interaction/Controls.ts:87](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L87)

#### Inherited from

[`Controls`](Controls.md).[`_scene`](Controls.md#_scene)

## Accessors

### panel

#### Get Signature

> **get** **panel**(): `HTMLElement`

Defined in: [interaction/Controls.ts:109](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L109)

Get the underlying HTML panel element.

##### Returns

`HTMLElement`

#### Inherited from

[`Controls`](Controls.md).[`panel`](Controls.md#panel)

***

### playbackRate

#### Get Signature

> **get** **playbackRate**(): `number`

Defined in: [interaction/PlaybackControls.ts:62](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L62)

Get the current playback rate.

##### Returns

`number`

#### Set Signature

> **set** **playbackRate**(`rate`): `void`

Defined in: [interaction/PlaybackControls.ts:69](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L69)

Set the playback rate.

##### Parameters

###### rate

`number`

##### Returns

`void`

***

### scene

#### Get Signature

> **get** **scene**(): [`Scene`](Scene.md)

Defined in: [interaction/Controls.ts:116](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L116)

Get the scene this controls panel is attached to.

##### Returns

[`Scene`](Scene.md)

#### Inherited from

[`Controls`](Controls.md).[`scene`](Controls.md#scene)

## Methods

### \_getAccentColor()

> `protected` **\_getAccentColor**(): `string`

Defined in: [interaction/Controls.ts:176](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L176)

Get the accent color based on theme.

#### Returns

`string`

#### Inherited from

[`Controls`](Controls.md).[`_getAccentColor`](Controls.md#_getaccentcolor)

***

### \_getBorderColor()

> `protected` **\_getBorderColor**(): `string`

Defined in: [interaction/Controls.ts:190](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L190)

Get the border color based on theme.

#### Returns

`string`

#### Inherited from

[`Controls`](Controls.md).[`_getBorderColor`](Controls.md#_getbordercolor)

***

### \_getHoverColor()

> `protected` **\_getHoverColor**(): `string`

Defined in: [interaction/Controls.ts:183](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L183)

Get the hover color based on theme.

#### Returns

`string`

#### Inherited from

[`Controls`](Controls.md).[`_getHoverColor`](Controls.md#_gethovercolor)

***

### addButton()

> **addButton**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:318](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L318)

Add a button control.

#### Parameters

##### config

[`ButtonConfig`](../interfaces/ButtonConfig.md)

Button configuration

#### Returns

`HTMLElement`

The created button element

#### Inherited from

[`Controls`](Controls.md).[`addButton`](Controls.md#addbutton)

***

### addCheckbox()

> **addCheckbox**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:366](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L366)

Add a checkbox control.

#### Parameters

##### config

[`CheckboxConfig`](../interfaces/CheckboxConfig.md)

Checkbox configuration

#### Returns

`HTMLElement`

The created wrapper element

#### Inherited from

[`Controls`](Controls.md).[`addCheckbox`](Controls.md#addcheckbox)

***

### addColorPicker()

> **addColorPicker**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:447](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L447)

Add a color picker control.

#### Parameters

##### config

[`ColorPickerConfig`](../interfaces/ColorPickerConfig.md)

Color picker configuration

#### Returns

`HTMLElement`

The created wrapper element

#### Inherited from

[`Controls`](Controls.md).[`addColorPicker`](Controls.md#addcolorpicker)

***

### addLabel()

> **addLabel**(`text`): `HTMLElement`

Defined in: [interaction/Controls.ts:566](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L566)

Add a section label.

#### Parameters

##### text

`string`

Label text

#### Returns

`HTMLElement`

The created label element

#### Inherited from

[`Controls`](Controls.md).[`addLabel`](Controls.md#addlabel)

***

### addSeparator()

> **addSeparator**(): `void`

Defined in: [interaction/Controls.ts:551](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L551)

Add a horizontal separator line.

#### Returns

`void`

#### Inherited from

[`Controls`](Controls.md).[`addSeparator`](Controls.md#addseparator)

***

### addSlider()

> **addSlider**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:199](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L199)

Add a slider control.

#### Parameters

##### config

[`SliderConfig`](../interfaces/SliderConfig.md)

Slider configuration

#### Returns

`HTMLElement`

The created wrapper element

#### Inherited from

[`Controls`](Controls.md).[`addSlider`](Controls.md#addslider)

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/PlaybackControls.ts:464](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L464)

Clean up resources.

#### Returns

`void`

#### Overrides

[`Controls`](Controls.md).[`dispose`](Controls.md#dispose)

***

### hide()

> **hide**(): `void`

Defined in: [interaction/Controls.ts:592](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L592)

Hide the controls panel.

#### Returns

`void`

#### Inherited from

[`Controls`](Controls.md).[`hide`](Controls.md#hide)

***

### isVisible()

> **isVisible**(): `boolean`

Defined in: [interaction/Controls.ts:610](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L610)

Check if the controls panel is visible.

#### Returns

`boolean`

#### Inherited from

[`Controls`](Controls.md).[`isVisible`](Controls.md#isvisible)

***

### onTimeUpdate()

> **onTimeUpdate**(`callback`): `void`

Defined in: [interaction/PlaybackControls.ts:55](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L55)

Set callback for time updates.

#### Parameters

##### callback

[`TimeUpdateCallback`](../type-aliases/TimeUpdateCallback.md)

Function called when time changes

#### Returns

`void`

***

### show()

> **show**(): `void`

Defined in: [interaction/Controls.ts:585](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L585)

Show the controls panel.

#### Returns

`void`

#### Inherited from

[`Controls`](Controls.md).[`show`](Controls.md#show)

***

### toggle()

> **toggle**(): `void`

Defined in: [interaction/Controls.ts:599](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/Controls.ts#L599)

Toggle the controls panel visibility.

#### Returns

`void`

#### Inherited from

[`Controls`](Controls.md).[`toggle`](Controls.md#toggle)

***

### updateTime()

> **updateTime**(`currentTime`, `duration`): `void`

Defined in: [interaction/PlaybackControls.ts:355](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/interaction/PlaybackControls.ts#L355)

Update the time display.

#### Parameters

##### currentTime

`number`

Current playback time in seconds

##### duration

`number`

Total duration in seconds

#### Returns

`void`
