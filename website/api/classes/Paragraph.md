# Class: Paragraph

Defined in: [mobjects/text/Paragraph.ts:38](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L38)

Paragraph - A text mobject with automatic word wrapping

Extends Text to add word wrapping functionality. Text is wrapped
to fit within a specified width, with configurable alignment.

## Example

```typescript
// Create a paragraph with max width
const para = new Paragraph({
  text: 'This is a long paragraph that will automatically wrap to fit within the specified width.',
  width: 4,  // 4 world units
  alignment: 'justify'
});

// Update width to trigger re-wrap
para.setWidth(3);
```

## Extends

- [`Text`](Text.md)

## Constructors

### Constructor

> **new Paragraph**(`options`): `Paragraph`

Defined in: [mobjects/text/Paragraph.ts:43](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L43)

#### Parameters

##### options

[`ParagraphOptions`](../interfaces/ParagraphOptions.md)

#### Returns

`Paragraph`

#### Overrides

[`Text`](Text.md).[`constructor`](Text.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Text`](Text.md).[`__savedMobjectState`](Text.md#__savedmobjectstate)

***

### \_alignment

> `protected` **\_alignment**: `"center"` \| `"left"` \| `"right"` \| `"justify"`

Defined in: [mobjects/text/Paragraph.ts:40](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L40)

***

### \_canvas

> `protected` **\_canvas**: `HTMLCanvasElement` = `null`

Defined in: [mobjects/text/Text.ts:116](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L116)

Off-screen canvas for text rendering

#### Inherited from

[`Text`](Text.md).[`_canvas`](Text.md#_canvas)

***

### \_canvasDirty

> `protected` **\_canvasDirty**: `boolean` = `true`

Defined in: [mobjects/text/Text.ts:105](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L105)

Flag to track when canvas content needs re-rendering (text/color/font changes)

#### Inherited from

[`Text`](Text.md).[`_canvasDirty`](Text.md#_canvasdirty)

***

### \_ctx

> `protected` **\_ctx**: `CanvasRenderingContext2D` = `null`

Defined in: [mobjects/text/Text.ts:117](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L117)

#### Inherited from

[`Text`](Text.md).[`_ctx`](Text.md#_ctx)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Text`](Text.md).[`_dirty`](Text.md#_dirty)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L47)

Three.js fill material

#### Inherited from

[`Text`](Text.md).[`_fillMaterial`](Text.md#_fillmaterial)

***

### \_fontFamily

> `protected` **\_fontFamily**: `string`

Defined in: [mobjects/text/Text.ts:101](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L101)

#### Inherited from

[`Text`](Text.md).[`_fontFamily`](Text.md#_fontfamily)

***

### \_fontSize

> `protected` **\_fontSize**: `number`

Defined in: [mobjects/text/Text.ts:100](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L100)

#### Inherited from

[`Text`](Text.md).[`_fontSize`](Text.md#_fontsize)

***

### \_fontStyle

> `protected` **\_fontStyle**: `string`

Defined in: [mobjects/text/Text.ts:103](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L103)

#### Inherited from

[`Text`](Text.md).[`_fontStyle`](Text.md#_fontstyle)

***

### \_fontUrl?

> `protected` `optional` **\_fontUrl**: `string`

Defined in: [mobjects/text/Text.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L111)

Optional font URL for glyph vector extraction

#### Inherited from

[`Text`](Text.md).[`_fontUrl`](Text.md#_fonturl)

***

### \_fontWeight

> `protected` **\_fontWeight**: `string` \| `number`

Defined in: [mobjects/text/Text.ts:102](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L102)

#### Inherited from

[`Text`](Text.md).[`_fontWeight`](Text.md#_fontweight)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L50)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`Text`](Text.md).[`_geometryDirty`](Text.md#_geometrydirty)

***

### \_glyphGroup

> `protected` **\_glyphGroup**: [`TextGlyphGroup`](TextGlyphGroup.md) = `null`

Defined in: [mobjects/text/Text.ts:113](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L113)

Cached glyph group (created lazily by loadGlyphs)

#### Inherited from

[`Text`](Text.md).[`_glyphGroup`](Text.md#_glyphgroup)

***

### \_letterSpacing

> `protected` **\_letterSpacing**: `number`

Defined in: [mobjects/text/Text.ts:107](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L107)

#### Inherited from

[`Text`](Text.md).[`_letterSpacing`](Text.md#_letterspacing)

***

### \_lineHeight

> `protected` **\_lineHeight**: `number`

Defined in: [mobjects/text/Text.ts:106](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L106)

#### Inherited from

[`Text`](Text.md).[`_lineHeight`](Text.md#_lineheight)

***

### \_maxWidth

> `protected` **\_maxWidth**: `number`

Defined in: [mobjects/text/Paragraph.ts:39](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L39)

***

### \_mesh

> `protected` **\_mesh**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\> = `null`

Defined in: [mobjects/text/Text.ts:123](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L123)

Plane mesh for displaying the texture

#### Inherited from

[`Text`](Text.md).[`_mesh`](Text.md#_mesh)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Text`](Text.md).[`_opacity`](Text.md#_opacity)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:38](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L38)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`Text`](Text.md).[`_points3D`](Text.md#_points3d)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:44](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L44)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`Text`](Text.md).[`_strokeMaterial`](Text.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Text`](Text.md).[`_style`](Text.md#_style)

***

### \_text

> `protected` **\_text**: `string`

Defined in: [mobjects/text/Text.ts:99](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L99)

#### Inherited from

[`Text`](Text.md).[`_text`](Text.md#_text)

***

### \_textAlign

> `protected` **\_textAlign**: `"center"` \| `"left"` \| `"right"`

Defined in: [mobjects/text/Text.ts:108](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L108)

#### Inherited from

[`Text`](Text.md).[`_textAlign`](Text.md#_textalign)

***

### \_texture

> `protected` **\_texture**: `CanvasTexture`\<`HTMLCanvasElement`\> = `null`

Defined in: [mobjects/text/Text.ts:120](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L120)

Three.js texture from canvas

#### Inherited from

[`Text`](Text.md).[`_texture`](Text.md#_texture)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Text`](Text.md).[`_threeObject`](Text.md#_threeobject)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:41](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L41)

Number of points visible (for Create animation)

#### Inherited from

[`Text`](Text.md).[`_visiblePointCount`](Text.md#_visiblepointcount)

***

### \_worldHeight

> `protected` **\_worldHeight**: `number` = `0`

Defined in: [mobjects/text/Text.ts:127](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L127)

#### Inherited from

[`Text`](Text.md).[`_worldHeight`](Text.md#_worldheight)

***

### \_worldWidth

> `protected` **\_worldWidth**: `number` = `0`

Defined in: [mobjects/text/Text.ts:126](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L126)

Cached dimensions in world units

#### Inherited from

[`Text`](Text.md).[`_worldWidth`](Text.md#_worldwidth)

***

### \_wrappedLines

> `protected` **\_wrappedLines**: `string`[] = `[]`

Defined in: [mobjects/text/Paragraph.ts:41](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L41)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Text`](Text.md).[`children`](Text.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Text`](Text.md).[`fillOpacity`](Text.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Text`](Text.md).[`id`](Text.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Text`](Text.md).[`parent`](Text.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Text`](Text.md).[`position`](Text.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Text`](Text.md).[`rotation`](Text.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Text`](Text.md).[`savedState`](Text.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Text`](Text.md).[`scaleVector`](Text.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Text`](Text.md).[`strokeWidth`](Text.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Text`](Text.md).[`targetCopy`](Text.md#targetcopy)

***

### useStrokeMesh

> **useStrokeMesh**: `boolean` = `false`

Defined in: [core/VMobject.ts:100](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L100)

When true, render stroke as a mesh ring with miter-joined corners instead
of Line2 for closed paths.  Falls back to Line2 for open/partial paths
(e.g. during Create/Uncreate animations).

#### Inherited from

[`Text`](Text.md).[`useStrokeMesh`](Text.md#usestrokemesh)

***

### \_frameWidth

> `static` **\_frameWidth**: `number` = `14`

Defined in: [core/VMobject.ts:67](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L67)

Camera frame width in world units (set by Scene, for stroke width conversion)

#### Inherited from

[`Text`](Text.md).[`_frameWidth`](Text.md#_framewidth)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:64](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L64)

#### Inherited from

[`Text`](Text.md).[`_rendererHeight`](Text.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:63](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L63)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`Text`](Text.md).[`_rendererWidth`](Text.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:84](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L84)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`Text`](Text.md).[`useShaderCurves`](Text.md#useshadercurves)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`color`](Text.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:473](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L473)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:480](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L480)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`fillColor`](Text.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:933](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L933)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Text`](Text.md).[`isDirty`](Text.md#isdirty)

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:200](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L200)

Get the number of points

##### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`numPoints`](Text.md#numpoints)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`opacity`](Text.md#opacity)

***

### points

#### Get Signature

> **get** **points**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:150](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L150)

Get all points as 2D Point objects (derived from _points3D)

##### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Text`](Text.md).[`points`](Text.md#points)

***

### shaderCurves

#### Get Signature

> **get** **shaderCurves**(): `boolean`

Defined in: [core/VMobject.ts:133](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L133)

Check whether this instance should use shader-based Bezier curve rendering.
Returns the per-instance override if set, otherwise the class-level default.

##### Returns

`boolean`

#### Set Signature

> **set** **shaderCurves**(`value`): `void`

Defined in: [core/VMobject.ts:141](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L141)

Enable or disable shader-based Bezier curve rendering for this instance.
Pass `null` to revert to the class-level VMobject.useShaderCurves default.

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`shaderCurves`](Text.md#shadercurves)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Text`](Text.md).[`style`](Text.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Text`](Text.md).[`submobjects`](Text.md#submobjects)

***

### visiblePointCount

#### Get Signature

> **get** **visiblePointCount**(): `number`

Defined in: [core/VMobject.ts:207](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L207)

Get the number of visible points (for Create animation)

##### Returns

`number`

#### Set Signature

> **set** **visiblePointCount**(`count`): `void`

Defined in: [core/VMobject.ts:214](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L214)

Set the number of visible points (for Create animation)

##### Parameters

###### count

`number`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`visiblePointCount`](Text.md#visiblepointcount)

## Methods

### \_buildEarcutFillGeometry()

> `protected` **\_buildEarcutFillGeometry**(`points3D`): `BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

Defined in: [core/VMobject.ts:528](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L528)

Build a THREE.BufferGeometry for the filled region using earcut triangulation.

Earcut handles concave polygons, self-intersecting paths, and holes far
more robustly than Three.js' built-in ShapeGeometry triangulator, which
is a simple ear-clipping implementation that struggles with complex SVG
outlines.

If earcut returns zero triangles (completely degenerate input) we fall
back to THREE.ShapeGeometry so existing simple shapes still render.

#### Parameters

##### points3D

`number`[][]

The visible Bezier control points

#### Returns

`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

A BufferGeometry ready for use as a fill mesh, or null if the
         polygon is too degenerate even for fallback.

#### Inherited from

[`Text`](Text.md).[`_buildEarcutFillGeometry`](Text.md#_buildearcutfillgeometry)

***

### \_buildFontString()

> `protected` **\_buildFontString**(): `string`

Defined in: [mobjects/text/Text.ts:257](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L257)

Build the CSS font string

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`_buildFontString`](Text.md#_buildfontstring)

***

### \_createCopy()

> `protected` **\_createCopy**(): `Paragraph`

Defined in: [mobjects/text/Paragraph.ts:332](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L332)

Create a copy of this Paragraph mobject

#### Returns

`Paragraph`

#### Overrides

[`Text`](Text.md).[`_createCopy`](Text.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/text/Text.ts:440](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L440)

Create the Three.js backing object

#### Returns

`Object3D`

#### Inherited from

[`Text`](Text.md).[`_createThreeObject`](Text.md#_createthreeobject)

***

### \_drawJustifiedLine()

> `protected` **\_drawJustifiedLine**(`line`, `startX`, `endX`, `y`): `void`

Defined in: [mobjects/text/Paragraph.ts:279](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L279)

Draw a line with justified spacing

#### Parameters

##### line

`string`

##### startX

`number`

##### endX

`number`

##### y

`number`

#### Returns

`void`

***

### \_drawTextWithLetterSpacing()

> `protected` **\_drawTextWithLetterSpacing**(`text`, `startX`, `y`, `_fontSize`): `void`

Defined in: [mobjects/text/Text.ts:379](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L379)

Draw text with custom letter spacing

#### Parameters

##### text

`string`

##### startX

`number`

##### y

`number`

##### \_fontSize

`number`

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_drawTextWithLetterSpacing`](Text.md#_drawtextwithletterspacing)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:748](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L748)

Get bounding box dimensions
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Returns

`object`

Object with width, height, and depth

##### depth

> **depth**: `number`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

[`Text`](Text.md).[`_getBoundingBox`](Text.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:731](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L731)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`_getEdgeInDirection`](Text.md#_getedgeindirection)

***

### \_initCanvas()

> `protected` **\_initCanvas**(): `void`

Defined in: [mobjects/text/Text.ts:169](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L169)

Initialize the off-screen canvas

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_initCanvas`](Text.md#_initcanvas)

***

### \_interpolatePointList3D()

> `protected` **\_interpolatePointList3D**(`points`, `targetCount`): `number`[][]

Defined in: [core/VMobject.ts:405](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L405)

Interpolate a 3D point list to have a specific number of points.

#### Parameters

##### points

`number`[][]

##### targetCount

`number`

#### Returns

`number`[][]

#### Inherited from

[`Text`](Text.md).[`_interpolatePointList3D`](Text.md#_interpolatepointlist3d)

***

### \_isNewParagraph()

> `protected` **\_isNewParagraph**(`lines`, `currentIndex`): `boolean`

Defined in: [mobjects/text/Paragraph.ts:271](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L271)

Check if the next line starts a new paragraph (empty line or explicit break)

#### Parameters

##### lines

`string`[]

##### currentIndex

`number`

#### Returns

`boolean`

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:913](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L913)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_markDirty`](Text.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:922](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L922)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_markDirtyUpward`](Text.md#_markdirtyupward)

***

### \_measureText()

> `protected` **\_measureText**(): `object`

Defined in: [mobjects/text/Paragraph.ts:153](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L153)

Override measure text to use wrapped lines

#### Returns

`object`

##### height

> **height**: `number`

##### lines

> **lines**: `string`[]

##### width

> **width**: `number`

#### Overrides

[`Text`](Text.md).[`_measureText`](Text.md#_measuretext)

***

### \_pointsToCurvePath()

> `protected` **\_pointsToCurvePath**(): `CurvePath`\<`Vector3`\>

Defined in: [core/VMobject.ts:482](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L482)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`Text`](Text.md).[`_pointsToCurvePath`](Text.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:440](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L440)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`Text`](Text.md).[`_pointsToShape`](Text.md#_pointstoshape)

***

### \_renderToCanvas()

> `protected` **\_renderToCanvas**(): `void`

Defined in: [mobjects/text/Paragraph.ts:193](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L193)

Render text to canvas with justification support

#### Returns

`void`

#### Overrides

[`Text`](Text.md).[`_renderToCanvas`](Text.md#_rendertocanvas)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/text/Text.ts:477](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L477)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_syncMaterialToThree`](Text.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:867](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L867)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_syncToThree`](Text.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(`group`): `void`

Defined in: [core/VMobject.ts:731](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L731)

Update the geometry within the Three.js group.
Reuses existing Line2 / Mesh objects when possible to avoid expensive
dispose-and-recreate cycles during per-frame animation updates.

When `shaderCurves` is enabled, stroke rendering uses GPU Bezier SDF
shaders via BezierRenderer instead of the Line2 polyline approach.

#### Parameters

##### group

`Group`

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_updateGeometry`](Text.md#_updategeometry)

***

### \_updateMesh()

> `protected` **\_updateMesh**(): `void`

Defined in: [mobjects/text/Text.ts:426](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L426)

Update the mesh geometry to match new dimensions

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_updateMesh`](Text.md#_updatemesh)

***

### \_wrapText()

> `protected` **\_wrapText**(): `string`[]

Defined in: [mobjects/text/Paragraph.ts:105](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L105)

Wrap text to fit within max width

#### Returns

`string`[]

Array of wrapped lines

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:492](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L492)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`add`](Text.md#add)

***

### addPoints()

> **addPoints**(...`points`): `this`

Defined in: [core/VMobject.ts:239](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L239)

Add points to this VMobject using 2D Point objects

#### Parameters

##### points

...[`Point`](../interfaces/Point.md)[]

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`addPoints`](Text.md#addpoints)

***

### addPointsAsCorners()

> **addPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:294](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L294)

Add straight line segments from the last point to each corner.
Each corner creates a new cubic Bezier segment with linear handles.
Matches Manim's add_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points to connect to

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`addPointsAsCorners`](Text.md#addpointsascorners)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:981](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L981)

Add an updater function that runs every frame

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

Function called with (mobject, dt) each frame

##### callOnAdd

`boolean` = `false`

Whether to call immediately, default false

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`addUpdater`](Text.md#addupdater)

***

### alignPoints()

> **alignPoints**(`target`): `void`

Defined in: [core/VMobject.ts:385](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L385)

Align points between this VMobject and a target so they have the same count.
This is necessary for smooth morphing animations.

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to align with

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`alignPoints`](Text.md#alignpoints)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:696](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L696)

Align this mobject with another along an edge

#### Parameters

##### target

The mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The direction/edge to align (e.g., LEFT aligns left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`alignTo`](Text.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1048](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1048)

Apply a point-wise function to every VMobject descendant's control points.
Uses duck-type check for getPoints/setPoints to avoid circular imports.

#### Parameters

##### fn

(`point`) => `number`[]

Function mapping [x, y, z] to [x', y', z']

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`applyFunction`](Text.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:956](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L956)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`applyToFamily`](Text.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:563](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L563)

Replace this mobject's visual properties with those of another mobject.
Preserves identity (updaters, scene membership) but copies appearance.

#### Parameters

##### other

[`Mobject`](Mobject.md)

The mobject to copy appearance from

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`become`](Text.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:828](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L828)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`center`](Text.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:328](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L328)

Clear all points

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`clearPoints`](Text.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1006)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`clearUpdaters`](Text.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:536](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L536)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Text`](Text.md).[`copy`](Text.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [mobjects/text/Text.ts:572](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L572)

Clean up Three.js and canvas resources

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`dispose`](Text.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`flip`](Text.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1116](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1116)

Create a copy of this mobject as a target for MoveToTarget animation.
Modify the returned copy, then play `new MoveToTarget(this)` to
smoothly interpolate from the current state to the target.

#### Returns

[`Mobject`](Mobject.md)

The target copy for modification

#### Example

```ts
mob.generateTarget();
mob.targetCopy!.shift([2, 0, 0]);
mob.targetCopy!.setColor('red');
await scene.play(new MoveToTarget(mob));
```

#### Inherited from

[`Text`](Text.md).[`generateTarget`](Text.md#generatetarget)

***

### getAlignment()

> **getAlignment**(): `"center"` \| `"left"` \| `"right"` \| `"justify"`

Defined in: [mobjects/text/Paragraph.ts:83](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L83)

Get the paragraph alignment

#### Returns

`"center"` \| `"left"` \| `"right"` \| `"justify"`

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:777](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L777)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getBottom`](Text.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:640](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L640)

Get the bounding box of this mobject in world coordinates.

#### Returns

`object`

Object with min and max Vector3Tuple

##### max

> **max**: `object`

###### max.x

> **x**: `number`

###### max.y

> **y**: `number`

###### max.z

> **z**: `number`

##### min

> **min**: `object`

###### min.x

> **x**: `number`

###### min.y

> **y**: `number`

###### min.z

> **z**: `number`

#### Inherited from

[`Text`](Text.md).[`getBounds`](Text.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/text/Text.ts:545](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L545)

Get the center of this text mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Text`](Text.md).[`getCenter`](Text.md#getcenter)

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:761](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L761)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getEdge`](Text.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:967](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L967)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Text`](Text.md).[`getFamily`](Text.md#getfamily)

***

### getFontFamily()

> **getFontFamily**(): `string`

Defined in: [mobjects/text/Text.ts:222](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L222)

Get the current font family

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`getFontFamily`](Text.md#getfontfamily)

***

### getFontSize()

> **getFontSize**(): `number`

Defined in: [mobjects/text/Text.ts:201](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L201)

Get the current font size

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getFontSize`](Text.md#getfontsize)

***

### getGlyphGroup()

> **getGlyphGroup**(): [`TextGlyphGroup`](TextGlyphGroup.md)

Defined in: [mobjects/text/Text.ts:494](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L494)

Get the cached TextGlyphGroup (null until loadGlyphs() resolves).

#### Returns

[`TextGlyphGroup`](TextGlyphGroup.md)

#### Inherited from

[`Text`](Text.md).[`getGlyphGroup`](Text.md#getglyphgroup)

***

### getHeight()

> **getHeight**(): `number`

Defined in: [mobjects/text/Text.ts:250](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L250)

Get text height in world units

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getHeight`](Text.md#getheight)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:785](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L785)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getLeft`](Text.md#getleft)

***

### getMaxWidth()

> **getMaxWidth**(): `number`

Defined in: [mobjects/text/Paragraph.ts:63](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L63)

Get the maximum width for text wrapping

#### Returns

`number`

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VMobject.ts:193](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L193)

Get all points defining this VMobject as 3D arrays

#### Returns

`number`[][]

Copy of the points array

#### Inherited from

[`Text`](Text.md).[`getPoints`](Text.md#getpoints)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:793](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L793)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getRight`](Text.md#getright)

***

### getText()

> **getText**(): `string`

Defined in: [mobjects/text/Text.ts:180](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L180)

Get the current text content

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`getText`](Text.md#gettext)

***

### getTextureMesh()

> **getTextureMesh**(): `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\>

Defined in: [mobjects/text/Text.ts:538](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L538)

Get the texture mesh (for animation cross-fade access).

#### Returns

`Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Inherited from

[`Text`](Text.md).[`getTextureMesh`](Text.md#gettexturemesh)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:940](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L940)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Text`](Text.md).[`getThreeObject`](Text.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:769](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L769)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getTop`](Text.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1329](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L1329)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Text`](Text.md).[`getUnitVector`](Text.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1023](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1023)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Text`](Text.md).[`getUpdaters`](Text.md#getupdaters)

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:223](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L223)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Text`](Text.md).[`getVisiblePoints`](Text.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:231](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L231)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`Text`](Text.md).[`getVisiblePoints3D`](Text.md#getvisiblepoints3d)

***

### getWidth()

> **getWidth**(): `number`

Defined in: [mobjects/text/Text.ts:243](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L243)

Get text width in world units

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getWidth`](Text.md#getwidth)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1015](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1015)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Text`](Text.md).[`hasUpdaters`](Text.md#hasupdaters)

***

### interpolate()

> **interpolate**(`target`, `alpha`): `this`

Defined in: [core/VMobject.ts:342](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L342)

Interpolate this VMobject towards a target VMobject

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to interpolate towards

##### alpha

`number`

Progress from 0 (this) to 1 (target)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`interpolate`](Text.md#interpolate)

***

### loadGlyphs()

> **loadGlyphs**(`options?`): `Promise`\<[`TextGlyphGroup`](TextGlyphGroup.md)\>

Defined in: [mobjects/text/Text.ts:507](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L507)

Lazily create a TextGlyphGroup from the font file at _fontUrl.
Returns null if no fontUrl was provided.

#### Parameters

##### options?

###### skeletonOptions?

[`SkeletonizeOptions`](../interfaces/SkeletonizeOptions.md)

Fine-tuning options for the skeletonization
  algorithm (grid resolution, smoothing, etc.).

###### useSkeletonStroke?

`boolean`

When true, each glyph computes its
  skeleton (medial axis) for center-line stroke animation. Default: false.

#### Returns

`Promise`\<[`TextGlyphGroup`](TextGlyphGroup.md)\>

#### Inherited from

[`Text`](Text.md).[`loadGlyphs`](Text.md#loadglyphs)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L215)

Move the mobject to an absolute position, or align with another Mobject.

#### Parameters

##### target

Target position [x, y, z] or Mobject to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge direction to align (e.g., UL aligns upper-left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`moveTo`](Text.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:718](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L718)

Move this mobject to align its center with a point or mobject center

#### Parameters

##### target

Target mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge to align instead of centers

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`moveToAligned`](Text.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L664)

Position this mobject next to another mobject

#### Parameters

##### target

The mobject to position next to

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `RIGHT`

Direction from target (e.g., RIGHT, UP)

##### buff

`number` = `0.25`

Buffer distance between mobjects, default 0.25

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`nextTo`](Text.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1068](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1068)

Subdivide every VMobject descendant's cubic Bezier curves so that non-linear
transforms produce smooth results. Each cubic segment is split into n sub-segments
via de Casteljau evaluation.

#### Parameters

##### numPieces

`number` = `50`

Number of sub-segments per original cubic segment (default 50)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`prepareForNonlinearTransform`](Text.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:517](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L517)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`remove`](Text.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:994](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L994)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`removeUpdater`](Text.md#removeupdater)

***

### replace()

> **replace**(`target`, `stretch`): `this`

Defined in: [core/Mobject.ts:593](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L593)

Scale and reposition this mobject to match another mobject's bounding box.
Matches Manim Python's replace() behavior.

#### Parameters

##### target

[`Mobject`](Mobject.md)

The mobject whose bounding box to match

##### stretch

`boolean` = `false`

If true, stretch per-axis to match exactly; if false (default), uniform scale to match width

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`replace`](Text.md#replace)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1162](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1162)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Text`](Text.md).[`restoreState`](Text.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L245)

Rotate the mobject around an axis
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axisOrOptions?

Axis of rotation [x, y, z] (defaults to Z axis), or options object

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) | \{ `aboutPoint?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); `axis?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); \}

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`rotate`](Text.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L355)

Rotate the mobject about the coordinate origin [0, 0, 0].

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis of rotation (defaults to Z axis [0, 0, 1])

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`rotateAboutOrigin`](Text.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1137](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1137)

Save the current state of this mobject so it can be restored later.
Stores a deep copy on `this.savedState` (for Restore animation
compatibility) and a serializable snapshot on `this.__savedMobjectState`
(for restoreState).

#### Returns

`this`

this for chaining

#### Example

```ts
mob.saveState();
mob.shift([2, 0, 0]);
mob.setColor('red');
mob.restoreState(); // back to original position and color
```

#### Inherited from

[`Text`](Text.md).[`saveState`](Text.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`scale`](Text.md#scale)

***

### setAlignment()

> **setAlignment**(`alignment`): `this`

Defined in: [mobjects/text/Paragraph.ts:92](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L92)

Set paragraph alignment

#### Parameters

##### alignment

Text alignment

`"center"` | `"left"` | `"right"` | `"justify"`

#### Returns

`this`

this for chaining

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Mobject.ts:398](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L398)

Set the mobject's color
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setColor`](Text.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:460](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L460)

Set the fill color and/or opacity (Manim Python parity: set_fill)

#### Parameters

##### color?

`string`

CSS color string (optional)

##### opacity?

`number`

Fill opacity 0-1 (optional)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFill`](Text.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:444](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L444)

Set the fill opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFillOpacity`](Text.md#setfillopacity)

***

### setFontFamily()

> **setFontFamily**(`family`): `this`

Defined in: [mobjects/text/Text.ts:231](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L231)

Set font family and re-render

#### Parameters

##### family

`string`

CSS font family string

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFontFamily`](Text.md#setfontfamily)

***

### setFontSize()

> **setFontSize**(`size`): `this`

Defined in: [mobjects/text/Text.ts:210](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L210)

Set font size and re-render

#### Parameters

##### size

`number`

Font size in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFontSize`](Text.md#setfontsize)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:412](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L412)

Set the mobject's overall opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setOpacity`](Text.md#setopacity)

***

### setPoints()

> **setPoints**(`points`): `this`

Defined in: [core/VMobject.ts:160](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L160)

Set the points defining this VMobject.
Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).

#### Parameters

##### points

Array of points in either format

`number`[][] | [`Point`](../interfaces/Point.md)[]

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPoints`](Text.md#setpoints)

***

### setPoints3D()

> **setPoints3D**(`points`): `this`

Defined in: [core/VMobject.ts:185](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L185)

Set the points defining this VMobject using 3D arrays (alias for setPoints with number[][])

#### Parameters

##### points

`number`[][]

Array of [x, y, z] control points for cubic Bezier curves

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPoints3D`](Text.md#setpoints3d)

***

### setPointsAsCorners()

> **setPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:253](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L253)

Set the points to form straight line segments between corner points.
Each pair of consecutive corners becomes a cubic Bezier with linear handles.
Matches Manim's set_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPointsAsCorners`](Text.md#setpointsascorners)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:428](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L428)

Set the stroke width for outlines
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setStrokeWidth`](Text.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setStyle`](Text.md#setstyle)

***

### setText()

> **setText**(`text`): `this`

Defined in: [mobjects/text/Text.ts:189](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Text.ts#L189)

Set new text content and re-render

#### Parameters

##### text

`string`

New text to display

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setText`](Text.md#settext)

***

### setWidth()

> **setWidth**(`width`): `this`

Defined in: [mobjects/text/Paragraph.ts:72](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Paragraph.ts#L72)

Set maximum width and trigger re-wrap

#### Parameters

##### width

`number`

Maximum width in world units

#### Returns

`this`

this for chaining

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:801](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L801)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setX`](Text.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:810](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L810)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setY`](Text.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:819](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L819)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setZ`](Text.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`shift`](Text.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:860](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L860)

Move to a corner of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `UR`

Corner direction (e.g., UR for upper right)

##### buff

`number` = `0.5`

Buffer from edges

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`toCorner`](Text.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:838](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L838)

Move to the edge of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to move towards

##### buff

`number` = `0.5`

Buffer from edge

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`toEdge`](Text.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1032](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1032)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`update`](Text.md#update)

***

### \_toLinewidth()

> `static` **\_toLinewidth**(`strokeWidth`): `number`

Defined in: [core/VMobject.ts:74](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/VMobject.ts#L74)

Convert Manim-compatible strokeWidth to LineMaterial linewidth in pixels.
Python Manim uses cairo_line_width_multiple=0.01, so:
  linewidth_px = strokeWidth * 0.01 * (rendererWidth / frameWidth)

#### Parameters

##### strokeWidth

`number`

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`_toLinewidth`](Text.md#_tolinewidth)
