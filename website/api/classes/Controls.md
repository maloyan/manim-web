# Class: Controls

Defined in: [interaction/Controls.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L86)

Controls panel for interactive scene manipulation.
Creates a DOM-based UI overlay positioned over the scene canvas.

## Extended by

- [`PlaybackControls`](PlaybackControls.md)

## Constructors

### Constructor

> **new Controls**(`scene`, `options`): `Controls`

Defined in: [interaction/Controls.ts:96](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L96)

Create a new Controls panel.

#### Parameters

##### scene

[`Scene`](Scene.md)

The scene to attach controls to

##### options

[`ControlsOptions`](../interfaces/ControlsOptions.md) = `{}`

Configuration options

#### Returns

`Controls`

## Properties

### \_options

> `protected` **\_options**: `Required`\<[`ControlsOptions`](../interfaces/ControlsOptions.md)\>

Defined in: [interaction/Controls.ts:89](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L89)

***

### \_panel

> `protected` **\_panel**: `HTMLElement`

Defined in: [interaction/Controls.ts:88](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L88)

***

### \_scene

> `protected` **\_scene**: [`Scene`](Scene.md)

Defined in: [interaction/Controls.ts:87](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L87)

## Accessors

### panel

#### Get Signature

> **get** **panel**(): `HTMLElement`

Defined in: [interaction/Controls.ts:109](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L109)

Get the underlying HTML panel element.

##### Returns

`HTMLElement`

***

### scene

#### Get Signature

> **get** **scene**(): [`Scene`](Scene.md)

Defined in: [interaction/Controls.ts:116](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L116)

Get the scene this controls panel is attached to.

##### Returns

[`Scene`](Scene.md)

## Methods

### \_getAccentColor()

> `protected` **\_getAccentColor**(): `string`

Defined in: [interaction/Controls.ts:176](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L176)

Get the accent color based on theme.

#### Returns

`string`

***

### \_getBorderColor()

> `protected` **\_getBorderColor**(): `string`

Defined in: [interaction/Controls.ts:190](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L190)

Get the border color based on theme.

#### Returns

`string`

***

### \_getHoverColor()

> `protected` **\_getHoverColor**(): `string`

Defined in: [interaction/Controls.ts:183](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L183)

Get the hover color based on theme.

#### Returns

`string`

***

### addButton()

> **addButton**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:318](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L318)

Add a button control.

#### Parameters

##### config

[`ButtonConfig`](../interfaces/ButtonConfig.md)

Button configuration

#### Returns

`HTMLElement`

The created button element

***

### addCheckbox()

> **addCheckbox**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:366](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L366)

Add a checkbox control.

#### Parameters

##### config

[`CheckboxConfig`](../interfaces/CheckboxConfig.md)

Checkbox configuration

#### Returns

`HTMLElement`

The created wrapper element

***

### addColorPicker()

> **addColorPicker**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:447](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L447)

Add a color picker control.

#### Parameters

##### config

[`ColorPickerConfig`](../interfaces/ColorPickerConfig.md)

Color picker configuration

#### Returns

`HTMLElement`

The created wrapper element

***

### addLabel()

> **addLabel**(`text`): `HTMLElement`

Defined in: [interaction/Controls.ts:566](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L566)

Add a section label.

#### Parameters

##### text

`string`

Label text

#### Returns

`HTMLElement`

The created label element

***

### addSeparator()

> **addSeparator**(): `void`

Defined in: [interaction/Controls.ts:551](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L551)

Add a horizontal separator line.

#### Returns

`void`

***

### addSlider()

> **addSlider**(`config`): `HTMLElement`

Defined in: [interaction/Controls.ts:199](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L199)

Add a slider control.

#### Parameters

##### config

[`SliderConfig`](../interfaces/SliderConfig.md)

Slider configuration

#### Returns

`HTMLElement`

The created wrapper element

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/Controls.ts:617](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L617)

Clean up and remove the controls panel from the DOM.

#### Returns

`void`

***

### hide()

> **hide**(): `void`

Defined in: [interaction/Controls.ts:592](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L592)

Hide the controls panel.

#### Returns

`void`

***

### isVisible()

> **isVisible**(): `boolean`

Defined in: [interaction/Controls.ts:610](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L610)

Check if the controls panel is visible.

#### Returns

`boolean`

***

### show()

> **show**(): `void`

Defined in: [interaction/Controls.ts:585](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L585)

Show the controls panel.

#### Returns

`void`

***

### toggle()

> **toggle**(): `void`

Defined in: [interaction/Controls.ts:599](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/interaction/Controls.ts#L599)

Toggle the controls panel visibility.

#### Returns

`void`
